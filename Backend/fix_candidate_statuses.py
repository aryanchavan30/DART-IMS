#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from candidates.models import Candidate
from users.models import User
from departments.models import Department

print('=' * 70)
print('FIXING CANDIDATE STATUSES FOR HOD APPROVAL')
print('=' * 70)
print()

# Get HOD
hod = User.objects.get(id='30')
web_dev_dept = Department.objects.get(id='d_web')

# Get candidates that are SELECTED but should be PENDING_HOD_APPROVAL
# These are candidates that mentors approved but weren't sent to HOD
selected_candidates = Candidate.objects.filter(
    status='Selected',
    department=web_dev_dept
).select_related('assigned_mentor')

print(f'Found {len(selected_candidates)} SELECTED candidates in Web Development')
print()

if len(selected_candidates) > 0:
    print('Updating their status to PENDING_HOD_APPROVAL...')
    print()

    for cand in selected_candidates:
        old_status = cand.status
        cand.status = 'Pending HOD Approval'
        cand.save()

        print(f'[UPDATED] {cand.name}')
        print(f'  Old Status: {old_status}')
        print(f'  New Status: {cand.status}')
        print(f'  Mentor: {cand.assigned_mentor.name if cand.assigned_mentor else "None"}')
        print()

# Now check what HOD will see
pending_hod = Candidate.objects.filter(
    status='Pending HOD Approval',
    department=web_dev_dept
).select_related('assigned_mentor')

print('=' * 70)
print(f'HOD WILL NOW SEE {len(pending_hod)} CANDIDATES')
print('=' * 70)
print()

for i, cand in enumerate(pending_hod, 1):
    print(f'{i}. {cand.name}')
    print(f'   Status: {cand.status}')
    print(f'   Mentor: {cand.assigned_mentor.name if cand.assigned_mentor else "None"}')
    print()
