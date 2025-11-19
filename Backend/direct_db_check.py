#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from candidates.models import Candidate
from webhooks.models import JotFormCandidate

print('=' * 70)
print('DIRECT DATABASE CHECK - candidates_candidate TABLE')
print('=' * 70)
print()

# Check candidates_candidate table
print('Checking candidates_candidate table:')
candidates = Candidate.objects.select_related('assigned_mentor', 'department').all()

print(f'Total candidates in table: {candidates.count()}')
print()

# Filter for Amit Sayare (ID: 37)
amit_candidates = candidates.filter(assigned_mentor__id='37')
print(f'Candidates assigned to Amit Sayare (ID: 37): {amit_candidates.count()}')
print()

if amit_candidates.count() > 0:
    for i, cand in enumerate(amit_candidates, 1):
        print(f'{i}. {cand.name} (ID: {cand.id})')
        print(f'   Status: {cand.status}')
        print(f'   Mentor ID: {cand.assigned_mentor.id if cand.assigned_mentor else None}')
        print(f'   Mentor Name: {cand.assigned_mentor.name if cand.assigned_mentor else None}')
        print(f'   Department: {cand.department.name if cand.department else None}')
        print()

# Also check with "Pending Interview Assessment" status
pending = amit_candidates.filter(status='Pending Interview Assessment')
print(f'With \"Pending Interview Assessment\" status: {pending.count()}')
print()

print('=' * 70)
print('COMPARING WITH webhooks_jotformcandidate TABLE')
print('=' * 70)
print()

# Check JotFormCandidate table
webhook_candidates = JotFormCandidate.objects.filter(assigned_mentor='37')
print(f'webhooks_jotformcandidate - Candidates assigned to Amit: {webhook_candidates.count()}')
print()

for i, cand in enumerate(webhook_candidates, 1):
    print(f'{i}. {cand.name} (ID: {cand.unique_id})')
    print(f'   Status: {cand.status}')
    print()
