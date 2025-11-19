from django.db import models
from interns.models import Intern
from stipends.models import ApprovalStatus
import time

class LeaveRequest(models.Model):
    class LeaveType(models.TextChoices):
        FULL_DAY = 'Full Day', 'Full Day'
        HALF_DAY = 'Half Day', 'Half Day'
        OTHER = 'Other', 'Other'

    class LeaveHalf(models.TextChoices):
        FIRST_HALF = '1st Half', '1st Half'
        SECOND_HALF = '2nd Half', '2nd Half'

    id = models.CharField(primary_key=True, max_length=255)
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=10, choices=LeaveType.choices)
    leave_half = models.CharField(max_length=10, choices=LeaveHalf.choices, null=True, blank=True)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=ApprovalStatus.choices,
                             default=ApprovalStatus.PENDING)
    mail_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-generate ID if not provided
        if not self.id:
            self.id = f"l_{int(time.time() * 1000000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intern.user.name} - {self.start_date} to {self.end_date}"
