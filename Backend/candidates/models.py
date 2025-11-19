from django.db import models
from users.models import User
from departments.models import Department

class Candidate(models.Model):
    class CandidateStatus(models.TextChoices):
        PENDING_ASSIGNMENT = 'Pending Mentor Assignment', 'Pending Mentor Assignment'
        PENDING_INTERVIEW = 'Pending Interview Assessment', 'Pending Interview Assessment'
        PENDING_HOD_APPROVAL = 'Pending HOD Approval', 'Pending HOD Approval'
        REJECTED = 'Rejected', 'Rejected'
        SELECTED = 'Selected', 'Selected'
        ONBOARDED = 'Onboarded', 'Onboarded'

    id = models.CharField(primary_key=True, max_length=255)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    photo = models.ImageField(upload_to='photos/', null=True, blank=True)
    signature = models.ImageField(upload_to='signatures/', null=True, blank=True)
    last_project_report = models.FileField(upload_to='project_reports/', null=True, blank=True)
    quest_data = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=CandidateStatus.choices, 
                             default=CandidateStatus.PENDING_ASSIGNMENT)
    assigned_mentor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                       related_name='assigned_candidates')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    interview_feedback = models.JSONField(null=True, blank=True)
    hod_feedback = models.TextField(null=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    joining_time = models.TimeField(null=True, blank=True)
    joining_location = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.status}"
