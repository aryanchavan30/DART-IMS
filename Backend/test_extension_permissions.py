#!/usr/bin/env python3
"""
Test script for Extension Permission system

This script demonstrates how the extension permission system works:
1. Creates extension permission records for interns
2. Shows HR and HOD approval process
3. Verifies that intern.extension_allowed is updated correctly
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
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
from stipends.models import User, Intern, ExtensionPermission, ApprovalStatus

def test_extension_permissions():
    """Test the complete extension permission flow"""
    
    print("🚀 Testing Extension Permission System")
    print("=" * 50)
    
    # Find test users
    try:
        hr_user = User.objects.filter(role=User.Role.HR).first()
        if not hr_user:
            print("❌ No HR user found. Please create test users first.")
            return False
        print(f"✅ Found HR user: {hr_user.name}")
    except Exception as e:
        print(f"❌ Error finding HR user: {e}")
        return False
    
    try:
        hod_user = User.objects.filter(role=User.Role.HOD).first()
        if not hod_user:
            print("❌ No HOD user found. Please create test users first.")
            return False
        print(f"✅ Found HOD user: {hod_user.name}")
    except User.DoesNotExist:
        print("❌ No HOD user found. Please create test users first.")
        return False
    
    # Find an intern
    try:
        intern = Intern.objects.filter(status=Intern.InternStatus.ACTIVE).first()
        if not intern:
            print("❌ No active intern found. Please create an intern first.")
            return False
        print(f"✅ Found intern: {intern.user.name}")
    except Exception as e:
        print(f"❌ Error finding intern: {e}")
        return False
    
    print("\n📋 Initial State:")
    print(f"   Intern extension_allowed: {intern.extension_allowed}")
    
    # Step 1: Create extension permission record
    print("\n🔨 Step 1: Creating extension permission record...")
    
    # Check if permission already exists
    existing_permission = ExtensionPermission.objects.filter(intern=intern).first()
    if existing_permission:
        print(f"   Extension permission already exists: {existing_permission.id}")
        permission = existing_permission
    else:
        permission = ExtensionPermission.objects.create(
            id=f"ep_{int(datetime.now().timestamp())}",
            intern=intern
        )
        print(f"   Created extension permission: {permission.id}")
    
    # Refresh intern to see if extension_allowed changed
    intern.refresh_from_db()
    print(f"   Intern extension_allowed after creation: {intern.extension_allowed}")
    print(f"   Permission status - HR: {permission.hr_approved}, HOD: {permission.hod_approved}")
    
    # Step 2: HR Approval
    print("\n👤 Step 2: HR Approval...")
    permission.hr_approved = True
    permission.hr_approved_by = hr_user
    permission.hr_approved_at = datetime.now()
    permission.hr_comments = "Test HR approval - intern shows good performance"
    permission.save()
    
    intern.refresh_from_db()
    print(f"   HR approved extension permission")
    print(f"   Intern extension_allowed after HR approval: {intern.extension_allowed}")
    print(f"   Permission status - HR: {permission.hr_approved}, HOD: {permission.hod_approved}")
    
    # Step 3: HOD Approval
    print("\n👨‍💼 Step 3: HOD Approval...")
    permission.hod_approved = True
    permission.hod_approved_by = hod_user
    permission.hod_approved_at = datetime.now()
    permission.hod_comments = "Test HOD approval - department supports extension"
    permission.save()
    
    intern.refresh_from_db()
    print(f"   HOD approved extension permission")
    print(f"   Intern extension_allowed after HOD approval: {intern.extension_allowed}")
    print(f"   Permission status - HR: {permission.hr_approved}, HOD: {permission.hod_approved}")
    print(f"   Permission is_approved: {permission.is_approved}")
    
    # Step 4: Test rejection scenario
    print("\n❌ Step 4: Testing rejection scenario...")
    permission.hod_approved = False
    permission.hod_comments = "Test HOD rejection - extension not needed"
    permission.save()
    
    intern.refresh_from_db()
    print(f"   HOD rejected extension permission")
    print(f"   Intern extension_allowed after HOD rejection: {intern.extension_allowed}")
    print(f"   Permission status - HR: {permission.hr_approved}, HOD: {permission.hod_approved}")
    print(f"   Permission is_approved: {permission.is_approved}")
    
    # Step 5: Re-approve for final state
    print("\n✅ Step 5: Re-approving for final state...")
    permission.hod_approved = True
    permission.hod_comments = "Final approval - extension granted"
    permission.save()
    
    intern.refresh_from_db()
    print(f"   Final state - Intern extension_allowed: {intern.extension_allowed}")
    print(f"   Final state - Permission is_approved: {permission.is_approved}")
    
    print("\n🎉 Extension Permission System Test Complete!")
    print("=" * 50)
    print("Summary:")
    print(f"   - Extension permission created: {permission.id}")
    print(f"   - HR approved by: {permission.hr_approved_by.name if permission.hr_approved_by else 'None'}")
    print(f"   - HOD approved by: {permission.hod_approved_by.name if permission.hod_approved_by else 'None'}")
    print(f"   - Intern can request extensions: {intern.extension_allowed}")
    print(f"   - Auto-sync working: {'✅' if permission.is_approved == intern.extension_allowed else '❌'}")
    
    return True

def show_all_permissions():
    """Display all extension permissions in the system"""
    print("\n📊 All Extension Permissions:")
    print("-" * 60)
    
    permissions = ExtensionPermission.objects.select_related('intern__user', 'hr_approved_by', 'hod_approved_by').all()
    
    if not permissions:
        print("   No extension permissions found.")
        return
    
    for perm in permissions:
        print(f"ID: {perm.id}")
        print(f"   Intern: {perm.intern.user.name} ({perm.intern.user.email})")
        print(f"   HR Approved: {perm.hr_approved} {'by ' + perm.hr_approved_by.name if perm.hr_approved_by else ''}")
        print(f"   HOD Approved: {perm.hod_approved} {'by ' + perm.hod_approved_by.name if perm.hod_approved_by else ''}")
        print(f"   Overall Status: {'✅ Approved' if perm.is_approved else '⏳ Pending'}")
        print(f"   Intern extension_allowed: {perm.intern.extension_allowed}")
        print("-" * 40)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--show":
        show_all_permissions()
    else:
        success = test_extension_permissions()
        if success:
            show_all_permissions()