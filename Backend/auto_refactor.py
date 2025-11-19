#!/usr/bin/env python3
import os
import re

def extract_class(content, class_name):
    """Extract a class definition from content"""
    pattern = rf'class {class_name}.*?(?=class|\Z)'
    match = re.search(pattern, content, re.DOTALL)
    return match.group(0) if match else None

def create_app_files():
    # os.chdir('server')
    
    # Read core files
    with open('core/views.py', 'r') as f:
        views = f.read()
    with open('core/serializers.py', 'r') as f:
        serializers = f.read()
    
    # App definitions
    apps = {
        'users': {
            'views': ['LoginView', 'CurrentUserView', 'ChangePasswordView', 'UserViewSet'],
            'serializers': ['UserSerializer', 'UserCreateSerializer', 'LoginSerializer', 'ChangePasswordSerializer'],
            'imports': 'from .models import User\nfrom .serializers import UserSerializer, UserCreateSerializer, LoginSerializer, ChangePasswordSerializer'
        },
        'departments': {
            'views': ['DepartmentViewSet'],
            'serializers': ['DepartmentSerializer'],
            'imports': 'from .models import Department\nfrom .serializers import DepartmentSerializer'
        },
        'candidates': {
            'views': ['CandidateViewSet'],
            'serializers': ['CandidateSerializer'],
            'imports': 'from .models import Candidate\nfrom .serializers import CandidateSerializer'
        },
        'interns': {
            'views': ['InternViewSet'],
            'serializers': ['InternSerializer'],
            'imports': 'from .models import Intern\nfrom .serializers import InternSerializer'
        },
        'stipends': {
            'views': ['StipendViewSet'],
            'serializers': ['StipendSerializer'],
            'imports': 'from .models import Stipend, ApprovalStatus\nfrom .serializers import StipendSerializer'
        },
        'leaves': {
            'views': ['LeaveRequestViewSet'],
            'serializers': ['LeaveRequestSerializer'],
            'imports': 'from .models import LeaveRequest\nfrom .serializers import LeaveRequestSerializer'
        },
        'extensions': {
            'views': ['ExtensionRequestViewSet', 'ExtensionPermissionViewSet'],
            'serializers': ['ExtensionRequestSerializer', 'ExtensionPermissionSerializer'],
            'imports': 'from .models import ExtensionRequest, ExtensionPermission\nfrom .serializers import ExtensionRequestSerializer, ExtensionPermissionSerializer'
        },
        'exits': {
            'views': ['ExitRequestViewSet'],
            'serializers': ['ExitRequestSerializer'],
            'imports': 'from .models import ExitRequest\nfrom .serializers import ExitRequestSerializer'
        },
        'holidays': {
            'views': ['HolidayViewSet'],
            'serializers': ['HolidaySerializer'],
            'imports': 'from .models import Holiday\nfrom .serializers import HolidaySerializer'
        },
        'notifications': {
            'views': ['DashboardStatsView', 'SendEmailView', 'NotificationEmailView', 'JotFormWebhookView'],
            'serializers': [],
            'imports': 'from .email_service import EmailService\nfrom users.models import User\nfrom departments.models import Department'
        }
    }
    
    print("Creating app files...")
    
    for app_name, app_data in apps.items():
        # Create views.py
        view_content = "from rest_framework import viewsets, permissions, status\n"
        view_content += "from rest_framework.decorators import action\n"
        view_content += "from rest_framework.response import Response\n"
        view_content += "from rest_framework.views import APIView\n"
        view_content += "from rest_framework_simplejwt.tokens import RefreshToken\n"
        view_content += "from rest_framework_simplejwt.views import TokenObtainPairView\n"
        view_content += "from django.contrib.auth import authenticate\n"
        view_content += "from django.shortcuts import get_object_or_404\n"
        view_content += "from django.db import models\n"
        view_content += "import uuid\n"
        view_content += "from datetime import datetime\n\n"
        view_content += app_data['imports'] + "\n\n"
        
        # Add views
        for view_name in app_data['views']:
            view_code = extract_class(views, view_name)
            if view_code:
                view_content += view_code + "\n\n"
        
        with open(f'{app_name}/views.py', 'w') as f:
            f.write(view_content)
        
        # Create serializers.py
        if app_data['serializers']:
            serializer_content = "from rest_framework import serializers\n"
            serializer_content += "from django.contrib.auth import authenticate\n\n"
            serializer_content += app_data['imports'] + "\n\n"
            
            for ser_name in app_data['serializers']:
                ser_code = extract_class(serializers, ser_name)
                if ser_code:
                    serializer_content += ser_code + "\n\n"
            
            with open(f'{app_name}/serializers.py', 'w') as f:
                f.write(serializer_content)
        
        print(f"OK Created {app_name}/views.py and serializers.py")
    
    # Create urls.py for each app
    url_patterns = []
    for app_name in apps.keys():
        url_file = f'{app_name}/urls.py'
        with open(url_file, 'w') as f:
            f.write(f'''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
''')
            # Add router registrations based on ViewSets
            for view in apps[app_name]['views']:
                if 'ViewSet' in view:
                    viewset_name = view.replace('ViewSet', '').lower()
                    f.write(f"router.register(r'{viewset_name}s', {view})\n")
            
            f.write('''
urlpatterns = [
    path('', include(router.urls)),
]
''')
        url_patterns.append(f"    path('api/{app_name}/', include('{app_name}.urls')),")
    
    # Update main urls.py
    with open('ims_backend/urls.py', 'w') as f:
        f.write('''from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
''' + '\n'.join(url_patterns) + '''
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
''')
    
    print("\nOK Updated ims_backend/urls.py")
    print("\nRefactoring complete! Next steps:")
    print("1. Remove core/ folder")
    print("2. Test the application")

if __name__ == '__main__':
    create_app_files()
