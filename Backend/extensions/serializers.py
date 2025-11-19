from rest_framework import serializers
from .models import ExtensionPermission, ExtensionRequest


class ExtensionPermissionSerializer(serializers.ModelSerializer):
    """
    Serializer for ExtensionPermission model
    """
    intern_name = serializers.CharField(source='intern.user.name', read_only=True)
    intern_email = serializers.CharField(source='intern.user.email', read_only=True)
    # Access department through candidate
    intern_department = serializers.CharField(source='intern.candidate.department.name', read_only=True)
    hr_approved_by_name = serializers.CharField(source='hr_approved_by.name', read_only=True)
    hod_approved_by_name = serializers.CharField(source='hod_approved_by.name', read_only=True)
    is_approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = ExtensionPermission
        fields = [
            'id',
            'intern',
            'intern_name',
            'intern_email',
            'intern_department',
            'hr_approved',
            'hr_approved_by',
            'hr_approved_by_name',
            'hr_approved_at',
            'hr_comments',
            'hod_approved',
            'hod_approved_by',
            'hod_approved_by_name',
            'hod_approved_at',
            'hod_comments',
            'is_approved',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'intern_name',
            'intern_email',
            'intern_department',
            'hr_approved_by_name',
            'hod_approved_by_name',
            'is_approved',
            'created_at',
            'updated_at',
        ]


class ExtensionRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for ExtensionRequest model
    """
    intern_name = serializers.CharField(source='intern.user.name', read_only=True)
    intern_email = serializers.CharField(source='intern.user.email', read_only=True)
    intern_department = serializers.CharField(source='intern.candidate.department.name', read_only=True)

    class Meta:
        model = ExtensionRequest
        fields = [
            'id',
            'intern',
            'intern_name',
            'intern_email',
            'intern_department',
            'months_requested',
            'reason',
            'status',
            'hr_approval',
            'hr_comments',
            'mentor_approval',
            'mentor_comments',
            'hod_approval',
            'hod_comments',
            'mhr_approval',
            'mhr_comments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'intern_name',
            'intern_email',
            'intern_department',
            'status',
            'created_at',
            'updated_at',
        ]
