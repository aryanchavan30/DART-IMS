from datetime import datetime
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import ExtensionPermission, ExtensionRequest
from .serializers import ExtensionPermissionSerializer, ExtensionRequestSerializer
from users.models import User
from interns.models import Intern


class ExtensionPermissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ExtensionPermission model.
    Provides CRUD operations and custom actions for HR/HOD approvals.
    """
    queryset = ExtensionPermission.objects.all()
    serializer_class = ExtensionPermissionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Return all extension permissions with related data"""
        return ExtensionPermission.objects.select_related(
            'intern',
            'intern__user',
            'intern__candidate',
            'intern__candidate__department',
            'hr_approved_by',
            'hod_approved_by'
        ).all()

    def retrieve(self, request, *args, **kwargs):
        """Get a specific extension permission with full details"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def hr_approve(self, request, pk=None):
        """
        HR approves or rejects extension permission
        """
        print("--- HR Approve Action Triggered ---")
        print(f"Request User: {request.user}")
        print(f"Request Data: {request.data}")

        try:
            permission = self.get_object()
            print(f"Found Permission Object: {permission.id} for Intern: {permission.intern.id}")
        except Exception as e:
            print(f"Error getting permission object: {e}")
            return Response({'error': 'Permission object not found.'}, status=status.HTTP_404_NOT_FOUND)

        approved = request.data.get('approved', False)
        comments = request.data.get('comments', '')

        print(f"Approved status from request: {approved} (Type: {type(approved)})")
        print(f"Comments from request: {comments}")

        # Storing old values for comparison
        old_hr_approved = permission.hr_approved
        old_hr_approved_at = permission.hr_approved_at

        print(f"Old HR Approved Status: {old_hr_approved}")
        print(f"Old HR Approved At: {old_hr_approved_at}")

        permission.hr_approved = approved
        permission.hr_approved_at = timezone.now()
        permission.hr_comments = comments
        
        # It's good practice to also log who approved it, assuming you have user authentication
        # if hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
        #     permission.hr_approved_by = request.user
        
        try:
            permission.save()
            print("Permission object saved successfully.")
        except Exception as e:
            print(f"Error saving permission object: {e}")
            return Response({'error': 'Failed to save permission update.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Refresh from DB to ensure it was saved correctly
        permission.refresh_from_db()
        print(f"New HR Approved Status from DB: {permission.hr_approved}")
        print(f"New HR Approved At from DB: {permission.hr_approved_at}")
        print(f"New HR Comments from DB: {permission.hr_comments}")

        response_data = {
            'message': f'HR {"approved" if approved else "rejected"} extension permission',
            'hr_approved': permission.hr_approved,
            'hr_approved_at': permission.hr_approved_at
        }
        
        print(f"Response Data: {response_data}")
        print("--- HR Approve Action Finished ---")

        return Response(response_data)

    @action(detail=True, methods=['post'])
    def hod_approve(self, request, pk=None):
        """
        HOD approves or rejects extension permission
        """
        permission = self.get_object()
        approved = request.data.get('approved', False)
        comments = request.data.get('comments', '')

        permission.hod_approved = approved
        permission.hod_approved_at = timezone.now()
        permission.hod_comments = comments
        permission.save()

        return Response({
            'message': f'HOD {"approved" if approved else "rejected"} extension permission',
            'hod_approved': permission.hod_approved,
            'hod_approved_at': permission.hod_approved_at
        })

    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """
        Get all extension permissions pending approval
        """
        pending = ExtensionPermission.objects.filter(
            hr_approved=False
        ).select_related(
            'intern',
            'intern__user',
            'intern__candidate',
            'intern__candidate__department'
        )

        from .serializers import ExtensionPermissionSerializer
        serializer = ExtensionPermissionSerializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_for_intern(self, request):
        """
        Create extension permission for a specific intern
        """
        intern_id = request.data.get('intern_id')
        if not intern_id:
            return Response(
                {'error': 'intern_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from interns.models import Intern
        from .serializers import ExtensionPermissionSerializer

        try:
            intern = Intern.objects.get(id=intern_id)
        except Intern.DoesNotExist:
            return Response(
                {'error': 'Intern not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if permission already exists
        if ExtensionPermission.objects.filter(intern=intern).exists():
            return Response(
                {'error': 'Extension permission already exists for this intern'},
                status=status.HTTP_400_BAD_REQUEST
            )

        permission = ExtensionPermission.objects.create(
            id=f"ext_perm_{intern.id}_{int(timezone.now().timestamp())}", # <-- Use int() here
            intern=intern
        )

        serializer = ExtensionPermissionSerializer(permission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# class ExtensionRequestViewSet(viewsets.ModelViewSet):
#     """
#     ViewSet for ExtensionRequest model.
#     Provides CRUD operations for extension requests.
#     """
#     queryset = ExtensionRequest.objects.all()
#     serializer_class = ExtensionRequestSerializer
#     permission_classes = [AllowAny]

#     def get_queryset(self):
#         """Return all extension requests with related data"""
#         return ExtensionRequest.objects.select_related(
#             'intern',
#             'intern__user',
#             'intern__candidate',
#             'intern__candidate__department'
#         ).all()

#     def perform_create(self, serializer):
#         """Create a new extension request with auto-generated ID"""
#         # Generate ID if not provided
#         if not serializer.validated_data.get('id'):
#             serializer.save(id=f"ext_req_{timezone.now().timestamp()}")
#         else:
#             serializer.save()

#     @action(detail=False, methods=['get'])
#     def by_intern(self, request):
#         """
#         Get extension requests for a specific intern
#         """
#         intern_id = request.query_params.get('intern_id')
#         if not intern_id:
#             return Response(
#                 {'error': 'intern_id query parameter is required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         requests = ExtensionRequest.objects.filter(intern_id=intern_id).select_related(
#             'intern',
#             'intern__user',
#             'intern__candidate',
#             'intern__candidate__department'
#         )

#         serializer = ExtensionRequestSerializer(requests, many=True)
#         return Response(serializer.data)


class ExtensionRequestViewSet(viewsets.ModelViewSet):
    queryset = ExtensionRequest.objects.all()
    serializer_class = ExtensionRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [User.Role.HR, User.Role.HOD]:
            return ExtensionRequest.objects.all()
        elif user.role == User.Role.MENTOR:
            return ExtensionRequest.objects.filter(intern__mentor=user)
        elif user.role == User.Role.INTERN:
            try:
                intern = Intern.objects.get(user=self.request.user)
                return ExtensionRequest.objects.filter(intern=intern)
            except Intern.DoesNotExist:
                return ExtensionRequest.objects.none()
        return ExtensionRequest.objects.none()
    
    def perform_create(self, serializer):
        extension_id = f"e_{int(datetime.now().timestamp())}"
        if self.request.user.role == User.Role.INTERN:
            try:
                intern = Intern.objects.get(user=self.request.user)
                serializer.save(id=extension_id, intern=intern)
            except Intern.DoesNotExist:
                from rest_framework import serializers as drf_serializers
                raise drf_serializers.ValidationError("Intern profile not found")
        else:
            serializer.save(id=extension_id)
    
    def partial_update(self, request, *args, **kwargs):
        # Override partial_update to handle approval-only updates
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

