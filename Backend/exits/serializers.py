from rest_framework import serializers
from .models import ExitRequest


class ExitRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for ExitRequest model
    """
    intern_name = serializers.CharField(source='intern.user.name', read_only=True)
    intern_email = serializers.CharField(source='intern.user.email', read_only=True)
    intern_department = serializers.CharField(source='intern.candidate.department.name', read_only=True)

    class Meta:
        model = ExitRequest
        fields = [
            'id',
            'intern',
            'intern_name',
            'intern_email',
            'intern_department',
            'feedback',
            'internship_report',
            'certificate',
            'status',
            'hr_approval',
            'mentor_approval',
            'hod_approval',
            'hr_comments',
            'mentor_comments',
            'hod_comments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'intern_name',
            'intern_email',
            'intern_department',
            'created_at',
            'updated_at',
        ]
