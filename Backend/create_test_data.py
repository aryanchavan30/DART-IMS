#!/usr/bin/env python
import os
import django
import sys

# Set up Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

from users.models import User
from departments.models import Department
from candidates.models import Candidate
from interns.models import Intern
from stipends.models import Stipend
from leaves.models import LeaveRequest
from extensions.models import ExtensionRequest
from exits.models import ExitRequest
from holidays.models import Holiday
from stipends.models import (
    Department, User, Candidate, Intern, Holiday, Stipend, 
    LeaveRequest, ExtensionRequest, ExitRequest, ApprovalStatus
)
from datetime import date, datetime, timedelta
import random

def create_test_data():
    print("Creating comprehensive test data...")
    
    # Get existing departments and mentors
    departments = Department.objects.all()[:4]  # Use first 4 departments with mentors
    mentors = User.objects.filter(role=User.Role.MENTOR)
    
    # Candidate data with different statuses
    candidates_data = [
        # Pending Assignment (4)
        {'name': 'Aarav Sharma', 'email': 'aarav.sharma@gmail.com', 'status': Candidate.CandidateStatus.PENDING_ASSIGNMENT},
        {'name': 'Diya Patel', 'email': 'diya.patel@gmail.com', 'status': Candidate.CandidateStatus.PENDING_ASSIGNMENT},
        {'name': 'Arjun Kumar', 'email': 'arjun.kumar@gmail.com', 'status': Candidate.CandidateStatus.PENDING_ASSIGNMENT},
        {'name': 'Ananya Singh', 'email': 'ananya.singh@gmail.com', 'status': Candidate.CandidateStatus.PENDING_ASSIGNMENT},
        
        # Pending Interview (5)
        {'name': 'Rohan Gupta', 'email': 'rohan.gupta@gmail.com', 'status': Candidate.CandidateStatus.PENDING_INTERVIEW},
        {'name': 'Priya Reddy', 'email': 'priya.reddy@gmail.com', 'status': Candidate.CandidateStatus.PENDING_INTERVIEW},
        {'name': 'Vikram Nair', 'email': 'vikram.nair@gmail.com', 'status': Candidate.CandidateStatus.PENDING_INTERVIEW},
        {'name': 'Shreya Jain', 'email': 'shreya.jain@gmail.com', 'status': Candidate.CandidateStatus.PENDING_INTERVIEW},
        {'name': 'Karthik Iyer', 'email': 'karthik.iyer@gmail.com', 'status': Candidate.CandidateStatus.PENDING_INTERVIEW},
        
        # Pending HOD Approval (3)
        {'name': 'Riya Agarwal', 'email': 'riya.agarwal@gmail.com', 'status': Candidate.CandidateStatus.PENDING_HOD_APPROVAL},
        {'name': 'Aditya Verma', 'email': 'aditya.verma@gmail.com', 'status': Candidate.CandidateStatus.PENDING_HOD_APPROVAL},
        {'name': 'Meera Rao', 'email': 'meera.rao@gmail.com', 'status': Candidate.CandidateStatus.PENDING_HOD_APPROVAL},
        
        # Pending MHR Approval (3)
        {'name': 'Siddharth Bose', 'email': 'siddharth.bose@gmail.com', 'status': Candidate.CandidateStatus.PENDING_MHR_APPROVAL},
        {'name': 'Kavya Menon', 'email': 'kavya.menon@gmail.com', 'status': Candidate.CandidateStatus.PENDING_MHR_APPROVAL},
        {'name': 'Rahul Pandey', 'email': 'rahul.pandey@gmail.com', 'status': Candidate.CandidateStatus.PENDING_MHR_APPROVAL},
        
        # Selected (4)
        {'name': 'Sanya Kapoor', 'email': 'sanya.kapoor@gmail.com', 'status': Candidate.CandidateStatus.SELECTED},
        {'name': 'Dev Sood', 'email': 'dev.sood@gmail.com', 'status': Candidate.CandidateStatus.SELECTED},
        {'name': 'Ishita Das', 'email': 'ishita.das@gmail.com', 'status': Candidate.CandidateStatus.SELECTED},
        {'name': 'Ayush Tiwari', 'email': 'ayush.tiwari@gmail.com', 'status': Candidate.CandidateStatus.SELECTED},
        
        # Rejected (2)
        {'name': 'Zara Khan', 'email': 'zara.khan@gmail.com', 'status': Candidate.CandidateStatus.REJECTED},
        {'name': 'Nikhil Joshi', 'email': 'nikhil.joshi@gmail.com', 'status': Candidate.CandidateStatus.REJECTED},
    ]
    
    # Create candidates
    created_candidates = []
    for i, candidate_data in enumerate(candidates_data):
        candidate_id = f'c_{1000 + i}'
        
        # Assign mentor and department for non-pending-assignment candidates
        mentor = None
        department = None
        interview_feedback = None
        hod_feedback = None
        mhr_feedback = None
        joining_date = None
        
        if candidate_data['status'] != Candidate.CandidateStatus.PENDING_ASSIGNMENT:
            department = random.choice(departments)
            dept_mentors = mentors.filter(department=department)
            if dept_mentors.exists():
                mentor = random.choice(dept_mentors)
        
        # Add feedback based on status
        if candidate_data['status'] in [
            Candidate.CandidateStatus.PENDING_HOD_APPROVAL,
            Candidate.CandidateStatus.PENDING_MHR_APPROVAL,
            Candidate.CandidateStatus.SELECTED
        ]:
            interview_feedback = {
                "ratings": {
                    "Striving for Achievement (Result Orientation)": random.randint(3, 5),
                    "Job / Functional Knowledge": random.randint(3, 5),
                    "Relevant Experience": random.randint(3, 5),
                    "Computer Skills": random.randint(4, 5),
                    "Communication Ability (Verbal/Written)": random.randint(3, 5),
                    "Attitude / Disposition": random.randint(4, 5),
                    "Safety, Health & Environment Awareness": random.randint(3, 4),
                    "Thinking Ability": random.randint(3, 5),
                    "Level of Confidence": random.randint(3, 5),
                    "Overall Assessment": random.randint(3, 5)
                },
                "status": "Selected",
                "overallImpression": f"Good candidate for {department.name if department else 'technology'} role."
            }
        
        if candidate_data['status'] in [Candidate.CandidateStatus.PENDING_MHR_APPROVAL, Candidate.CandidateStatus.SELECTED]:
            hod_feedback = "Approved for internship program"
            
        if candidate_data['status'] == Candidate.CandidateStatus.SELECTED:
            mhr_feedback = "Final approval granted"
            joining_date = date.today() + timedelta(days=random.randint(7, 30))
        
        if candidate_data['status'] == Candidate.CandidateStatus.REJECTED:
            interview_feedback = {
                "ratings": {
                    "Striving for Achievement (Result Orientation)": random.randint(1, 3),
                    "Job / Functional Knowledge": random.randint(1, 3),
                    "Relevant Experience": random.randint(1, 2),
                    "Computer Skills": random.randint(2, 3),
                    "Communication Ability (Verbal/Written)": random.randint(1, 3),
                    "Attitude / Disposition": random.randint(2, 3),
                    "Safety, Health & Environment Awareness": random.randint(2, 3),
                    "Thinking Ability": random.randint(1, 3),
                    "Level of Confidence": random.randint(1, 2),
                    "Overall Assessment": random.randint(1, 2)
                },
                "status": "Not Selected",
                "overallImpression": "Needs more experience in relevant technologies."
            }
        
        candidate, created = Candidate.objects.get_or_create(
            id=candidate_id,
            defaults={
                'name': candidate_data['name'],
                'email': candidate_data['email'],
                'status': candidate_data['status'],
                'assigned_mentor': mentor,
                'department': department,
                'interview_feedback': interview_feedback,
                'hod_feedback': hod_feedback,
                'mhr_feedback': mhr_feedback,
                'joining_date': joining_date,
            }
        )
        
        if created:
            print(f"Created candidate: {candidate.name} ({candidate.status})")
            created_candidates.append(candidate)
    
    # Create interns from selected candidates
    selected_candidates = Candidate.objects.filter(status=Candidate.CandidateStatus.SELECTED)[:2]
    
    for candidate in selected_candidates:
        # Create user for intern
        login_id = f"SIIL-I{candidate.id[-3:]}"
        user, created = User.objects.get_or_create(
            email=candidate.email,
            defaults={
                'name': candidate.name,
                'login_id': login_id,
                'role': User.Role.INTERN,
                'department': candidate.department,
                'dob': date(1998 + random.randint(0, 5), random.randint(1, 12), random.randint(1, 28)),
                'shift': User.Shift.GENERAL,
                'week_offs': [0, 6]
            }
        )
        
        if created:
            print(f"Created intern user: {user.name}")
        
        # Create intern profile
        intern_id = f"i_{int(datetime.now().timestamp())}{random.randint(10, 99)}"
        intern, created = Intern.objects.get_or_create(
            user=user,
            defaults={
                'id': intern_id,
                'candidate': candidate,
                'joining_date': candidate.joining_date or date.today() - timedelta(days=random.randint(30, 120)),
                'mentor': candidate.assigned_mentor,
                'bank_details': {
                    'bank_name': random.choice(['SBI', 'ICICI', 'HDFC', 'Indian Bank', 'Axis Bank']),
                    'account_number': str(random.randint(100000000, 999999999)),
                    'ifsc_code': f"SBIN0{random.randint(100000, 999999)}",
                    'pan_number': f"ABCDE{random.randint(1000, 9999)}F"
                },
                'status': Intern.InternStatus.ACTIVE
            }
        )
        
        if created:
            print(f"Created intern profile: {intern.user.name}")
            # Update candidate status to onboarded
            candidate.status = Candidate.CandidateStatus.ONBOARDED
            candidate.save()
    
    # Create stipends for interns
    interns = Intern.objects.filter(status=Intern.InternStatus.ACTIVE)
    for intern in interns:
        for month_offset in range(3):  # Last 3 months
            stipend_month = date.today().replace(day=1) - timedelta(days=month_offset * 30)
            stipend_id = f"s_{int(datetime.now().timestamp())}{random.randint(10, 99)}"
            
            stipend, created = Stipend.objects.get_or_create(
                intern=intern,
                month=stipend_month.strftime('%Y-%m'),
                defaults={
                    'id': stipend_id,
                    'amount': random.choice([10000, 12000, 15000]),
                    'working_days': random.randint(22, 26),
                    'leaves_taken': random.randint(0, 2),
                    'comments': random.choice(['Good performance', 'Excellent work', '']),
                    'intern_approval': random.choice([ApprovalStatus.APPROVED, ApprovalStatus.PENDING]),
                    'hr_approval': ApprovalStatus.APPROVED,
                    'hod_approval': ApprovalStatus.APPROVED,
                    'mhr_approval': ApprovalStatus.APPROVED,
                }
            )
            
            if created:
                print(f"Created stipend for {intern.user.name} - {stipend_month.strftime('%Y-%m')}")
    
    # Create some leave requests
    for intern in interns:
        for _ in range(random.randint(1, 3)):
            leave_id = f"l_{int(datetime.now().timestamp())}{random.randint(10, 99)}"
            start_date = date.today() - timedelta(days=random.randint(1, 60))
            
            leave, created = LeaveRequest.objects.get_or_create(
                intern=intern,
                start_date=start_date,
                defaults={
                    'id': leave_id,
                    'end_date': start_date,
                    'leave_type': 'Full Day',
                    'reason': random.choice(['Medical appointment', 'Personal work', 'Family function']),
                    'status': random.choice([ApprovalStatus.APPROVED, ApprovalStatus.PENDING]),
                    'mail_sent': True
                }
            )
            
            if created:
                print(f"Created leave request for {intern.user.name}")
    
    # Create extension requests
    if interns.exists():
        requesting_intern = random.choice(interns)
        extension_id = f"e_{int(datetime.now().timestamp())}"
        
        extension, created = ExtensionRequest.objects.get_or_create(
            intern=requesting_intern,
            defaults={
                'id': extension_id,
                'months_requested': random.choice([1, 2, 3]),
                'reason': 'Want to complete ongoing project and gain more experience',
                'status': ApprovalStatus.PENDING,
                'hr_approval': ApprovalStatus.APPROVED,
                'mentor_approval': ApprovalStatus.PENDING,
                'hod_approval': ApprovalStatus.PENDING,
                'mhr_approval': ApprovalStatus.PENDING,
            }
        )
        
        if created:
            print(f"Created extension request for {requesting_intern.user.name}")
    
    # Create exit request
    if interns.exists():
        exiting_intern = random.choice(interns)
        exit_id = f"ex_{int(datetime.now().timestamp())}"
        
        exit_request, created = ExitRequest.objects.get_or_create(
            intern=exiting_intern,
            defaults={
                'id': exit_id,
                'feedback': {
                    'knowledgeBefore': 3,
                    'knowledgeAfter': 5,
                    'developedSkills': 'Python, React, Django, Database management',
                    'relevanceRating': 5,
                    'assignmentSimilarityRating': 4,
                    'organizationRating': 5,
                    'appliedForCertificate': 'Yes',
                    'bestPart': 'Learning new technologies and working on real projects',
                    'suggestions': 'More hands-on workshops would be beneficial',
                    'reasonForLeaving': 'Internship completion',
                    'agreementChecked': True
                },
                'status': ApprovalStatus.PENDING,
                'hr_approval': ApprovalStatus.APPROVED,
                'mentor_approval': ApprovalStatus.PENDING,
                'hod_approval': ApprovalStatus.PENDING,
                'mhr_approval': ApprovalStatus.PENDING,
            }
        )
        
        if created:
            print(f"Created exit request for {exiting_intern.user.name}")
    
    print(f"\nData creation completed!")
    print(f"Total candidates: {Candidate.objects.count()}")
    print(f"Total interns: {Intern.objects.count()}")
    print(f"Total users: {User.objects.count()}")
    print(f"Total stipends: {Stipend.objects.count()}")
    print(f"Total leave requests: {LeaveRequest.objects.count()}")
    print(f"Total extension requests: {ExtensionRequest.objects.count()}")
    print(f"Total exit requests: {ExitRequest.objects.count()}")

if __name__ == '__main__':
    create_test_data()