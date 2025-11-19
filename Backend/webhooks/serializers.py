# applications/serializers.py

from rest_framework import serializers
from drf_extra_fields.fields import Base64ImageField
from .models import JobApplication

class JobApplicationSerializer(serializers.ModelSerializer):
    # This field accepts a Base64 encoded string and converts it to an image file.
    photo = Base64ImageField(required=True)
    signature = Base64ImageField(required=True)

    class Meta:
        model = JobApplication
        # List all fields you want to be able to write to via the API
        fields = [
            'full_name', 'email', 'contact_number', 'date_of_birth', 'gender',
            'address', 'linkedin_profile', 'college_name', 'qualification',
            'branch', 'year_of_passing', 'applicant_status', 'area_of_interest',
            'preferred_location', 'reference_by', 'cv', 'photo', 'signature',
            'available_for_6_months', 'willing_to_work_from_plant',
            'willing_to_work_in_shifts', 'declaration_accepted',
            # Read-only fields are automatically excluded from write operations
            'id', 'application_id', 'submission_date', 'status'
        ]
        # You can also use fields = '__all__' but explicitly listing is often safer.s