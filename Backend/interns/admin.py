from django.contrib import admin
from .models import Intern, Attendance, AttendanceTicket

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


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('get_intern_name', 'date', 'status', 'marked_by', 'marked_at', 'has_tickets')
    search_fields = ('intern__user__name', 'intern__user__email', 'id')
    list_filter = ('status', 'date', 'marked_by')
    readonly_fields = ('id', 'marked_at', 'updated_at')
    raw_id_fields = ('intern', 'marked_by')
    date_hierarchy = 'date'
    ordering = ('-date',)

    @admin.display(description='Intern', ordering='intern__user__name')
    def get_intern_name(self, obj):
        return obj.intern.user.name

    @admin.display(description='Has Tickets', boolean=True)
    def has_tickets(self, obj):
        return obj.tickets.exists()


@admin.register(AttendanceTicket)
class AttendanceTicketAdmin(admin.ModelAdmin):
    list_display = ('get_intern_name', 'get_date', 'current_status', 'requested_status', 'status', 'reviewed_by', 'created_at')
    search_fields = ('intern__user__name', 'intern__user__email', 'id', 'reason')
    list_filter = ('status', 'requested_status', 'reviewed_by', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('intern', 'attendance', 'reviewed_by')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    @admin.display(description='Intern', ordering='intern__user__name')
    def get_intern_name(self, obj):
        return obj.intern.user.name

    @admin.display(description='Date', ordering='attendance__date')
    def get_date(self, obj):
        return obj.attendance.date

    @admin.display(description='Current Status')
    def current_status(self, obj):
        return obj.attendance.status