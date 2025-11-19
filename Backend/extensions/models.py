from django.db import models
from interns.models import Intern
from stipends.models import ApprovalStatus
from users.models import User

class ExtensionRequest(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE, related_name='extension_requests')
    months_requested = models.PositiveIntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                             default=ApprovalStatus.PENDING)
    hr_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                                  default=ApprovalStatus.PENDING)
    hr_comments = models.TextField(blank=True)
    mentor_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                                      default=ApprovalStatus.PENDING)
    mentor_comments = models.TextField(blank=True)
    hod_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                                   default=ApprovalStatus.PENDING)
    hod_comments = models.TextField(blank=True)
    mhr_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                                   default=ApprovalStatus.PENDING)
    mhr_comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
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
        return f"{self.intern.user.name} - {self.months_requested} months"

class ExtensionPermission(models.Model):
    """
    Tracks HR and HOD approval for an intern's eligibility to request extensions.
    Extension tab only appears when both HR and HOD approve.
    """
    id = models.CharField(primary_key=True, max_length=255)
    intern = models.OneToOneField(Intern, on_delete=models.CASCADE, related_name='extension_permission')
    hr_approved = models.BooleanField(default=False)
    hr_approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                       related_name='hr_extension_approvals')
    hr_approved_at = models.DateTimeField(null=True, blank=True)
    hr_comments = models.TextField(blank=True)
    
    hod_approved = models.BooleanField(default=False)
    hod_approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                        related_name='hod_extension_approvals')
    hod_approved_at = models.DateTimeField(null=True, blank=True)
    hod_comments = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_approved(self):
        """Returns True if both HR and HOD have approved"""
        return self.hr_approved and self.hod_approved
    
    def __str__(self):
        return f"{self.intern.user.name} - Extension Permission (HR: {self.hr_approved}, HOD: {self.hod_approved})"
    
    def save(self, *args, **kwargs):
        # Auto-update the intern's extension_allowed field
        super().save(*args, **kwargs)
        self.intern.extension_allowed = self.is_approved
        self.intern.save()
