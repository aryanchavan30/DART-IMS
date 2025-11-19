
from django.db import models
from users.models import User
from candidates.models import Candidate
import time

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


class Attendance(models.Model):
    class AttendanceStatus(models.TextChoices):
        PRESENT = 'Present', 'Present'
        ABSENT = 'Absent', 'Absent'
        HALF_DAY = 'Half Day', 'Half Day'
        HOLIDAY = 'Holiday', 'Holiday'
        WEEK_OFF = 'Week Off', 'Week Off'

    id = models.CharField(primary_key=True, max_length=255)
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices, default=AttendanceStatus.ABSENT)
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_marked')
    marked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['intern', 'date']
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"att_{int(time.time() * 1000000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intern.user.name} - {self.date} - {self.status}"


class AttendanceTicket(models.Model):
    class TicketStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        APPROVED = 'Approved', 'Approved'
        REJECTED = 'Rejected', 'Rejected'

    id = models.CharField(primary_key=True, max_length=255)
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='tickets')
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE, related_name='attendance_tickets')
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=TicketStatus.choices, default=TicketStatus.PENDING)
    requested_status = models.CharField(max_length=10, choices=Attendance.AttendanceStatus.choices)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_tickets')
    review_comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"ticket_{int(time.time() * 1000000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intern.user.name} - {self.attendance.date} - {self.status}"
