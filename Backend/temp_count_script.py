import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from users.models import User
from departments.models import Department
from candidates.models import Candidate

hod_user = User.objects.filter(role=User.Role.HOD).first()

if hod_user:
    hod_departments = Department.objects.filter(hod=hod_user)
    if hod_departments.exists():
        candidate_count = Candidate.objects.filter(
            department__in=hod_departments,
            status=Candidate.CandidateStatus.PENDING_HOD_APPROVAL
        ).count()
        print(f'Number of candidates pending HOD approval for {hod_user.name} ({hod_user.email}): {candidate_count}')
    else:
        print(f'No departments found for HOD: {hod_user.name} ({hod_user.email})')
else:
    print('No HOD user found in the system.')