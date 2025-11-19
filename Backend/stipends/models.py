from django.db import models
from interns.models import Intern
import time

class ApprovalStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    APPROVED = 'Approved', 'Approved'
    REJECTED = 'Rejected', 'Rejected'

class Stipend(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE, related_name='stipends')
    month = models.CharField(max_length=7)  # Format: YYYY-MM
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    working_days = models.PositiveIntegerField()
    leaves_taken = models.PositiveIntegerField()
    comments = models.TextField(blank=True)
    intern_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                                      default=ApprovalStatus.PENDING)
    hr_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                                  default=ApprovalStatus.PENDING)
    hod_approval = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                                   default=ApprovalStatus.PENDING)
    invoice_url = models.URLField(blank=True)
    intern_signature_url = models.TextField(blank=True)
    hr_signature_url = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['intern', 'month']

    def save(self, *args, **kwargs):
        # Auto-generate ID if not provided
        if not self.id:
            self.id = f"s_{int(time.time() * 1000000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intern.user.name} - {self.month}"
