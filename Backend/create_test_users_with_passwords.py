#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')

# Setup Django
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
from stipends.models import User, Department

def create_test_users():
    """Create test users with proper passwords for development"""
    
    # Create departments first if they don't exist
    dept_web, created = Department.objects.get_or_create(
        id='d_web',
        defaults={'name': 'Web Development'}
    )
    if created:
        print(f"Created department: {dept_web.name}")
    
    dept_sap, created = Department.objects.get_or_create(
        id='d_sap', 
        defaults={'name': 'SAP BTP Development'}
    )
    if created:
        print(f"Created department: {dept_sap.name}")
    
    # Test users with default password 'password123'
    test_users = [
        {
            'email': 'hr@example.com',
            'name': 'Diana Prince',
            'role': User.Role.HR,
            'login_id': 'HR-01'
        },
        {
            'email': 'mhr@example.com',
            'name': 'Clark Kent',
            'role': User.Role.MHR,
            'login_id': 'MHR-01'
        },
        {
            'email': 'hod.web@example.com',
            'name': 'Dr. Evelyn Reed',
            'role': User.Role.HOD,
            'department': dept_web,
            'login_id': 'HOD-WEB'
        },
        {
            'email': 'hod.sap@example.com',
            'name': 'Mr. Robert Chen',
            'role': User.Role.HOD,
            'department': dept_sap,
            'login_id': 'HOD-SAP'
        },
        {
            'email': 'sanya.kapoor@gmail.com',
            'name': 'Sanya Kapoor',
            'role': User.Role.INTERN,
            'department': dept_web,
            'login_id': 'M-101'
        },
        {
            'email': 'mentor.bob@example.com',
            'name': 'Bob Williams',
            'role': User.Role.MENTOR,
            'department': dept_web,
            'login_id': 'M-102'
        },
        {
            'email': 'mentor.charlie@example.com',
            'name': 'Charlie Brown',
            'role': User.Role.MENTOR,
            'department': dept_sap,
            'login_id': 'M-201'
        },
    ]
    
    for user_data in test_users:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults=user_data
        )
        
        if created:
            # Set password for new user
            user.set_password('password123')
            user.save()
            print(f"Created user: {user.email} with password 'password123'")
        else:
            # Update password for existing user if it's not set
            if not user.check_password('password123'):
                user.set_password('password123')
                user.save()
                print(f"Updated password for existing user: {user.email}")
            else:
                print(f"User already exists: {user.email}")
    
    # Update department HODs
    dept_web.hod = User.objects.get(email='hod.web@example.com')
    dept_web.save()
    
    dept_sap.hod = User.objects.get(email='hod.sap@example.com')
    dept_sap.save()
    
    # Add mentors to departments
    dept_web.mentors.add(
        User.objects.get(email='mentor.alice@example.com'),
        User.objects.get(email='mentor.bob@example.com')
    )
    
    dept_sap.mentors.add(
        User.objects.get(email='mentor.charlie@example.com')
    )
    
    print("\n✅ Test users created successfully!")
    print("📋 Available test accounts:")
    print("   HR: hr@example.com / password123")
    print("   MHR: mhr@example.com / password123") 
    print("   HOD (Web): hod.web@example.com / password123")
    print("   HOD (SAP): hod.sap@example.com / password123")
    print("   Mentor (Alice): mentor.alice@example.com / password123")
    print("   Mentor (Bob): mentor.bob@example.com / password123")
    print("   Mentor (Charlie): mentor.charlie@example.com / password123")

if __name__ == '__main__':
    create_test_users()
