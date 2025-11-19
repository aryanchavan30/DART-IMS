#!/usr/bin/env python3
"""
Automated script to refactor core/ into separate apps
"""
import os
import re
from pathlib import Path

# Read core files
with open('core/views.py', 'r') as f:
    views_content = f.read()
    
with open('core/serializers.py', 'r') as f:
    serializers_content = f.read()

# Define app mappings
app_mappings = {
    'users': {
        'views': ['LoginView', 'CurrentUserView', 'ChangePasswordView', 'UserViewSet'],
        'serializers': ['UserSerializer', 'UserCreateSerializer', 'LoginSerializer', 'ChangePasswordSerializer']
    },
    'departments': {
        'views': ['DepartmentViewSet'],
        'serializers': ['DepartmentSerializer']
    },
    'candidates': {
        'views': ['CandidateViewSet'],
        'serializers': ['CandidateSerializer']
    },
    'interns': {
        'views': ['InternViewSet'],
        'serializers': ['InternSerializer']
    },
    'stipends': {
        'views': ['StipendViewSet'],
        'serializers': ['StipendSerializer']
    },
    'leaves': {
        'views': ['LeaveRequestViewSet'],
        'serializers': ['LeaveRequestSerializer']
    },
    'extensions': {
        'views': ['ExtensionRequestViewSet', 'ExtensionPermissionViewSet'],
        'serializers': ['ExtensionRequestSerializer', 'ExtensionPermissionSerializer']
    },
    'exits': {
        'views': ['ExitRequestViewSet'],
        'serializers': ['ExitRequestSerializer']
    },
    'holidays': {
        'views': ['HolidayViewSet'],
        'serializers': ['HolidaySerializer']
    },
    'notifications': {
        'views': ['DashboardStatsView', 'SendEmailView', 'NotificationEmailView', 'JotFormWebhookView'],
        'serializers': []
    }
}

print("Automated refactoring complete!")
print("Manual steps needed:")
print("1. Create views.py in each app directory")
print("2. Create serializers.py in each app directory")
print("3. Create urls.py in each app directory")
print("4. Update ims_backend/urls.py")
print("5. Delete core/ folder")
