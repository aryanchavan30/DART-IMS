import uuid
from django.db import models

class JobApplication(models.Model):
    """
    Model to store job application data.
    """
    # --- Personal Information ---
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contact_number = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    address = models.TextField()
    linkedin_profile = models.URLField(max_length=500, blank=True, null=True)

    # --- Academic Information ---
    college_name = models.CharField(max_length=255)
    qualification = models.CharField(max_length=100)
    branch = models.CharField(max_length=100, help_text="e.g., Mechanical Engineering")
    year_of_passing = models.IntegerField()
    APPLICANT_STATUS_CHOICES = [
        ('Pass-out', 'Pass-out'),
        ('Student', 'Student'),
    ]
    applicant_status = models.CharField(max_length=20, choices=APPLICANT_STATUS_CHOICES)

    # --- Job Preferences ---
    area_of_interest = models.CharField(max_length=255)
    preferred_location = models.CharField(max_length=255)
    reference_by = models.CharField(max_length=100, blank=True)

    # --- Files ---
    cv = models.FileField(upload_to='cvs/%Y/%m/%d/')
    photo = models.ImageField(upload_to='photos/%Y/%m/%d/')
    signature = models.ImageField(upload_to='signatures/%Y/%m/%d/')

    # --- Declarations ---
    available_for_6_months = models.BooleanField(default=False)
    willing_to_work_from_plant = models.BooleanField(default=False)
    willing_to_work_in_shifts = models.BooleanField(default=False)
    declaration_accepted = models.BooleanField(default=False)

    # --- Admin & Tracking Fields ---
    jotform_unique_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    submission_date = models.DateTimeField(auto_now_add=True) # auto_now_add is better for creation time
    application_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Reviewed', 'Reviewed'),
        ('Approved', 'Approved'),
        ('Denied', 'Denied'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    class Meta:
        ordering = ['-submission_date']


class JotFormCandidate(models.Model):
    """
    Model to store JotForm candidate data with all fields.
    This allows us to sync candidates from JotForm and store them locally for fast access.
    """
    # --- Core Identification ---
    jotform_submission_id = models.CharField(max_length=255, unique=True)
    jotform_id = models.CharField(max_length=255)  # duplicate for easier querying

    # --- Personal Information ---
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.CharField(max_length=50, blank=True)  # Store as string: YYYY-MM-DD
    gender = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    unique_id = models.CharField(max_length=100, blank=True)

    # --- Academic Information ---
    college_name = models.CharField(max_length=255, blank=True)
    qualification = models.CharField(max_length=100, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    year_of_passing = models.CharField(max_length=50, blank=True)
    semester = models.CharField(max_length=20, blank=True)

    # --- Professional Information ---
    area_of_interest = models.CharField(max_length=255, blank=True)
    preferred_location = models.CharField(max_length=255, blank=True)
    linkedin_profile = models.URLField(max_length=500, blank=True)
    reference_by = models.CharField(max_length=255, blank=True)
    tnp_contact = models.TextField(blank=True)  # Store as JSON string

    # --- Availability & Preferences ---
    applicant_status = models.CharField(max_length=50, blank=True)
    available_6_months = models.CharField(max_length=10, blank=True)
    willing_plant_location = models.CharField(max_length=10, blank=True)
    willing_shifts = models.CharField(max_length=10, blank=True)

    # --- Document URLs (not files, just URLs from JotForm) ---
    cv_url = models.URLField(max_length=500, blank=True, null=True)
    photo = models.URLField(max_length=500, blank=True, null=True)
    signature = models.URLField(max_length=500, blank=True, null=True)
    last_project_report = models.URLField(max_length=500, blank=True, null=True)

    # --- Document Flags ---
    has_cv = models.BooleanField(default=False)

    # --- Tracking Fields ---
    status = models.CharField(max_length=50, default='Pending Mentor Assignment')
    submission_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    source = models.CharField(max_length=20, default='JotForm')

    # --- Workflow Fields (for integration with existing system) ---
    assigned_mentor = models.CharField(max_length=255, blank=True, null=True)
    assigned_mentor_name = models.CharField(max_length=255, blank=True, null=True)
    interview_feedback = models.JSONField(blank=True, null=True)
    hod_feedback = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    departmentName = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.email})"

    class Meta:
        ordering = ['-submission_date']
        indexes = [
            models.Index(fields=['jotform_submission_id']),
            models.Index(fields=['submission_date']),
        ]


class SyncLog(models.Model):
    """
    Model to track sync operations with JotForm.
    """
    SYNC_TYPE_CHOICES = [
        ('FULL', 'Full Sync'),
        ('INCREMENTAL', 'Incremental Sync'),
        ('MANUAL', 'Manual Sync'),
    ]

    sync_type = models.CharField(max_length=20, choices=SYNC_TYPE_CHOICES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, default='RUNNING')  # RUNNING, COMPLETED, FAILED
    records_fetched = models.IntegerField(default=0)
    records_saved = models.IntegerField(default=0)
    records_updated = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)
    last_sync_timestamp = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.sync_type} - {self.start_time} - {self.status}"

    class Meta:
        ordering = ['-start_time']