"""
Script to create an Admin user with full access.

Usage:
    python manage.py shell < create_admin.py

Or:
    python manage.py runscript create_admin (if django-extensions installed)
"""
import os
import django

# Setup Django if running standalone
if not os.environ.get('DJANGO_SETTINGS_MODULE'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
    django.setup()

from users.models import User


def create_admin_user():
    """Create an Admin user with full access"""

    # Admin user details
    admin_email = 'admin@dartims.com'
    admin_password = 'admin123'  # Change this in production!
    admin_name = 'System Admin'

    # Check if admin already exists
    if User.objects.filter(email=admin_email).exists():
        user = User.objects.get(email=admin_email)
        print(f"Admin user already exists: {user.email}")

        # Update to Admin role if not already
        if user.role != User.Role.ADMIN:
            user.role = User.Role.ADMIN
            user.is_staff = True
            user.is_superuser = True
            user.save()
            print(f"Updated user role to Admin")

        return user

    # Create new admin user
    user = User.objects.create_user(
        email=admin_email,
        password=admin_password,
        name=admin_name,
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
        is_active=True
    )

    print(f"""
✅ Admin user created successfully!

    Email: {admin_email}
    Password: {admin_password}
    Name: {admin_name}
    Role: Admin

⚠️  IMPORTANT: Change the password immediately in production!

Admin Capabilities:
    - Full access to all data
    - Can switch to any role for testing
    - Can access all API endpoints
    - Can view/modify all attendance records
    - Can approve/reject all tickets

API Endpoints for Admin:
    POST /api/users/switch_role/     - Switch to any role
    POST /api/users/reset_to_admin/  - Reset back to Admin
    GET  /api/users/available_roles/ - List all available roles
""")

    return user


if __name__ == '__main__':
    create_admin_user()
else:
    # Running via shell
    create_admin_user()
