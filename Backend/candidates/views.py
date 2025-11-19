from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import Candidate
from .serializers import CandidateSerializer
from users.models import User
from webhooks.models import JotFormCandidate


class CandidateStatus:
    PENDING_ASSIGNMENT = 'Pending Mentor Assignment'
    PENDING_INTERVIEW = 'Pending Interview Assessment'
    PENDING_HOD_APPROVAL = 'Pending HOD Approval'
    REJECTED = 'Rejected'
    SELECTED = 'Selected'
    ONBOARDED = 'Onboarded'

class CandidateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Candidate model.
    """
    queryset = Candidate.objects.select_related('assigned_mentor', 'department').all()
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return candidates with related data, filtered by user role.
        - HR: see all candidates (with pagination), or filtered by status query param
        - HOD: see only candidates in their departments
        - MENTOR: see only their assigned candidates (no pagination)
        - INTERN: see only their own candidate record
        """
        user = self.request.user

        if not user.is_authenticated:
            return Candidate.objects.none()

        # Check if status filter is provided
        status_filter = self.request.query_params.get('status')

        if user.role == User.Role.HR:
            # HR can see all candidates, or filtered by status
            queryset = Candidate.objects.select_related(
                'assigned_mentor',
                'department'
            )
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset
        elif user.role == User.Role.HOD:
            # HOD: Only see candidates in their departments
            print(f"🔍 DEBUG: Filtering candidates for HOD {user.name} (ID: {user.id})")
            # Get departments where this user is HOD
            from departments.models import Department
            hod_departments = Department.objects.filter(hod=user)
            queryset = Candidate.objects.select_related(
                'assigned_mentor',
                'department'
            ).filter(department__in=hod_departments)
            print(f"🔍 DEBUG: Found {queryset.count()} candidates in HOD's departments")
            return queryset
        elif user.role == User.Role.MENTOR:
            # MENTORS: Only see candidates assigned to them
            print(f"🔍 DEBUG: Filtering candidates for mentor {user.name} (ID: {user.id})")
            queryset = Candidate.objects.select_related(
                'assigned_mentor',
                'department'
            ).filter(assigned_mentor=user)
            print(f"🔍 DEBUG: Found {queryset.count()} candidates assigned to this mentor")
            return queryset
        elif user.role == User.Role.INTERN:
            # Interns can only see their own candidate record
            return Candidate.objects.select_related(
                'assigned_mentor',
                'department'
            ).filter(
                models.Q(intern_profile__user=user)
            )
        else:
            # Default: see all
            return Candidate.objects.select_related(
                'assigned_mentor',
                'department'
            ).all()

    @action(detail=True, methods=['post'])
    def assign_mentor(self, request, pk=None):
        """
        Assign a mentor to a candidate.
        """
        print(f"\n🔍 DEBUG BACKEND: assign_mentor called for candidate {pk}")
        print(f"🔍 DEBUG BACKEND: Request data: {request.data}")

        candidate = self.get_object()
        print(f"🔍 DEBUG BACKEND: Got candidate: {candidate.name}, current status: {candidate.status}")

        mentor_id = request.data.get('mentor_id')
        print(f"🔍 DEBUG BACKEND: mentor_id from request: {mentor_id}")

        if not mentor_id:
            print(f"🔍 DEBUG BACKEND: No mentor_id provided")
            return Response(
                {'error': 'mentor_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            mentor = User.objects.get(id=mentor_id, role=User.Role.MENTOR)
            print(f"🔍 DEBUG BACKEND: Found mentor: {mentor.name} (id: {mentor.id})")
        except User.DoesNotExist:
            print(f"🔍 DEBUG BACKEND: Mentor not found with id {mentor_id}")
            return Response(
                {'error': 'Mentor not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        candidate.assigned_mentor = mentor
        candidate.status = Candidate.CandidateStatus.PENDING_INTERVIEW
        candidate.save()

        print(f"🔍 DEBUG BACKEND: Saved candidate with mentor_id: {mentor.id}, status: {candidate.status}")

        # Also update the JotFormCandidate model to keep both models in sync
        try:
            jotform_candidate = JotFormCandidate.objects.get(jotform_submission_id=candidate.id)
            jotform_candidate.assigned_mentor = mentor.id
            jotform_candidate.assigned_mentor_name = mentor.name
            jotform_candidate.status = 'Pending Interview Assessment'
            jotform_candidate.save()
            print(f"🔍 DEBUG BACKEND: Updated JotFormCandidate with mentor assignment")
        except JotFormCandidate.DoesNotExist:
            print(f"🔍 DEBUG BACKEND: No JotFormCandidate found for ID {candidate.id}, skipping sync")

        # Reload the candidate with select_related to ensure fresh data
        candidate = self.get_queryset().get(pk=pk)
        print(f"🔍 DEBUG BACKEND: Reloaded candidate from queryset")

        serializer = self.get_serializer(candidate)
        print(f"🔍 DEBUG BACKEND: Serialized data includes:")
        print(f"  - id: {serializer.data.get('id')}")
        print(f"  - assigned_mentor_id: {serializer.data.get('assigned_mentor_id')}")
        print(f"  - status: {serializer.data.get('status')}")

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit_interview(self, request, pk=None):
        """
        Submit interview feedback for a candidate.
        """
        candidate = self.get_object()
        feedback = request.data.get('feedback')
        approved = request.data.get('approved', False)

        if feedback is None:
            return Response(
                {'error': 'feedback is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        candidate.interview_feedback = feedback
        # Set status to PENDING_HOD_APPROVAL if approved, not directly to SELECTED
        # HOD needs to approve first before candidate becomes SELECTED
        candidate.status = Candidate.CandidateStatus.PENDING_HOD_APPROVAL if approved else Candidate.CandidateStatus.REJECTED
        candidate.save()

        print(f"🔍 DEBUG BACKEND: Interview submitted for {candidate.name}, new status: {candidate.status}")

        serializer = self.get_serializer(candidate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def process_approval(self, request, pk=None):
        """
        Process HOD approval for a candidate.
        """
        candidate = self.get_object()
        approved = request.data.get('approved', False)
        feedback = request.data.get('feedback', '')

        candidate.hod_feedback = feedback
        if approved:
            candidate.status = Candidate.CandidateStatus.SELECTED
        else:
            candidate.status = Candidate.CandidateStatus.REJECTED
        candidate.save()

        serializer = self.get_serializer(candidate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def onboard(self, request, pk=None):
        """
        Onboard a selected candidate (create user and intern records).
        """
        candidate = self.get_object()

        if candidate.status != Candidate.CandidateStatus.SELECTED:
            return Response(
                {'error': 'Only selected candidates can be onboarded'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # This is a placeholder - actual implementation would create User and Intern records
        # For now, just mark as onboarded
        candidate.status = Candidate.CandidateStatus.ONBOARDED
        candidate.save()

        serializer = self.get_serializer(candidate)
        return Response({
            'message': 'Candidate onboarded successfully',
            'intern_id': f'i_{candidate.id}'  # Placeholder
        })

    @action(detail=True, methods=['post'])
    def update_documents(self, request, pk=None):
        """
        Update candidate documents (resume, photo, signature, project report).
        """
        candidate = self.get_object()

        if 'resume' in request.FILES:
            candidate.resume = request.FILES['resume']

        if 'photo' in request.FILES:
            candidate.photo = request.FILES['photo']

        if 'signature' in request.FILES:
            candidate.signature = request.FILES['signature']

        if 'last_project_report' in request.FILES:
            candidate.last_project_report = request.FILES['last_project_report']

        candidate.save()

        serializer = self.get_serializer(candidate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_application(self, request, pk=None):
        """
        Update candidate application data (quest_data).
        """
        candidate = self.get_object()
        quest_data = request.data.get('quest_data', {})

        if not isinstance(quest_data, dict):
            return Response(
                {'error': 'quest_data must be a dictionary'},
                status=status.HTTP_400_BAD_REQUEST
            )

        candidate.quest_data = quest_data
        candidate.save()

        serializer = self.get_serializer(candidate)
        return Response(serializer.data)
