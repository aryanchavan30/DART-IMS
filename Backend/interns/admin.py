from django.contrib import admin
from .models import Intern

@admin.register(Intern)
class InternAdmin(admin.ModelAdmin):
    list_display = ('get_user_name', 'get_user_email', 'status', 'mentor', 'joining_date')
    search_fields = ('user__name', 'user__email', 'id')
    list_filter = ('status', 'mentor')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user', 'candidate', 'mentor') # Better UI for selecting users

    @admin.display(description='Name', ordering='user__name')
    def get_user_name(self, obj):
        return obj.user.name

    @admin.display(description='Email', ordering='user__email')
    def get_user_email(self, obj):
        return obj.user.email