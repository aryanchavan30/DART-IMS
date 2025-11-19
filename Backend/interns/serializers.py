from rest_framework import serializers
from .models import Intern, Attendance, AttendanceTicket

class InternSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_solar_email = serializers.CharField(source='user.solar_email', read_only=True)
    user_login_id = serializers.CharField(source='user.login_id', read_only=True)
    user_department = serializers.CharField(source='user.department.name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    mentor_name = serializers.CharField(source='mentor.name', read_only=True)
    offer_letter_url = serializers.SerializerMethodField(read_only=True)
    aadhar_card_url = serializers.SerializerMethodField(read_only=True)
    pan_card_url = serializers.SerializerMethodField(read_only=True)
    bank_passbook_url = serializers.SerializerMethodField(read_only=True)

    def get_offer_letter_url(self, obj):
        return obj.offer_letter.url if obj.offer_letter else None

    def get_aadhar_card_url(self, obj):
        return obj.aadhar_card.url if obj.aadhar_card else None

    def get_pan_card_url(self, obj):
        return obj.pan_card.url if obj.pan_card else None

    def get_bank_passbook_url(self, obj):
        return obj.bank_passbook.url if obj.bank_passbook else None

    class Meta:
        model = Intern
        fields = [
            'id', 'joining_date', 'mentor', 'mentor_name',
            'bank_details', 'extension_allowed', 'status',
            'aadhar_card', 'pan_card', 'bank_passbook',
            'created_at', 'updated_at',
            'user', 'user_name', 'user_email', 'user_solar_email', 'user_login_id', 'user_department',
            'candidate', 'candidate_email',
            'offer_letter', 'offer_letter_url',
            'aadhar_card_url', 'pan_card_url', 'bank_passbook_url',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'candidate']


class AttendanceSerializer(serializers.ModelSerializer):
    intern_name = serializers.CharField(source='intern.user.name', read_only=True)
    intern_email = serializers.CharField(source='intern.user.email', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.name', read_only=True)
    has_pending_ticket = serializers.SerializerMethodField()

    def get_has_pending_ticket(self, obj):
        return obj.tickets.filter(status='Pending').exists()

    class Meta:
        model = Attendance
        fields = [
            'id', 'intern', 'intern_name', 'intern_email', 'date', 'status',
            'marked_by', 'marked_by_name', 'marked_at', 'updated_at', 'notes',
            'has_pending_ticket'
        ]
        read_only_fields = ['id', 'marked_at', 'updated_at']


class AttendanceTicketSerializer(serializers.ModelSerializer):
    intern_name = serializers.CharField(source='intern.user.name', read_only=True)
    intern_email = serializers.CharField(source='intern.user.email', read_only=True)
    attendance_date = serializers.DateField(source='attendance.date', read_only=True)
    current_status = serializers.CharField(source='attendance.status', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True)

    class Meta:
        model = AttendanceTicket
        fields = [
            'id', 'attendance', 'attendance_date', 'current_status', 'intern',
            'intern_name', 'intern_email', 'reason', 'status', 'requested_status',
            'reviewed_by', 'reviewed_by_name', 'review_comments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
