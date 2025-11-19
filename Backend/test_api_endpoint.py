#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from candidates.views import CandidateViewSet
from users.models import User
from django.contrib.auth.models import AnonymousUser

# Create a test request to the /candidates/ endpoint
factory = APIRequestFactory()

# Get Amit Sayare user
amit = User.objects.get(id='37')

# Create a viewset
view = CandidateViewSet.as_view({'get': 'list'})

# Create a request with Amit as the user
request = factory.get('/api/candidates/')
request.user = amit

# Call the view
response = view(request)

print("=" * 70)
print("API ENDPOINT: /api/candidates/")
print("=" * 70)
print()

# Print the response data
data = response.data

print(f"Response type: {type(data)}")
print(f"Is paginated: {hasattr(data, 'results')}")

if hasattr(data, 'results'):
    # Paginated response
    results = data['results']
    print(f"Total count: {data.get('count', 'N/A')}")
    print(f"Results count: {len(results)}")
    print()
    print("=" * 70)
    print("CANDIDATES RETURNED BY API")
    print("=" * 70)
    print()

    for i, cand in enumerate(results, 1):
        print(f"{i}. {cand.get('name', 'N/A')}")
        print(f"   ID: {cand.get('id', 'N/A')}")
        print(f"   Status: {cand.get('status', 'N/A')}")
        print(f"   assigned_mentor_id: {cand.get('assigned_mentor_id', 'N/A')}")
        print(f"   assigned_mentor_name: {cand.get('assigned_mentor_name', 'N/A')}")
        print(f"   department_name: {cand.get('department_name', 'N/A')}")
        print()

    print("=" * 70)
    print("FILTERING FOR AMIT SAYARE (ID: 37)")
    print("=" * 70)
    print()

    amit_candidates = [
        cand for cand in results
        if str(cand.get('assigned_mentor_id', '')) == '37'
    ]
    print(f"Candidates assigned to Amit: {len(amit_candidates)}")
    print()

    for i, cand in enumerate(amit_candidates, 1):
        print(f"{i}. {cand.get('name')} - Status: {cand.get('status')}")
        print()

    print("=" * 70)
    print("FILTERING FOR PENDING INTERVIEW")
    print("=" * 70)
    print()

    pending_interview = [
        cand for cand in amit_candidates
        if cand.get('status') == 'Pending Interview Assessment'
    ]
    print(f"Pending Interview candidates: {len(pending_interview)}")
    print()

    for i, cand in enumerate(pending_interview, 1):
        print(f"{i}. {cand.get('name')} - Status: {cand.get('status')}")
        print()

else:
    # Non-paginated response
    print(f"Response is a dict: {data}")
    print()

    if isinstance(data, dict) and 'results' in data:
        results = data['results']
    else:
        results = data if isinstance(data, list) else [data]

    print(f"Results count: {len(results)}")
    print()

    for i, cand in enumerate(results, 1):
        if isinstance(cand, dict):
            print(f"{i}. {cand.get('name', 'N/A')}")
            print(f"   ID: {cand.get('id', 'N/A')}")
            print(f"   Status: {cand.get('status', 'N/A')}")
            print(f"   assigned_mentor_id: {cand.get('assigned_mentor_id', 'N/A')}")
            print(f"   assigned_mentor_name: {cand.get('assigned_mentor_name', 'N/A')}")
        else:
            print(f"{i}. Unknown data type: {cand}")
        print()
