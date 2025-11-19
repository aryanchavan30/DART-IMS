#!/usr/bin/env python
"""
Script to set default password 'password123' for all users in the database.
Run this script from the backend directory: python set_default_passwords.py
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from django.contrib.auth.hashers import make_password
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

def set_default_passwords():
    """Set password123 as default password for all users"""
    default_password = "password123"
    hashed_password = make_password(default_password)
    
    # Get all users
    users = User.objects.all()
    
    print(f"Found {users.count()} users in the database.")
    
    if users.count() == 0:
        print("No users found. Nothing to update.")
        return
    
    # Update all users with the default password
    updated_count = User.objects.all().update(password=hashed_password)
    
    print(f"Successfully updated {updated_count} users with default password: '{default_password}'")
    
    # Display all users for confirmation
    print("\nUpdated users:")
    for user in User.objects.all():
        print(f"- {user.name} ({user.email}) - Role: {user.role}")
    
    print(f"\nAll users can now login with password: '{default_password}'")

if __name__ == "__main__":
    try:
        set_default_passwords()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
