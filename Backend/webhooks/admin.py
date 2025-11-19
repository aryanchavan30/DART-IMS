from django.contrib import admin
from .models import JotFormCandidate, SyncLog, JobApplication

@admin.register(JotFormCandidate)
class JotFormCandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'status', 'submission_date', 'college_name')
    search_fields = ('name', 'email', 'jotform_submission_id')
    list_filter = ('status', 'college_name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ('sync_type', 'start_time', 'end_time', 'status', 'records_fetched', 'records_saved')
    list_filter = ('sync_type', 'status')
    readonly_fields = ('start_time', 'end_time', 'error_message')

# This model seems older, but we register it just in case.
@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'submission_date', 'status')
    search_fields = ('full_name', 'email')
    list_filter = ('status',)