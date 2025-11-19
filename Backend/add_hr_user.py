#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from users.models import User
from departments.models import Department
from candidates.models import Candidate
from interns.models import Intern
from stipends.models import Stipend
from leaves.models import LeaveRequest
from extensions.models import ExtensionRequest
from exits.models import ExitRequest
from holidays.models import Holiday
from stipends.models import User


def ensure_hr_user():
    email = 'innovation@solargroup.com'
    name = 'Innovation'
    login_id = 'HR-INNOVATION'

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'name': name,
            'role': User.Role.HR,
            'login_id': login_id,
            'shift': User.Shift.GENERAL,
            'week_offs': [0, 6],
        }
    )

    if not created:
        # Update fields in case they were different
        user.name = name
        user.role = User.Role.HR
        user.login_id = login_id
        if not user.shift:
            user.shift = User.Shift.GENERAL
        if not user.week_offs:
            user.week_offs = [0, 6]
        user.save()
        print(f"Updated existing HR user: {user.email}")
    else:
        print(f"Created HR user: {user.email} (password: 'password123')")


if __name__ == '__main__':
    ensure_hr_user()
