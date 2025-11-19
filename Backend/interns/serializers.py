from rest_framework import serializers
from .models import Intern

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
