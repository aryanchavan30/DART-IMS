from django.db import models
from interns.models import Intern
from stipends.models import ApprovalStatus

class ExitRequest(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE, related_name='exit_requests')
    feedback = models.JSONField(null=True, blank=True)
    internship_report = models.TextField(null=True, blank=True)  # Can store file path or URL
    certificate = models.TextField(null=True, blank=True)  # Can store base64 data URL
    status = models.CharField(max_length=10, choices=ApprovalStatus.choices, 
                             default=ApprovalStatus.PENDING)
    hr_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices, 
                                  default=ApprovalStatus.PENDING)
    mentor_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices, 
                                      default=ApprovalStatus.PENDING)
    hod_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices, 
                                   default=ApprovalStatus.PENDING)
    hr_comments = models.TextField(blank=True)
    mentor_comments = models.TextField(blank=True)
    hod_comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-generate ID if not set
        if not self.id:
            from django.utils import timezone
            self.id = str(int(timezone.now().timestamp() * 1000))

        # Auto-update status based on approvals
        if (self.hr_approval == ApprovalStatus.APPROVED and
            self.mentor_approval == ApprovalStatus.APPROVED and
            self.hod_approval == ApprovalStatus.APPROVED):
            self.status = ApprovalStatus.APPROVED
        elif (self.hr_approval == ApprovalStatus.REJECTED or
              self.mentor_approval == ApprovalStatus.REJECTED or
              self.hod_approval == ApprovalStatus.REJECTED):
            self.status = ApprovalStatus.REJECTED
        else:
            self.status = ApprovalStatus.PENDING

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intern.user.name} - Exit Request"
