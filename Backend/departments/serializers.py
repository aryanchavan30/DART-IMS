from rest_framework import serializers
from .models import Department

class DepartmentSerializer(serializers.ModelSerializer):
    hod_name = serializers.CharField(source='hod.name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'hod', 'hod_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
