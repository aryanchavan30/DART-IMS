from rest_framework import serializers
from .models import Stipend

class StipendSerializer(serializers.ModelSerializer):
    intern_name = serializers.CharField(source='intern.user.name', read_only=True)
    intern_email = serializers.CharField(source='intern.user.email', read_only=True)
    intern_department = serializers.CharField(source='intern.user.department.name', read_only=True)

    class Meta:
        model = Stipend
        fields = [
            'id', 'intern', 'intern_name', 'intern_email', 'intern_department',
            'month', 'amount', 'working_days', 'leaves_taken', 'comments',
            'intern_approval', 'hr_approval', 'hod_approval',
            'invoice_url', 'intern_signature_url', 'hr_signature_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
