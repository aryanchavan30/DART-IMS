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
        
        if user.role in [User.Role.HR, User.Role.HOD, User.Role.MENTOR, User.Role.INTERN]:
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
