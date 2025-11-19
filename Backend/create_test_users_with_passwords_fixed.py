#!/usr/bin/env python
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from users.models import User
from departments.models import Department

def create_test_users():
    """Create test users with proper passwords for development"""
    
    # Create departments first if they don't exist
    departments = [
        ('d_web', 'Web Development'),
        ('d_sap', 'SAP BTP Development'),
        ('d_rpa', 'RPA'),
        ('d_genai', 'Gen AI & LLM'),
        ('d_iiot_dev', 'IIoT Development'),
        ('d_iiot_field', 'IIoT Field'),
        ('d_scm', 'SCM'),
        ('d_pm', 'Project Management'),
    ]
    
    dept_map = {}
    for dept_id, dept_name in departments:
        dept, created = Department.objects.get_or_create(
            id=dept_id,
            defaults={'name': dept_name}
        )
        dept_map[dept_id] = dept
        print(f"{'Created' if created else 'Found'} department: {dept.name}")
    
    # Create test users
    test_users = [
        ('hr@example.com', 'HR User', 'HR', None),
        ('mhr@example.com', 'Manager HR', 'MHR', None),
        ('hod.web@example.com', 'HOD Web', 'HOD', dept_map.get('d_web')),
        ('hod.sap@example.com', 'HOD SAP', 'HOD', dept_map.get('d_sap')),
        ('mentor.alice@example.com', 'Alice Mentor', 'MENTOR', dept_map.get('d_web')),
        ('mentor.bob@example.com', 'Bob Mentor', 'MENTOR', dept_map.get('d_web')),
        ('mentor.charlie@example.com', 'Charlie Mentor', 'MENTOR', dept_map.get('d_sap')),
    ]
    
    for email, name, role, dept in test_users:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'role': role,
                'department': dept,
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created user: {email}")
        else:
            print(f"User already exists: {email}")

if __name__ == '__main__':
    create_test_users()
    print("\n✅ All test users created successfully!")
    print("Login credentials: email + password123")
