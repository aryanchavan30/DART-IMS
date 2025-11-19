from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer
from users.models import User
from stipends.models import ApprovalStatus

from notifications.email_service import EmailService
import logging
logger = logging.getLogger(__name__)

class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LeaveRequest model.
    """
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]


    def perform_create(self, serializer):
        """
        Saves the leave request and then automatically sends the notification email.
        """
        leave_request = serializer.save()

        try:
            intern = leave_request.intern
            mentor = intern.mentor

            if mentor:
                hod = intern.user.department.hod if intern.user.department else None
                hr_user = User.objects.filter(role=User.Role.HR).first()
                hod_email = hod.email if hod else None
                hr_email = hr_user.email if hr_user else None

                EmailService.send_leave_request_notification(
                    mentor_email=mentor.email,
                    mentor_name=mentor.name,
                    hod_email=hod_email,
                    hr_email=hr_email,
                    intern_name=intern.user.name,
                    start_date=leave_request.start_date,
                    end_date=leave_request.end_date,
                    leave_type=leave_request.leave_type,
                    reason=leave_request.reason
                )
                logger.info(f"Leave request email sent for {intern.user.name} to mentor {mentor.email}")
            else:
                logger.warning(f"Could not send leave request email for {intern.user.name} because no mentor is assigned.")
        except Exception as e:
            logger.error(f"Failed to send leave request email for intern {leave_request.intern.id}: {e}")
            

    def get_queryset(self):
        """
        Return leave requests filtered by user role.
        HR, HOD can see all leave requests.
        Mentors can see leave requests for interns they mentor.
        Interns can only see their own leave requests.
        """
        user = self.request.user

        if not user.is_authenticated:
            return LeaveRequest.objects.none()

        if user.role in [User.Role.HR, User.Role.HOD]:
            # HR and HOD can see all leave requests
            return LeaveRequest.objects.select_related(
                'intern',
                'intern__user',
                'intern__user__department',
                'intern__mentor'
            ).all()
        elif user.role == User.Role.MENTOR:
            # Mentors can see leave requests for interns they mentor
            return LeaveRequest.objects.select_related(
                'intern',
                'intern__user',
                'intern__user__department',
                'intern__mentor'
            ).filter(intern__mentor=user)
        elif user.role == User.Role.INTERN:
            # Interns can only see their own leave requests
            return LeaveRequest.objects.select_related(
                'intern',
                'intern__user',
                'intern__user__department',
                'intern__mentor'
            ).filter(intern__user=user)
        else:
            # Default: no access
            return LeaveRequest.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a leave request (mentor action).
        """
        leave_request = self.get_object()
        mentor = request.user

        # Only the assigned mentor can approve
        if leave_request.intern.mentor != mentor:
            return Response(
                {'error': 'Only the assigned mentor can approve this leave request'},
                status=status.HTTP_403_FORBIDDEN
            )

        leave_request.status = ApprovalStatus.APPROVED
        leave_request.save()

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a leave request (mentor or HR action).
        """
        leave_request = self.get_object()
        user = request.user

        # Only the assigned mentor or HR can reject
        if leave_request.intern.mentor != user and user.role != User.Role.HR:
            return Response(
                {'error': 'Only the assigned mentor or HR can reject this leave request'},
                status=status.HTTP_403_FORBIDDEN
            )

        leave_request.status = ApprovalStatus.REJECTED
        leave_request.save()

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)
