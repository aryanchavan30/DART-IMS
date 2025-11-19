"""
Sync service for fetching candidates from JotForm and storing them locally.
This enables fast querying and reduces API calls.
"""
import requests
from datetime import datetime, timezone
from django.utils import timezone as django_timezone
from .models import JotFormCandidate, SyncLog
from django.db import transaction
import json

JOTFORM_API_KEY = 'dbd13d8434fd905966c4ba6ca92b1b84'
JOTFORM_API_BASE = 'https://api.jotform.com'
DEFAULT_FORM_ID = '212151286490452'


def format_date_of_birth(date_birth):
    """Format date of birth from JotForm to YYYY-MM-DD"""
    if not date_birth:
        return 'N/A'

    if isinstance(date_birth, dict):
        year = date_birth.get('year', '')
        month = date_birth.get('month', '')
        day = date_birth.get('day', '')
        if year and month and day:
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        else:
            return 'N/A'
    else:
        return str(date_birth) if date_birth else 'N/A'


def format_address(address):
    """Format address from JotForm dict to string"""
    if not address:
        return 'N/A'

    if isinstance(address, dict):
        addr_parts = []
        if address.get('addr_line1'):
            addr_parts.append(address['addr_line1'])
        if address.get('addr_line2'):
            addr_parts.append(address['addr_line2'])
        if address.get('city'):
            addr_parts.append(address['city'])
        if address.get('state'):
            addr_parts.append(address['state'])
        if address.get('postal'):
            addr_parts.append(address['postal'])
        return ', '.join(addr_parts) if addr_parts else 'N/A'
    else:
        return str(address) if address else 'N/A'


def extract_candidate_data(submission):
    """Extract all candidate data from a JotForm submission"""
    answers = submission.get('answers', {})

    # Get basic fields
    full_name_data = answers.get('62', {}).get('answer', '')
    email = answers.get('11', {}).get('answer', '')
    phone = answers.get('32', {}).get('answer', '')
    qualification = answers.get('54', {}).get('answer', '')
    branch = answers.get('37', {}).get('answer', '')
    area_of_interest = answers.get('40', {}).get('answer', '')
    college_name = answers.get('57', {}).get('answer', '')
    date_of_birth = answers.get('78', {}).get('answer', '')
    gender = answers.get('82', {}).get('answer', '')
    year_of_passing = answers.get('26', {}).get('answer', '')

    # Additional fields
    unique_id = answers.get('79', {}).get('answer', '')
    address = answers.get('74', {}).get('answer', '')
    linkedin_profile = answers.get('77', {}).get('answer', '')
    reference_by = answers.get('53', {}).get('answer', '')
    tnp_contact = answers.get('44', {}).get('answer', '')
    semester = answers.get('55', {}).get('answer', '')
    applicant_status = answers.get('33', {}).get('answer', '')
    available_6_months = answers.get('41', {}).get('answer', '')
    willing_plant_location = answers.get('72', {}).get('answer', '')
    willing_shifts = answers.get('81', {}).get('answer', '')
    preferred_location = answers.get('89', {}).get('answer', '')

    # Document URLs
    photo_url = None
    last_project_report = None
    signature_url = None
    cv_url = None
    has_cv = False

    # Extract photo (Field 52)
    if '52' in answers and answers['52'].get('answer'):
        photo_answer = answers['52'].get('answer')
        if isinstance(photo_answer, list):
            photo_url = photo_answer[0] if photo_answer else None
        else:
            photo_url = photo_answer

    # Extract last project report (Field 47)
    if '47' in answers and answers['47'].get('answer'):
        project_answer = answers['47'].get('answer')
        if isinstance(project_answer, list):
            last_project_report = project_answer[0] if project_answer else None
        else:
            last_project_report = project_answer

    # Extract signature (Field 68)
    if '68' in answers and answers['68'].get('answer'):
        signature_url = answers['68'].get('answer')

    # Extract CV (Field 21)
    if '21' in answers and answers['21'].get('answer'):
        cv_answer = answers['21'].get('answer')
        if isinstance(cv_answer, list):
            cv_url = cv_answer[0] if cv_answer else None
        else:
            cv_url = cv_answer
        has_cv = True

    # Format name if it's a dict with first/last
    if isinstance(full_name_data, dict):
        full_name = f"{full_name_data.get('first', '')} {full_name_data.get('last', '')}".strip()
    else:
        full_name = str(full_name_data) if full_name_data else ''

    # Format DOB and Address
    formatted_dob = format_date_of_birth(date_of_birth)
    formatted_address = format_address(address)

    # Parse submission date
    submission_date_str = submission.get('created_at', '')
    try:
        submission_date = datetime.strptime(submission_date_str, '%Y-%m-%d %H:%M:%S')
        submission_date = django_timezone.make_aware(submission_date)
    except:
        submission_date = django_timezone.now()

    return {
        'jotform_submission_id': submission.get('id'),
        'jotform_id': submission.get('id'),
        'name': full_name if full_name else 'N/A',
        'email': email if email else 'N/A',
        'phone': phone if phone else 'N/A',
        'date_of_birth': formatted_dob,
        'gender': gender if gender else 'N/A',
        'address': formatted_address,
        'unique_id': unique_id if unique_id else 'N/A',
        'college_name': college_name if college_name else 'N/A',
        'qualification': qualification if qualification else 'N/A',
        'branch': branch if branch else 'N/A',
        'year_of_passing': year_of_passing if year_of_passing else 'N/A',
        'semester': semester if semester else 'N/A',
        'area_of_interest': area_of_interest if area_of_interest else 'N/A',
        'preferred_location': preferred_location if preferred_location else 'N/A',
        'linkedin_profile': linkedin_profile if linkedin_profile else 'N/A',
        'reference_by': reference_by if reference_by else 'N/A',
        'tnp_contact': tnp_contact if tnp_contact else 'N/A',
        'applicant_status': applicant_status if applicant_status else 'N/A',
        'available_6_months': available_6_months if available_6_months else 'N/A',
        'willing_plant_location': willing_plant_location if willing_plant_location else 'N/A',
        'willing_shifts': willing_shifts if willing_shifts else 'N/A',
        'cv_url': cv_url,
        'photo': photo_url,
        'signature': signature_url,
        'last_project_report': last_project_report,
        'has_cv': has_cv,
        'status': 'Pending Mentor Assignment',
        'submission_date': submission_date,
        'source': 'JotForm',
    }


def fetch_jotform_candidates(since=None, form_id=DEFAULT_FORM_ID, limit=1000, offset=0):
    """
    Fetch candidates from JotForm API.

    Args:
        since: datetime object - fetch candidates after this timestamp
        form_id: JotForm form ID
        limit: number of records per batch (max 1000)
        offset: number of records to skip (for pagination)

    Returns:
        List of candidate dictionaries
    """
    url = f"{JOTFORM_API_BASE}/form/{form_id}/submissions"
    params = {
        'apiKey': JOTFORM_API_KEY,
        'limit': limit,
        'offset': offset,
        'orderby': 'created_at',
        'order': 'asc'  # Oldest first
    }

    # Add date filter if specified
    if since:
        # Format: YYYY-MM-DD HH:MM:SS
        since_str = since.strftime('%Y-%m-%d %H:%M:%S')
        params['filtercreated_at_greater_than'] = since_str

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if data.get('responseCode') != 200:
            raise Exception(f"Failed to fetch from JotForm: {data}")

        submissions = data.get('content', [])
        return submissions
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to connect to JotForm API: {str(e)}")
    except Exception as e:
        raise Exception(f"Error processing request: {str(e)}")


def sync_candidates(sync_type='INCREMENTAL', form_id=DEFAULT_FORM_ID):
    """
    Sync candidates from JotForm to local database.

    Args:
        sync_type: 'FULL' or 'INCREMENTAL'
        form_id: JotForm form ID

    Returns:
        Dict with sync results
    """
    # Create sync log entry
    sync_log = SyncLog.objects.create(
        sync_type=sync_type,
        start_time=django_timezone.now(),
        status='RUNNING'
    )

    try:
        # Get last sync timestamp
        last_sync_time = None
        if sync_type == 'INCREMENTAL':
            last_sync = SyncLog.objects.filter(
                sync_type__in=['INCREMENTAL', 'FULL'],
                status='COMPLETED'
            ).order_by('-start_time').first()

            if last_sync:
                last_sync_time = last_sync.start_time
                sync_log.last_sync_timestamp = last_sync_time

        # Fetch candidates from JotForm
        all_submissions = []
        offset = 0
        batch_size = 1000
        max_requests = 10
        requests_made = 0

        while requests_made < max_requests:
            # Get submissions in batches with offset for pagination
            submissions = fetch_jotform_candidates(
                since=last_sync_time,
                form_id=form_id,
                limit=batch_size,
                offset=offset
            )

            if not submissions:
                break

            all_submissions.extend(submissions)
            requests_made += 1

            # If we got less than batch_size, we've fetched all data
            if len(submissions) < batch_size:
                break

            offset += batch_size

        sync_log.records_fetched = len(all_submissions)

        # Import Candidate model
        from candidates.models import Candidate
        import uuid

        # Save candidates directly to Candidate table (single source of truth)
        records_saved = 0
        records_updated = 0

        with transaction.atomic():
            for submission in all_submissions:
                candidate_data = extract_candidate_data(submission)
                jotform_submission_id = candidate_data['jotform_submission_id']

                # Check if already synced by checking JotFormCandidate table
                try:
                    existing_jotform = JotFormCandidate.objects.get(
                        jotform_submission_id=jotform_submission_id
                    )
                    # Already exists, skip it
                    records_updated += 1
                    continue

                except JotFormCandidate.DoesNotExist:
                    # New submission - save to Candidate table directly
                    # Only create if name is valid (not N/A or empty)
                    name = candidate_data.get('name', '').strip()
                    email = candidate_data.get('email', '').strip()

                    if name and name not in ['', 'N/A', 'null'] and email:
                        try:
                            # Check if candidate with this email already exists in Candidate table
                            if not Candidate.objects.filter(email=email).exists():
                                candidate_id = str(uuid.uuid4()).replace('-', '')[:22]

                                # Create quest_data from jotform fields
                                quest_data = {
                                    'phone': candidate_data.get('phone'),
                                    'date_of_birth': candidate_data.get('date_of_birth'),
                                    'gender': candidate_data.get('gender'),
                                    'address': candidate_data.get('address'),
                                    'unique_id': candidate_data.get('unique_id'),
                                    'college_name': candidate_data.get('college_name'),
                                    'qualification': candidate_data.get('qualification'),
                                    'branch': candidate_data.get('branch'),
                                    'year_of_passing': candidate_data.get('year_of_passing'),
                                    'semester': candidate_data.get('semester'),
                                    'area_of_interest': candidate_data.get('area_of_interest'),
                                    'preferred_location': candidate_data.get('preferred_location'),
                                    'linkedin_profile': candidate_data.get('linkedin_profile'),
                                    'reference_by': candidate_data.get('reference_by'),
                                    'tnp_contact': candidate_data.get('tnp_contact'),
                                    'applicant_status': candidate_data.get('applicant_status'),
                                    'available_6_months': candidate_data.get('available_6_months'),
                                    'willing_plant_location': candidate_data.get('willing_plant_location'),
                                    'willing_shifts': candidate_data.get('willing_shifts'),
                                    'cv_url': candidate_data.get('cv_url'),
                                    'photo': candidate_data.get('photo'),
                                    'signature': candidate_data.get('signature'),
                                    'last_project_report': candidate_data.get('last_project_report'),
                                    'has_cv': candidate_data.get('has_cv', False),
                                    'jotform_id': candidate_data.get('jotform_id'),
                                    'jotform_submission_id': jotform_submission_id,
                                    'source': 'JotForm',
                                    'submission_date': candidate_data.get('submission_date')
                                }

                                # Create directly in Candidate table
                                Candidate.objects.create(
                                    id=candidate_id,
                                    name=name,
                                    email=email,
                                    status=Candidate.CandidateStatus.PENDING_ASSIGNMENT,
                                    quest_data=quest_data
                                )

                                # Also save to JotFormCandidate table for tracking
                                JotFormCandidate.objects.create(**candidate_data)
                                records_saved += 1

                            else:
                                # Email exists, just track in JotFormCandidate table
                                JotFormCandidate.objects.create(**candidate_data)
                                records_updated += 1

                        except Exception as e:
                            # Log error but continue
                            print(f"Error creating Candidate record: {str(e)}")
                            continue
                    else:
                        # Invalid name, just track in JotFormCandidate table
                        JotFormCandidate.objects.create(**candidate_data)
                        records_updated += 1

        # Update sync log
        sync_log.end_time = django_timezone.now()
        sync_log.status = 'COMPLETED'
        sync_log.records_saved = records_saved
        sync_log.records_updated = records_updated
        sync_log.save()

        return {
            'success': True,
            'sync_log_id': sync_log.id,
            'fetched': len(all_submissions),
            'saved': records_saved,
            'updated': records_updated,
            'message': f"Synced {len(all_submissions)} candidates ({records_saved} new, {records_updated} updated)"
        }

    except Exception as e:
        # Update sync log with error
        sync_log.end_time = django_timezone.now()
        sync_log.status = 'FAILED'
        sync_log.error_message = str(e)
        sync_log.save()

        return {
            'success': False,
            'sync_log_id': sync_log.id,
            'error': str(e),
            'message': f"Sync failed: {str(e)}"
        }


def get_last_sync_info():
    """Get information about the last sync operation"""
    last_sync = SyncLog.objects.filter(
        status='COMPLETED'
    ).order_by('-start_time').first()

    if last_sync:
        return {
            'last_sync_time': last_sync.start_time,
            'last_sync_type': last_sync.sync_type,
            'total_fetched': last_sync.records_fetched,
            'total_saved': last_sync.records_saved,
            'total_updated': last_sync.records_updated,
        }
    else:
        return {
            'last_sync_time': None,
            'message': 'No syncs performed yet'
        }