#!/usr/bin/env python
"""
Sync all valid candidates from JotFormCandidate to Candidate table.
This addresses the issue where candidates appear in the pipeline but not in workflow pages.
"""
import os
import sys
import django
import uuid
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from webhooks.models import JotFormCandidate
from candidates.models import Candidate
from django.db import transaction


def sync_candidates():
    """Sync all valid JotForm candidates to Candidate table."""

    # Get all emails from Candidate table to avoid duplicates
    existing_emails = set(Candidate.objects.values_list('email', flat=True))

    # Get all JotForm candidates with valid names (not N/A)
    jotform_candidates = JotFormCandidate.objects.filter(
        name__isnull=False
    ).exclude(
        name__in=['N/A', '', 'null']
    ).exclude(
        email__in=existing_emails
    )

    synced_count = 0
    skipped_count = 0

    print(f"Found {jotform_candidates.count()} valid JotForm candidates to sync...")

    with transaction.atomic():
        for jotform_candidate in jotform_candidates:
            try:
                # Generate unique ID
                candidate_id = str(uuid.uuid4()).replace('-', '')[:22]

                # Create quest_data from jotform fields
                quest_data = {
                    'phone': jotform_candidate.phone,
                    'date_of_birth': jotform_candidate.date_of_birth,
                    'gender': jotform_candidate.gender,
                    'address': jotform_candidate.address,
                    'unique_id': jotform_candidate.unique_id,
                    'college_name': jotform_candidate.college_name,
                    'qualification': jotform_candidate.qualification,
                    'branch': jotform_candidate.branch,
                    'year_of_passing': jotform_candidate.year_of_passing,
                    'semester': jotform_candidate.semester,
                    'area_of_interest': jotform_candidate.area_of_interest,
                    'preferred_location': jotform_candidate.preferred_location,
                    'linkedin_profile': jotform_candidate.linkedin_profile,
                    'reference_by': jotform_candidate.reference_by,
                    'tnp_contact': jotform_candidate.tnp_contact,
                    'applicant_status': jotform_candidate.applicant_status,
                    'available_6_months': jotform_candidate.available_6_months,
                    'willing_plant_location': jotform_candidate.willing_plant_location,
                    'willing_shifts': jotform_candidate.willing_shifts,
                    'cv_url': jotform_candidate.cv_url,
                    'photo': jotform_candidate.photo,
                    'signature': jotform_candidate.signature,
                    'last_project_report': jotform_candidate.last_project_report,
                    'has_cv': jotform_candidate.has_cv,
                    'jotform_id': jotform_candidate.jotform_id,
                    'source': 'JotForm',
                    'submission_date': jotform_candidate.submission_date.isoformat() if jotform_candidate.submission_date else None
                }

                # Create Candidate record
                candidate = Candidate.objects.create(
                    id=candidate_id,
                    name=jotform_candidate.name,
                    email=jotform_candidate.email,
                    status=Candidate.CandidateStatus.PENDING_ASSIGNMENT,
                    quest_data=quest_data
                )

                synced_count += 1
                if synced_count % 50 == 0:
                    print(f"Synced {synced_count} candidates...")

            except Exception as e:
                print(f"Error syncing {jotform_candidate.email}: {str(e)}")
                skipped_count += 1
                continue

    print(f"\n=== Sync Complete ===")
    print(f"Successfully synced: {synced_count} candidates")
    print(f"Skipped due to errors: {skipped_count} candidates")
    print(f"\nSharvari Nachane should now appear in 'My Interviews' page!")


if __name__ == '__main__':
    sync_candidates()
