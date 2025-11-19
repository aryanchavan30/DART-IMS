#!/usr/bin/env python
import os
import sys
from datetime import date, datetime
import re

import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

# --- CORRECTED IMPORTS ---
from users.models import User
from departments.models import Department
from candidates.models import Candidate
from interns.models import Intern
from stipends.models import Stipend, ApprovalStatus # Added ApprovalStatus here
from leaves.models import LeaveRequest
from extensions.models import ExtensionRequest, ExtensionPermission # Added ExtensionPermission here
from exits.models import ExitRequest
from holidays.models import Holiday
from django.db import transaction

# --- THE INCORRECT IMPORT BLOCK HAS BEEN REMOVED ---


def slug_email_from_name(name: str, domain: str = 'solargroup.com') -> str:
    # Normalize whitespace and accents; keep letters only for local-part
    clean = re.sub(r"[^a-zA-Z\s]", "", name)
    parts = [p for p in clean.lower().split() if p]
    local = ".".join(parts) if parts else "user"
    return f"{local}@{domain}"


def get_dept_by_name(name: str):
    try:
        return Department.objects.get(name=name)
    except Department.DoesNotExist:
        return None


def map_department(label: str) -> Department:
    label_norm = (label or '').strip().lower()
    mapping = {
        'web development': 'Web Development',
        'rpa': 'RPA',
        'iiot': 'IIoT Development',  # default bucket for generic IIOT
        'iiot development': 'IIoT Development',
        'iiot field': 'IIoT Field',
        'sap': 'SAP BTP Development',
        'ai/ml': 'Gen AI & LLM',
        'btp': 'SAP BTP Development',  # treated as SAP BTP
        'scm': 'SCM',
        'data analysis': 'Gen AI & LLM',  # closest existing department
        'dart': 'DART' # Mapping for DART team
    }
    target = mapping.get(label_norm)
    if not target:
        raise ValueError(f"Unknown department label: {label}")
    dept = get_dept_by_name(target)
    if not dept:
        raise ValueError(f"Department not found: {target}")
    return dept


def ensure_departments():
    # Create required departments matching the model's choices
    depts = [
        ('d_web', 'Web Development'),
        ('d_rpa', 'RPA'),
        ('d_genai', 'Gen AI & LLM'),
        ('d_sap', 'SAP BTP Development'),
        ('d_iiot_dev', 'IIoT Development'),
        ('d_iiot_field', 'IIoT Field'),
        ('d_scm', 'SCM'),
        ('d_dart', 'DART'),
    ]
    created = []
    for did, dname in depts:
        dept, was_created = Department.objects.get_or_create(id=did, defaults={'name': dname})
        if not was_created and dept.name != dname:
            dept.name = dname
            dept.save()
        if was_created:
            created.append(dname)
    return created


def reset_and_seed():
    print("\n=== Resetting database data (non-migration) ===")
    with transaction.atomic():
        # Wipe dependent tables first
        Stipend.objects.all().delete()
        LeaveRequest.objects.all().delete()
        ExtensionRequest.objects.all().delete()
        ExitRequest.objects.all().delete()
        ExtensionPermission.objects.all().delete()
        Intern.objects.all().delete()
        Candidate.objects.all().delete()
        Holiday.objects.all().delete()
        # Clear department mentor relations before delete users (safety)
        for dept in Department.objects.all():
            dept.mentors.clear()
            dept.hod = None
            dept.save()
        Department.objects.all().delete()
        # Finally users (this removes HR/HOD/Mentor/Intern accounts)
        User.objects.all().delete()

    print("✔ Cleared existing data.")

    print("\n=== Creating departments ===")
    created_depts = ensure_departments()
    print(f"Ensured departments. Newly created: {created_depts}")

    # Create HODs
    print("\n=== Creating HOD users ===")
    hod_specs = [
        { 'name': 'Manish Kumar Singh', 'dept': 'SCM' },
        { 'name': 'Moloy Choudhary', 'dept': 'SAP BTP Development' },
        { 'name': 'Sachin Jamgade', 'dept': 'IIoT Development' },
        { 'name': 'Sachin Kumbhalpuri', 'dept': 'DART' },
    ]
    hod_users = {}
    for spec in hod_specs:
        email = slug_email_from_name(spec['name'])
        dept = get_dept_by_name(spec['dept']) if spec['dept'] else None
        u = User.objects.create(
            email=email,
            name=spec['name'],
            role=User.Role.HOD,
            department=dept,
            shift=User.Shift.GENERAL,
            week_offs=[0,6],
        )
        hod_users[spec['name']] = u
        if dept and not dept.hod:
            dept.hod = u
            dept.save()
        print(f"HOD: {u.name} <{u.email}>{' -> ' + dept.name if dept else ''}")

    # Create Mentors and attach to departments
    print("\n=== Creating Mentor users ===")
    mentor_specs = [
        { 'name': 'Mentor SAP', 'dept': 'SAP BTP Development' },
        { 'name': 'Mentor SCM', 'dept': 'SCM' },
        { 'name': 'Lalit Kumar Bopche', 'dept': 'IIoT Field' },
        { 'name': 'Nitesh Gaidhane', 'dept': 'IIoT Development' },
        { 'name': 'Ritik Ingole', 'dept': 'DART' },
        { 'name': 'Yashwanta Chandane', 'dept': 'DART' },
        { 'name': 'Amit Sayare', 'dept': 'DART' },
        { 'name': 'Soham Das', 'dept': 'DART' },
    ]
    mentors_by_dept = {}
    for spec in mentor_specs:
        d = get_dept_by_name(spec['dept'])
        email = slug_email_from_name(spec['name'])
        m = User.objects.create(
            email=email,
            name=spec['name'],
            role=User.Role.MENTOR,
            department=d,
            shift=User.Shift.GENERAL,
            week_offs=[0,6],
        )
        mentors_by_dept.setdefault(d.id, []).append(m)
        d.mentors.add(m)
        print(f"Mentor: {m.name} <{m.email}> -> {d.name}")

    # Intern list
    interns = [
        (1, 'Prathmesh Bawne', 'IIoT', 'dartintern1@solargroup.com'),
        (2, 'Kartik Doye', 'RPA', 'dartintern2@solargroup.com'),
        (3, 'Shruti Solanki', 'RPA', 'dartintern3@solargroup.com'),
        (4, 'Nishant Goupale', 'Web Development', 'dartintern4@solargroup.com'),
        (5, 'Saimadhu Muthyala', 'IIoT', 'dartintern5@solargroup.com'),
        (6, 'Mayur Talmale', 'IIoT', 'dartintern6@solargroup.com'),
        (7, 'Bhushan Gomase', 'RPA', 'dartintern7@solargroup.com'),
        (8, 'Anuj Deulkar', 'Data Analysis', 'dartintern8@solargroup.com'),
        (9, 'Niranjan Gupta', 'IIoT', 'dartintern9@solargroup.com'),
        (10, 'Ayush Kukekar', 'Web Development', 'dartintern10@solargroup.com'),
        (11, 'Kshitij Dekate', 'RPA', 'dartintern11@solargroup.com'),
        (12, 'Umesh Kalantri', 'IIoT', 'dartintern12@solargroup.com'),
        (13, 'Anurag Gokhale', 'IIoT', 'dartintern13@solargroup.com'),
        (14, 'Manas Chaudhary', 'Web Development', 'dartintern14@solargroup.com'),
        (15, 'Prathmesh Chavan', 'IIoT', 'dartintern15@solargroup.com'),
        (16, 'Aditya Soni', 'Web Development', 'dartintern16@solargroup.com'),
        (17, 'Sankruti Kumar', 'IIoT', 'dartintern17@solargroup.com'),
        (18, 'Donesh Kumbhare', 'IIoT', 'dartintern18@solargroup.com'),
        (19, 'Samir Pihul', 'Web Development', 'dartintern19@solargroup.com'),
        (20, 'Jay Jogi', 'IIoT', 'dartintern20@solargroup.com'),
    ]

    print("\n=== Creating Interns (Users + Candidates + Intern profiles) ===")
    created_interns = 0
    for sr, name, dept_label, email in interns:
        dept = map_department(dept_label)
        login_id = f"SIIL-I{sr:04d}"
        user = User.objects.create(
            email=email,
            name=name,
            role=User.Role.INTERN,
            department=dept,
            login_id=login_id,
            shift=User.Shift.GENERAL,
            week_offs=[0,6],
        )
        cand_id = f"c_seed_{sr:04d}"
        dept_mentors = mentors_by_dept.get(dept.id, [])
        assigned_mentor = dept_mentors[0] if dept_mentors else None
        candidate = Candidate.objects.create(
            id=cand_id,
            name=name,
            email=email,
            department=dept,
            assigned_mentor=assigned_mentor,
            status=Candidate.CandidateStatus.ONBOARDED,
            joining_date=date.today(),
        )
        intern_id = f"i_seed_{sr:04d}"
        Intern.objects.create(
            id=intern_id,
            user=user,
            candidate=candidate,
            mentor=assigned_mentor,
            joining_date=date.today(),
            bank_details={},
            status=Intern.InternStatus.ACTIVE,
        )
        created_interns += 1
        print(f"Intern: {name} <{email}> -> {dept.name}")

    print("\n=== Summary ===")
    print(f"HODs: {User.objects.filter(role=User.Role.HOD).count()}")
    print(f"Mentors: {User.objects.filter(role=User.Role.MENTOR).count()}")
    print(f"Intern users: {User.objects.filter(role=User.Role.INTERN).count()}")
    print(f"Departments: {Department.objects.count()}")
    print(f"Candidates: {Candidate.objects.count()}")
    print(f"Intern profiles: {Intern.objects.count()}")
    print("\nAll users have default password 'password123'.")


if __name__ == '__main__':
    reset_and_seed()