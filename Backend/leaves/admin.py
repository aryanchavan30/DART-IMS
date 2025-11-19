from django.contrib import admin
from .models import LeaveRequest

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('get_intern_name', 'start_date', 'end_date', 'leave_type', 'status')
    search_fields = ('intern__user__name', 'reason')
    list_filter = ('status', 'leave_type')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('intern',)

    @admin.display(description='Intern Name', ordering='intern__user__name')
    def get_intern_name(self, obj):
        return obj.intern.user.name