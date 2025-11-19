#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from webhooks.models import JotFormCandidate

# Query for candidate with unique ID containing "1208" or name containing "Pranay"
print("=" * 60)
print("SEARCHING FOR CANDIDATE")
print("=" * 60)

# Try multiple search criteria
candidates = JotFormCandidate.objects.all()
print(f"Total candidates in database: {candidates.count()}\n")

# Search by unique ID
candidate_by_id = candidates.filter(unique_id__icontains='1208').first()
if candidate_by_id:
    print("[OK] Found by Unique ID:")
    print(f"  Name: {candidate_by_id.name}")
    print(f"  Email: {candidate_by_id.email}")
    print(f"  Status: {candidate_by_id.status}")
    print(f"  Unique ID: {candidate_by_id.unique_id}")
    print(f"  Assigned Mentor: {candidate_by_id.assigned_mentor_name or 'None'}")
    print(f"  Submission Date: {candidate_by_id.submission_date}")
    print(f"  Phone: {candidate_by_id.phone or 'N/A'}")
else:
    print("[NOT FOUND] Not found by Unique ID '1208'")
    print()

# Search by name
candidate_by_name = candidates.filter(name__icontains='Pranay').first()
if candidate_by_name:
    print("\n[OK] Found by Name (Pranay):")
    print(f"  Name: {candidate_by_name.name}")
    print(f"  Email: {candidate_by_name.email}")
    print(f"  Status: {candidate_by_name.status}")
    print(f"  Unique ID: {candidate_by_name.unique_id}")
    print(f"  Assigned Mentor: {candidate_by_name.assigned_mentor_name or 'None'}")
else:
    print("\n[NOT FOUND] Not found by name 'Pranay'")

# If not found, show some sample candidates
if not candidate_by_id and not candidate_by_name:
    print("\n" + "=" * 60)
    print("CANDIDATE NOT FOUND")
    print("=" * 60)
    print("\nHere are some sample candidates in the database:\n")
    for i, cand in enumerate(candidates[:5], 1):
        print(f"{i}. Name: {cand.name}")
        print(f"   Unique ID: {cand.unique_id}")
        print(f"   Status: {cand.status}")
        print()
