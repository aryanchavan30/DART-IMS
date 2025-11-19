from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Intern, Attendance, AttendanceTicket
from .serializers import InternSerializer, AttendanceSerializer, AttendanceTicketSerializer
from users.models import User
from holidays.models import Holiday

class InternViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Intern model.
    """
    queryset = Intern.objects.all()
    serializer_class = InternSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return all interns with related data, filtered by user role.
        HR, HOD, and Mentors can see all interns.
        Interns can only see themselves.
        """
        user = self.request.user

        if not user.is_authenticated:
            return Intern.objects.none()

        if user.role in [User.Role.HR, User.Role.HOD, User.Role.MENTOR]:
            # HR, HOD, and Mentors can see all interns
            return Intern.objects.select_related(
                'user',
                'user__department',
                'candidate',
                'mentor'
            ).all()
        elif user.role == User.Role.INTERN:
            # Interns can only see their own record
            return Intern.objects.select_related(
                'user',
                'user__department',
                'candidate',
                'mentor'
            ).filter(user=user)
        else:
            # Default: only see own record
            return Intern.objects.select_related(
                'user',
                'user__department',
                'candidate',
                'mentor'
            ).filter(user=user)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Custom action to update intern status.
        """
        intern = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(Intern.InternStatus.choices):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        intern.status = new_status
        intern.save()

        serializer = self.get_serializer(intern)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def upload_offer_letter(self, request, pk=None):
        """
        Upload offer letter for an intern.
        """
        intern = self.get_object()

        if 'offer_letter' not in request.FILES:
            return Response(
                {'error': 'No file uploaded'},
                status=status.HTTP_400_BAD_REQUEST
            )

        offer_letter_file = request.FILES['offer_letter']
        intern.offer_letter = offer_letter_file
        intern.save()

        serializer = self.get_serializer(intern)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def upload_documents(self, request, pk=None):
        """
        Upload onboarding documents for an intern (HR only).
        """
        user = request.user

        # Check if user is HR
        if user.role != User.Role.HR:
            return Response(
                {'error': 'Only HR can upload intern documents'},
                status=status.HTTP_403_FORBIDDEN
            )

        intern = self.get_object()

        updated_fields = []

        if 'aadhar_card' in request.FILES:
            intern.aadhar_card = request.FILES['aadhar_card']
            updated_fields.append('aadhar_card')

        if 'pan_card' in request.FILES:
            intern.pan_card = request.FILES['pan_card']
            updated_fields.append('pan_card')

        if 'bank_passbook' in request.FILES:
            intern.bank_passbook = request.FILES['bank_passbook']
            updated_fields.append('bank_passbook')

        intern.save()

        serializer = self.get_serializer(intern)
        return Response({
            'message': 'Documents uploaded successfully',
            'updated_fields': updated_fields,
            'intern': serializer.data
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attendance model.
    Manages daily attendance records with role-based access.
    """
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return attendance records based on user role and query params.
        - Interns: Only their own attendance
        - HR/HOD/Mentor: All attendance or filtered by intern_id
        """
        user = self.request.user
        queryset = Attendance.objects.select_related('intern__user', 'marked_by').prefetch_related('tickets')

        # Filter by role
        if user.role == User.Role.INTERN:
            # Interns can only see their own attendance
            try:
                intern_profile = Intern.objects.get(user=user)
                queryset = queryset.filter(intern=intern_profile)
            except Intern.DoesNotExist:
                return Attendance.objects.none()
        elif user.role in [User.Role.HR, User.Role.HOD, User.Role.MENTOR]:
            # HR, HOD, Mentors can see all or filter by intern
            intern_id = self.request.query_params.get('intern_id', None)
            if intern_id:
                queryset = queryset.filter(intern_id=intern_id)
        else:
            return Attendance.objects.none()

        # Filter by month if provided
        month = self.request.query_params.get('month', None)
        if month:
            try:
                # Expected format: YYYY-MM
                year, month_num = month.split('-')
                queryset = queryset.filter(date__year=year, date__month=month_num)
            except ValueError:
                pass

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(date__gte=start_date, date__lte=end_date)

        return queryset.order_by('-date')

    def create(self, request, *args, **kwargs):
        """
        Create or update attendance record.
        Interns can only mark their own attendance for today.
        HR can create/update any attendance.
        """
        user = request.user
        date_str = request.data.get('date')
        attendance_status = request.data.get('status', 'Present')

        # Parse date
        try:
            attendance_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            attendance_date = timezone.now().date()

        # Get intern profile
        if user.role == User.Role.INTERN:
            # Interns can only mark today's attendance
            if attendance_date != timezone.now().date():
                return Response(
                    {'error': 'Interns can only mark attendance for today'},
                    status=status.HTTP_403_FORBIDDEN
                )
            try:
                intern_profile = Intern.objects.get(user=user)
            except Intern.DoesNotExist:
                return Response(
                    {'error': 'Intern profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif user.role in [User.Role.HR, User.Role.HOD]:
            # HR/HOD can mark attendance for any intern
            intern_id = request.data.get('intern')
            if not intern_id:
                return Response(
                    {'error': 'Intern ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                intern_profile = Intern.objects.get(id=intern_id)
            except Intern.DoesNotExist:
                return Response(
                    {'error': 'Intern not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if attendance already exists
        attendance, created = Attendance.objects.get_or_create(
            intern=intern_profile,
            date=attendance_date,
            defaults={
                'status': attendance_status,
                'marked_by': user,
                'notes': request.data.get('notes', '')
            }
        )

        if not created:
            # Update existing attendance
            attendance.status = attendance_status
            attendance.marked_by = user
            attendance.notes = request.data.get('notes', attendance.notes)
            attendance.save()

        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_today(self, request):
        """
        Quick action for interns to mark today's attendance as present.
        """
        user = request.user
        if user.role != User.Role.INTERN:
            return Response(
                {'error': 'Only interns can use this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            intern_profile = Intern.objects.get(user=user)
        except Intern.DoesNotExist:
            return Response(
                {'error': 'Intern profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        today = timezone.now().date()

        # Create or update today's attendance
        attendance, created = Attendance.objects.get_or_create(
            intern=intern_profile,
            date=today,
            defaults={
                'status': 'Present',
                'marked_by': user
            }
        )

        if not created:
            attendance.status = 'Present'
            attendance.marked_by = user
            attendance.save()

        serializer = self.get_serializer(attendance)
        return Response({
            'message': 'Attendance marked successfully',
            'attendance': serializer.data
        })

    @action(detail=False, methods=['get'])
    def my_attendance(self, request):
        """
        Get attendance for the current intern user.
        """
        user = request.user
        if user.role != User.Role.INTERN:
            return Response(
                {'error': 'Only interns can use this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            intern_profile = Intern.objects.get(user=user)
        except Intern.DoesNotExist:
            return Response(
                {'error': 'Intern profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        month = request.query_params.get('month')
        queryset = Attendance.objects.filter(intern=intern_profile)

        if month:
            try:
                year, month_num = month.split('-')
                queryset = queryset.filter(date__year=year, date__month=month_num)
            except ValueError:
                pass

        queryset = queryset.order_by('-date')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update attendance status (HR only).
        """
        user = request.user
        if user.role not in [User.Role.HR, User.Role.HOD]:
            return Response(
                {'error': 'Only HR/HOD can update attendance status'},
                status=status.HTTP_403_FORBIDDEN
            )

        attendance = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(Attendance.AttendanceStatus.choices):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attendance.status = new_status
        attendance.marked_by = user
        attendance.notes = request.data.get('notes', attendance.notes)
        attendance.save()

        serializer = self.get_serializer(attendance)
        return Response(serializer.data)


class AttendanceTicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AttendanceTicket model.
    Manages correction requests for attendance records.
    """
    queryset = AttendanceTicket.objects.all()
    serializer_class = AttendanceTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return tickets based on user role.
        - Interns: Only their own tickets
        - HR/HOD: All tickets or filtered by status
        """
        user = self.request.user
        queryset = AttendanceTicket.objects.select_related(
            'intern__user', 'attendance', 'reviewed_by'
        )

        if user.role == User.Role.INTERN:
            # Interns see only their tickets
            try:
                intern_profile = Intern.objects.get(user=user)
                queryset = queryset.filter(intern=intern_profile)
            except Intern.DoesNotExist:
                return AttendanceTicket.objects.none()
        elif user.role in [User.Role.HR, User.Role.HOD]:
            # HR/HOD see all tickets or filtered
            ticket_status = self.request.query_params.get('status', None)
            if ticket_status:
                queryset = queryset.filter(status=ticket_status)

            intern_id = self.request.query_params.get('intern_id', None)
            if intern_id:
                queryset = queryset.filter(intern_id=intern_id)
        else:
            return AttendanceTicket.objects.none()

        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """
        Create a new attendance correction ticket (Intern only).
        """
        user = request.user
        if user.role != User.Role.INTERN:
            return Response(
                {'error': 'Only interns can create tickets'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            intern_profile = Intern.objects.get(user=user)
        except Intern.DoesNotExist:
            return Response(
                {'error': 'Intern profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        attendance_id = request.data.get('attendance')
        reason = request.data.get('reason')
        requested_status = request.data.get('requested_status', 'Present')

        if not attendance_id or not reason:
            return Response(
                {'error': 'Attendance ID and reason are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            attendance = Attendance.objects.get(id=attendance_id, intern=intern_profile)
        except Attendance.DoesNotExist:
            return Response(
                {'error': 'Attendance record not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if there's already a pending ticket for this attendance
        existing_ticket = AttendanceTicket.objects.filter(
            attendance=attendance,
            status='Pending'
        ).first()

        if existing_ticket:
            return Response(
                {'error': 'A pending ticket already exists for this date'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket = AttendanceTicket.objects.create(
            attendance=attendance,
            intern=intern_profile,
            reason=reason,
            requested_status=requested_status
        )

        serializer = self.get_serializer(ticket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """
        Review and approve/reject a ticket (HR/HOD only).
        """
        user = request.user
        if user.role not in [User.Role.HR, User.Role.HOD]:
            return Response(
                {'error': 'Only HR/HOD can review tickets'},
                status=status.HTTP_403_FORBIDDEN
            )

        ticket = self.get_object()
        approved = request.data.get('approved', False)
        review_comments = request.data.get('comments', '')

        if ticket.status != 'Pending':
            return Response(
                {'error': 'This ticket has already been reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if approved:
            # Approve ticket and update attendance
            ticket.status = 'Approved'
            ticket.reviewed_by = user
            ticket.review_comments = review_comments
            ticket.save()

            # Update attendance status
            attendance = ticket.attendance
            attendance.status = ticket.requested_status
            attendance.marked_by = user
            attendance.notes = f"Updated via ticket: {review_comments}"
            attendance.save()

            message = 'Ticket approved and attendance updated'
        else:
            # Reject ticket
            ticket.status = 'Rejected'
            ticket.reviewed_by = user
            ticket.review_comments = review_comments
            ticket.save()

            message = 'Ticket rejected'

        serializer = self.get_serializer(ticket)
        return Response({
            'message': message,
            'ticket': serializer.data
        })

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        """
        Get all tickets for the current intern user.
        """
        user = request.user
        if user.role != User.Role.INTERN:
            return Response(
                {'error': 'Only interns can use this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            intern_profile = Intern.objects.get(user=user)
        except Intern.DoesNotExist:
            return Response(
                {'error': 'Intern profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        tickets = AttendanceTicket.objects.filter(intern=intern_profile).order_by('-created_at')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending tickets (HR/HOD only).
        """
        user = request.user
        if user.role not in [User.Role.HR, User.Role.HOD]:
            return Response(
                {'error': 'Only HR/HOD can view pending tickets'},
                status=status.HTTP_403_FORBIDDEN
            )

        tickets = AttendanceTicket.objects.filter(status='Pending').order_by('-created_at')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)
