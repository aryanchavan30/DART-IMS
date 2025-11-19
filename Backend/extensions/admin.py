from django.contrib import admin
from .models import ExtensionRequest, ExtensionPermission

@admin.register(ExtensionRequest)
class ExtensionRequestAdmin(admin.ModelAdmin):
    list_display = ('get_intern_name', 'months_requested', 'status', 'mentor_approval', 'hod_approval')
    search_fields = ('intern__user__name',)
    list_filter = ('status', 'mentor_approval', 'hod_approval', 'hr_approval')
    raw_id_fields = ('intern',)

    @admin.display(description='Intern Name', ordering='intern__user__name')
    def get_intern_name(self, obj):
        return obj.intern.user.name

@admin.register(ExtensionPermission)
class ExtensionPermissionAdmin(admin.ModelAdmin):
    list_display = ('get_intern_name', 'hr_approved', 'hod_approved', 'is_approved')
    search_fields = ('intern__user__name',)
    list_filter = ('hr_approved', 'hod_approved')
    raw_id_fields = ('intern', 'hr_approved_by', 'hod_approved_by')

    @admin.display(description='Intern Name', ordering='intern__user__name')
    def get_intern_name(self, obj):
        return obj.intern.user.name