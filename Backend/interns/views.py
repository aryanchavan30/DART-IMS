from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import Intern
from .serializers import InternSerializer
from users.models import User

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
