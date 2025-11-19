#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from candidates.models import Candidate
from users.models import User
from departments.models import Department

print('=' * 70)
print('FIXING AYUSHI BAIS DEPARTMENT')
print('=' * 70)
print()

# Get Ayushi and her mentor
ayushi = Candidate.objects.get(name='Ayushi Bais')
mentor = ayushi.assigned_mentor
mentor_dept = mentor.department

print(f'Current Status:')
print(f'  Ayushi Department: {ayushi.department}')
print(f'  Mentor Department: {mentor_dept.name if mentor_dept else "None"}')
print()

# Update Ayushi's department to match mentor's department
if mentor_dept:
    ayushi.department = mentor_dept
    ayushi.save()

    print('[FIXED] Ayushi department has been updated!')
    print(f'  New Department: {ayushi.department.name}')
    print()

    # Verify she now appears in HOD list
    dept_candidates = Candidate.objects.filter(
        department=mentor_dept,
        status='Selected'
    )

    print('HOD will now see these candidates:')
    for cand in dept_candidates:
        print(f'  - {cand.name} (Dept: {cand.department.name})')

    ayushi_in_list = dept_candidates.filter(id=ayushi.id).exists()
    print()
    print(f'Ayushi in HOD list: {ayushi_in_list}')
else:
    print('[ERROR] Cannot fix - Mentor has no department!')
