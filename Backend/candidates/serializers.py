from rest_framework import serializers
from .models import Candidate

class CandidateSerializer(serializers.ModelSerializer):
    assigned_mentor_name = serializers.CharField(source='assigned_mentor.name', read_only=True)
    assigned_mentor_id = serializers.CharField(source='assigned_mentor.id', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    resume_url = serializers.SerializerMethodField(read_only=True)
    photo_url = serializers.SerializerMethodField(read_only=True)
    signature_url = serializers.SerializerMethodField(read_only=True)
    last_project_report_url = serializers.SerializerMethodField(read_only=True)

    def get_resume_url(self, obj):
        return obj.resume.url if obj.resume else None

    def get_photo_url(self, obj):
        return obj.photo.url if obj.photo else None

    def get_signature_url(self, obj):
        return obj.signature.url if obj.signature else None

    def get_last_project_report_url(self, obj):
        return obj.last_project_report.url if obj.last_project_report else None

    class Meta:
        model = Candidate
        fields = [
            'id', 'name', 'email', 'status', 'quest_data', 'department', 'department_name',
            'assigned_mentor_name', 'assigned_mentor_id', 'interview_feedback', 'hod_feedback',
            'joining_date', 'joining_time', 'joining_location', 'created_at', 'updated_at',
            'resume', 'photo', 'signature', 'last_project_report',
            'resume_url', 'photo_url', 'signature_url', 'last_project_report_url',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
