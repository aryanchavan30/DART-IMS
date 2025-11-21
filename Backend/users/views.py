from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import models
from datetime import datetime

from .models import User
from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']
        
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if user.check_password(new_password):
            return Response({'error': 'New password must be different from current password'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password changed successfully'})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()

        # Admin can see all users
        if user.role == User.Role.ADMIN:
            return User.objects.all()

        if user.role in [User.Role.HR, User.Role.HOD, User.Role.MENTOR]:
            return User.objects.all()
        elif user.role == User.Role.INTERN:
            intern_department = user.department
            if intern_department:
                return User.objects.filter(
                    models.Q(role=User.Role.HR) |
                    models.Q(role=User.Role.HOD) |
                    models.Q(department=intern_department) |
                    models.Q(id=user.id)
                ).distinct()
            else:
                return User.objects.filter(
                    models.Q(role=User.Role.HR) |
                    models.Q(role=User.Role.HOD) |
                    models.Q(id=user.id)
                ).distinct()
        return User.objects.filter(id=user.id)

    @action(detail=False, methods=['post'])
    def switch_role(self, request):
        """
        Admin-only endpoint to switch to any role for testing/management.
        This creates a new token with the switched role context.
        """
        user = request.user
        if user.role != User.Role.ADMIN:
            return Response(
                {'error': 'Only Admin users can switch roles'},
                status=status.HTTP_403_FORBIDDEN
            )

        target_role = request.data.get('role')
        if not target_role:
            return Response(
                {'error': 'Role is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate role
        valid_roles = [choice[0] for choice in User.Role.choices]
        if target_role not in valid_roles:
            return Response(
                {'error': f'Invalid role. Choose from: {valid_roles}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Store original role before switching
        original_role = user.role

        # Temporarily switch role
        user.role = target_role
        user.save()

        # Generate new token with switched role
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': f'Switched from {original_role} to {target_role}',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'original_role': original_role,
            'current_role': target_role
        })

    @action(detail=False, methods=['post'])
    def reset_to_admin(self, request):
        """
        Reset user back to Admin role.
        """
        user = request.user
        if not user.is_superuser and user.role != User.Role.ADMIN:
            # Check if user was originally an admin (stored in session or token)
            return Response(
                {'error': 'Only Admin users can use this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.role = User.Role.ADMIN
        user.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Reset to Admin role',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })

    @action(detail=False, methods=['get'])
    def available_roles(self, request):
        """
        Get list of all available roles (Admin only).
        """
        user = request.user
        if user.role != User.Role.ADMIN:
            return Response(
                {'error': 'Only Admin users can view all roles'},
                status=status.HTTP_403_FORBIDDEN
            )

        roles = [{'value': choice[0], 'label': choice[1]} for choice in User.Role.choices]
        return Response({'roles': roles})
