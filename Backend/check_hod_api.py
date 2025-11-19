#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from candidates.views import CandidateViewSet
from users.models import User

# Create a test request to simulate HOD accessing /candidates/
factory = APIRequestFactory()

# Get HOD Sachin Kumbhalpuri
hod = User.objects.get(id='30')

# Create a viewset
view = CandidateViewSet.as_view({'get': 'list'})

# Create a request with HOD as the user
request = factory.get('/api/candidates/')
request.user = hod

# Call the view
response = view(request)

print("=" * 70)
print("API RESPONSE FOR HOD (Sachin Kumbhalpuri)")
print("=" * 70)
print()

# Print the response data
data = response.data

print(f"Response type: {type(data)}")
print(f"Response data: {data}")
print()

# Check if it's paginated
if isinstance(data, dict) and 'results' in data:
    # Paginated response
    results = data['results']
    print(f"Total count (all pages): {data.get('count', 'N/A')}")
    print(f"Results count (this page): {len(results)}")
    print()
else:
    # Non-paginated response or error
    print(f"Response keys: {data.keys() if isinstance(data, dict) else 'N/A'}")
    results = data['results'] if isinstance(data, dict) and 'results' in data else []
    print(f"Results: {results}")
    print()

    print("CANDIDATES RETURNED:")
    print("-" * 70)

    for i, cand in enumerate(results, 1):
        print(f"{i}. {cand.get('name', 'N/A')}")
        print(f"   Status: {cand.get('status', 'N/A')}")
        print(f"   Department: {cand.get('department', 'N/A')}")
        print(f"   Department Name: {cand.get('department_name', 'N/A')}")
        print()

    # Filter for HOD's criteria
    hod_dept = 'd_web'
    pending_hod = [
        cand for cand in results
        if cand.get('status') == 'Pending HOD Approval' and
           (cand.get('department') == hod_dept or cand.get('department_name') == 'Web Development')
    ]

    print("=" * 70)
    print(f"MATCHING HOD CRITERIA (Pending HOD Approval + Web Development): {len(pending_hod)}")
    print("=" * 70)

    for i, cand in enumerate(pending_hod, 1):
        print(f"{i}. {cand.get('name')} - {cand.get('status')}")

    if len(pending_hod) == 0:
        print()
        print("[PROBLEM] HOD should see 3 candidates but API is returning 0!")
        print()
        print("All returned candidates:")
        for cand in results:
            print(f"  - {cand.get('name')}: status={cand.get('status')}, dept={cand.get('department')}, dept_name={cand.get('department_name')}")
else:
    # Non-paginated response
    print(f"Results count: {len(data)}")
