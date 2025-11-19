from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import models
from .models import JobApplication
from .serializers import JobApplicationSerializer
import requests
import json

JOTFORM_API_KEY = 'dbd13d8434fd905966c4ba6ca92b1b84'
JOTFORM_API_BASE = 'https://api.jotform.com'

@permission_classes([AllowAny])
class JobApplicationCreateView(generics.CreateAPIView):
    """
    API endpoint to create a new Job Application.
    Accepts POST requests with application data.
    The 'photo' and 'signature' fields should be Base64 encoded strings.
    """
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Application submitted successfully.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

@permission_classes([AllowAny])
class JobApplicationListView(generics.ListAPIView):
    """
    API endpoint to list all Job Applications from database.
    """
    queryset = JobApplication.objects.all().order_by('-submission_date')
    serializer_class = JobApplicationSerializer
    permission_classes = [AllowAny]

@permission_classes([AllowAny])
class JotFormSubmissionsView(generics.ListAPIView):
    """
    API endpoint to fetch and display job applications from JotForm.
    Fetches real-time data from JotForm API.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Fetch submissions from JotForm API
        """
        try:
            # Get form ID from query params or use a default
            form_id = request.query_params.get('form_id', '212151286490452')
            
            if not form_id:
                return Response(
                    {'error': 'form_id parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fetch from JotForm API
            url = f"{JOTFORM_API_BASE}/form/{form_id}/submissions"
            params = {'apiKey': JOTFORM_API_KEY}
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('responseCode') != 200:
                return Response(
                    {'error': 'Failed to fetch from JotForm', 'details': data},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            submissions = data.get('content', [])
            
            # Transform submissions to a more readable format
            transformed_submissions = []
            
            for submission in submissions:
                # Extract answers
                answers = submission.get('answers', {})

                # Map JotForm field IDs to readable field names
                # Field 3: candidateName, Field 4: phNumber, Field 5: email, Field 6: domain, Field 7: uploadCv
                submission_data = {
                    'id': submission.get('id'),
                    'submission_id': submission.get('id'),
                    'created_at': submission.get('created_at'),
                    'full_name': answers.get('3', {}).get('answer', ''),
                    'email': answers.get('5', {}).get('answer', ''),
                    'contact_number': answers.get('4', {}).get('answer', ''),
                    'date_of_birth': '',
                    'gender': '',
                    'college_name': '',
                    'qualification': answers.get('6', {}).get('answer', ''),
                    'branch': '',
                    'area_of_interest': answers.get('6', {}).get('answer', ''),
                    'preferred_location': '',
                    'status': 'Pending',
                    'jotform_unique_id': submission.get('id')
                }

                # Add file URLs if available
                if '7' in answers:  # CV field
                    cv_answer = answers['7'].get('answer')
                    if isinstance(cv_answer, list):
                        submission_data['cv_url'] = cv_answer[0] if cv_answer else None
                    else:
                        submission_data['cv_url'] = cv_answer
                    submission_data['photo_url'] = None
                    submission_data['signature_url'] = None

                transformed_submissions.append(submission_data)
            
            return Response({
                'count': len(transformed_submissions),
                'submissions': transformed_submissions
            })
            
        except requests.exceptions.RequestException as e:
            return Response(
                {'error': f'Failed to connect to JotForm API: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Error processing request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_jotform_forms(request):
    """
    Get list of all forms from JotForm account
    """
    try:
        url = f"{JOTFORM_API_BASE}/user/forms"
        params = {'apiKey': JOTFORM_API_KEY}
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('responseCode') != 200:
            return Response(
                {'error': 'Failed to fetch forms from JotForm'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        forms = data.get('content', [])
        
        # Return simplified form list
        form_list = []
        for form in forms:
            form_list.append({
                'id': form.get('id'),
                'title': form.get('title'),
                'created': form.get('created'),
                'updated': form.get('updated'),
                'url': form.get('url')
            })
        
        return Response({
            'count': len(form_list),
            'forms': form_list
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_jotform_candidates(request):
    """
    Get job applications from JotForm and format them for display.
    Supports pagination and search across all candidates.
    """
    try:
        # Get form ID from query params
        form_id = request.query_params.get('form_id', '212151286490452')

        # Get search parameter
        search_term = request.query_params.get('search', '').strip().lower()

        # Get pagination parameters
        if request.query_params.get('all') == 'true' or search_term:
            # Fetch all candidates if searching or if 'all=true'
            all_submissions = []
            offset = 0
            batch_size = 1000  # JotForm max limit
            max_requests = 10  # Prevent infinite loops
            requests_made = 0

            while requests_made < max_requests:
                url = f"{JOTFORM_API_BASE}/form/{form_id}/submissions"
                params = {
                    'apiKey': JOTFORM_API_KEY,
                    'limit': batch_size,
                    'offset': offset,
                    'orderby': 'created_at',
                    'order': 'desc'
                }

                response = requests.get(url, params=params)
                response.raise_for_status()

                data = response.json()

                if data.get('responseCode') != 200:
                    return Response(
                        {'error': 'Failed to fetch from JotForm', 'details': data},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                batch_submissions = data.get('content', [])
                if not batch_submissions:
                    break  # No more data

                all_submissions.extend(batch_submissions)
                offset += batch_size
                requests_made += 1

                # If we got less than batch_size, we've fetched all data
                if len(batch_submissions) < batch_size:
                    break

            submissions = all_submissions
        else:
            # Single request with pagination
            limit = int(request.query_params.get('limit', '100'))
            offset = int(request.query_params.get('offset', '0'))
            limit = min(limit, 1000)  # JotForm max limit

            url = f"{JOTFORM_API_BASE}/form/{form_id}/submissions"
            params = {
                'apiKey': JOTFORM_API_KEY,
                'limit': limit,
                'offset': offset,
                'orderby': 'created_at',
                'order': 'desc'
            }

            response = requests.get(url, params=params)
            response.raise_for_status()

            data = response.json()

            if data.get('responseCode') != 200:
                return Response(
                    {'error': 'Failed to fetch from JotForm', 'details': data},
                    status=status.HTTP_400_BAD_REQUEST
                )

            submissions = data.get('content', [])
        
        # Get total count if doing pagination
        total_count = len(submissions)
        if request.query_params.get('all') == 'true':
            # If fetching all, we already have the total
            total_count = len(submissions)
        else:
            # For pagination, get total from form info
            try:
                form_url = f"{JOTFORM_API_BASE}/form/{form_id}"
                form_params = {'apiKey': JOTFORM_API_KEY}
                form_response = requests.get(form_url, params=form_params)
                form_data = form_response.json()
                if form_data.get('responseCode') == 200:
                    total_count = int(form_data.get('content', {}).get('count', 0))
            except:
                # Fallback to current batch size if form info fails
                pass

        # Transform submissions to candidate format
        candidates = []

        for submission in submissions:
            answers = submission.get('answers', {})

            # Map ALL JotForm fields for form 212151286490452
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

            # Additional fields from JotForm
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

            # Document fields from JotForm
            # Field 52: Photograph, Field 47: Project Report, Field 68: Signature
            photo_url = None
            last_project_report = None
            signature_url = None

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

            # Format name if it's a dict with first/last
            if isinstance(full_name_data, dict):
                full_name = f"{full_name_data.get('first', '')} {full_name_data.get('last', '')}".strip()
            else:
                full_name = str(full_name_data) if full_name_data else ''

            # Format date_of_birth if it's a dict with month/day/year
            formatted_dob = 'N/A'
            if date_of_birth:
                if isinstance(date_of_birth, dict):
                    year = date_of_birth.get('year', '')
                    month = date_of_birth.get('month', '')
                    day = date_of_birth.get('day', '')
                    if year and month and day:
                        formatted_dob = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    else:
                        formatted_dob = 'N/A'
                else:
                    formatted_dob = str(date_of_birth)

            # Format address if it's a dict
            formatted_address = 'N/A'
            if address:
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
                    formatted_address = ', '.join(addr_parts) if addr_parts else 'N/A'
                else:
                    formatted_address = str(address)

            # Create candidate object with ALL fields
            candidate = {
                'id': submission.get('id'),
                'jotform_id': submission.get('id'),
                'name': full_name if full_name else 'N/A',
                'email': email if email else 'N/A',
                'phone': phone if phone else 'N/A',
                'date_of_birth': formatted_dob,
                'gender': gender if gender else 'N/A',
                'college_name': college_name if college_name else 'N/A',
                'qualification': qualification if qualification else 'N/A',
                'branch': branch if branch else 'N/A',
                'year_of_passing': year_of_passing if year_of_passing else 'N/A',
                'area_of_interest': area_of_interest if area_of_interest else 'N/A',
                'preferred_location': preferred_location if preferred_location else 'N/A',
                'status': 'Pending Mentor Assignment',
                'submission_date': submission.get('created_at'),
                'created_at': submission.get('created_at'),
                'source': 'JotForm',
                'has_cv': False,
                'cv_url': None,
                'photo': photo_url,
                'signature': signature_url,
                'last_project_report': last_project_report,
                # Additional fields
                'unique_id': unique_id if unique_id else 'N/A',
                'address': formatted_address,
                'linkedin_profile': linkedin_profile if linkedin_profile else 'N/A',
                'reference_by': reference_by if reference_by else 'N/A',
                'tnp_contact': tnp_contact if tnp_contact else 'N/A',
                'semester': semester if semester else 'N/A',
                'applicant_status': applicant_status if applicant_status else 'N/A',
                'available_6_months': available_6_months if available_6_months else 'N/A',
                'willing_plant_location': willing_plant_location if willing_plant_location else 'N/A',
                'willing_shifts': willing_shifts if willing_shifts else 'N/A',
            }

            # Check for CV/file attachments (Field 21)
            if '21' in answers:
                cv_answer = answers['21'].get('answer')
                if cv_answer:
                    candidate['has_cv'] = True
                    if isinstance(cv_answer, list):
                        candidate['cv_url'] = cv_answer[0] if cv_answer else None
                    else:
                        candidate['cv_url'] = cv_answer

            # Skip if no name or email
            if candidate['name'] != 'N/A' or candidate['email'] != 'N/A':
                candidates.append(candidate)

        # Sort by submission date (latest first)
        candidates.sort(key=lambda x: x['submission_date'], reverse=True)

        # Apply search filter if search term is provided
        if search_term:
            filtered_candidates = []
            search_fields = ['name', 'email', 'phone', 'qualification', 'branch', 'area_of_interest', 'college_name']

            for candidate in candidates:
                # Check if any field contains the search term
                for field in search_fields:
                    field_value = str(candidate.get(field, '')).lower()
                    if search_term in field_value:
                        filtered_candidates.append(candidate)
                        break  # Found a match, add candidate and move to next

            candidates = filtered_candidates
            # For search results, the count is the number of matches
            if request.query_params.get('all') != 'true' and request.query_params.get('search'):
                total_count = len(candidates)

        return Response({
            'count': total_count,
            'candidates': candidates
        })
        
    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'Failed to connect to JotForm API: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Error processing request: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# SYNC ENDPOINTS - For storing JotForm data locally
# ============================================================================

from .sync_service import sync_candidates, get_last_sync_info
from .models import JotFormCandidate


@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_sync(request):
    """
    Trigger a sync operation with JotForm.
    Can be full sync or incremental sync.
    """
    try:
        sync_type = request.data.get('sync_type', 'INCREMENTAL').upper()
        form_id = request.data.get('form_id', '212151286490452')

        if sync_type not in ['FULL', 'INCREMENTAL']:
            return Response(
                {'error': 'sync_type must be FULL or INCREMENTAL'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = sync_candidates(sync_type=sync_type, form_id=form_id)

        if result['success']:
            return Response({
                'message': result['message'],
                'sync_log_id': result['sync_log_id'],
                'fetched': result['fetched'],
                'saved': result['saved'],
                'updated': result['updated']
            })
        else:
            return Response({
                'error': result['error'],
                'message': result['message']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response(
            {'error': f'Error triggering sync: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_sync_info(request):
    """
    Get information about the last sync operation.
    """
    try:
        info = get_last_sync_info()
        return Response(info)
    except Exception as e:
        return Response(
            {'error': f'Error getting sync info: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_local_candidates(request):
    """
    Get candidates from local database (fast, no JotForm API calls).
    Supports pagination and search.
    """
    try:
        # Get pagination parameters
        limit = int(request.query_params.get('limit', '50'))
        offset = int(request.query_params.get('offset', '0'))
        search_term = request.query_params.get('search', '').strip().lower()

        # Build query
        query = JotFormCandidate.objects.all()

        # Apply search filter
        if search_term:
            query = query.filter(
                models.Q(name__icontains=search_term) |
                models.Q(email__icontains=search_term) |
                models.Q(phone__icontains=search_term) |
                models.Q(qualification__icontains=search_term) |
                models.Q(branch__icontains=search_term) |
                models.Q(area_of_interest__icontains=search_term) |
                models.Q(college_name__icontains=search_term)
            )

        # Get total count
        total_count = query.count()

        # Apply ordering and pagination
        candidates = query.order_by('-submission_date')[offset:offset + limit]

        # Convert to list of dicts
        candidate_list = []
        for candidate in candidates:
            candidate_dict = {
                'id': candidate.jotform_submission_id,
                'jotform_id': candidate.jotform_id,
                'name': candidate.name,
                'email': candidate.email,
                'phone': candidate.phone,
                'date_of_birth': candidate.date_of_birth,
                'gender': candidate.gender,
                'college_name': candidate.college_name,
                'qualification': candidate.qualification,
                'branch': candidate.branch,
                'year_of_passing': candidate.year_of_passing,
                'area_of_interest': candidate.area_of_interest,
                'preferred_location': candidate.preferred_location,
                'status': candidate.status,
                'submission_date': candidate.submission_date.isoformat() if candidate.submission_date else None,
                'created_at': candidate.created_at.isoformat() if candidate.created_at else None,
                'source': candidate.source,
                'has_cv': candidate.has_cv,
                'cv_url': candidate.cv_url,
                'photo': candidate.photo,
                'signature': candidate.signature,
                'last_project_report': candidate.last_project_report,
                'unique_id': candidate.unique_id,
                'address': candidate.address,
                'linkedin_profile': candidate.linkedin_profile,
                'reference_by': candidate.reference_by,
                'tnp_contact': candidate.tnp_contact,
                'semester': candidate.semester,
                'applicant_status': candidate.applicant_status,
                'available_6_months': candidate.available_6_months,
                'willing_plant_location': candidate.willing_plant_location,
                'willing_shifts': candidate.willing_shifts,
                # Include mentor assignment fields
                'assigned_mentor_id': candidate.assigned_mentor,
                'assigned_mentor_name': candidate.assigned_mentor_name,
                # Include other workflow fields
                'interview_feedback': candidate.interview_feedback,
                'hod_feedback': candidate.hod_feedback,
                'department': candidate.department,
                'departmentName': candidate.departmentName,
            }
            candidate_list.append(candidate_dict)

        return Response({
            'count': total_count,
            'candidates': candidate_list
        })

    except Exception as e:
        return Response(
            {'error': f'Error fetching candidates: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
