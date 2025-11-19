
from django.db import models
from users.models import User
from candidates.models import Candidate

class Intern(models.Model):
    class InternStatus(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        COMPLETED = 'Completed', 'Completed'
        LEFT = 'Left', 'Left'

    id = models.CharField(primary_key=True, max_length=255)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='intern_profile')
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='intern_profile')
    joining_date = models.DateField()
    mentor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                              related_name='mentored_interns')
    offer_letter = models.FileField(upload_to='offer_letters/', null=True, blank=True)
    bank_details = models.JSONField(null=True, blank=True)
    extension_allowed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=InternStatus.choices, default=InternStatus.ACTIVE)
    
    # Onboarding documents
    aadhar_card = models.FileField(upload_to='intern_documents/aadhar/', null=True, blank=True)
    pan_card = models.FileField(upload_to='intern_documents/pan/', null=True, blank=True)
    bank_passbook = models.FileField(upload_to='intern_documents/bank/', null=True, blank=True)

    noc = models.FileField(upload_to='intern_documents/noc/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.name} - {self.status}"
