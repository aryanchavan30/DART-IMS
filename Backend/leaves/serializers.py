from rest_framework import serializers
from .models import LeaveRequest

class LeaveRequestSerializer(serializers.ModelSerializer):
    intern_name = serializers.CharField(source='intern.user.name', read_only=True)
    intern_email = serializers.CharField(source='intern.user.email', read_only=True)
    intern_department = serializers.CharField(source='intern.user.department.name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'intern', 'intern_name', 'intern_email', 'intern_department',
            'start_date', 'end_date', 'leave_type', 'leave_half', 'reason',
            'status', 'mail_sent', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
