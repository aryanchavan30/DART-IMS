#!/usr/bin/env python
"""
Script to change password for Sanya Kapoor
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
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

def change_sanya_password():
    try:
        # Find Sanya Kapoor by name
        sanya = User.objects.filter(name__icontains='Sanya Kapoor').first()
        
        if not sanya:
            # Try variations of the name
            sanya = User.objects.filter(name__icontains='Sanya').first()
            
        if not sanya:
            print("❌ User 'Sanya Kapoor' not found!")
            print("Available users:")
            for user in User.objects.all():
                print(f"  - {user.name} ({user.email}) - Role: {user.role}")
            return
        
        print(f"✅ Found user: {sanya.name} ({sanya.email}) - Role: {sanya.role}")
        
        # Set new password
        new_password = input("Enter new password for Sanya Kapoor: ").strip()
        
        if not new_password:
            print("❌ Password cannot be empty!")
            return
        
        # Confirm password
        confirm_password = input("Confirm new password: ").strip()
        
        if new_password != confirm_password:
            print("❌ Passwords don't match!")
            return
        
        # Update password
        sanya.set_password(new_password)
        sanya.save()
        
        print(f"✅ Password successfully changed for {sanya.name}")
        print(f"📧 Email: {sanya.email}")
        print(f"🔐 New password: {new_password}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    change_sanya_password()
