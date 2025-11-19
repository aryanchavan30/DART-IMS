from django.contrib import admin
from .models import ExitRequest

@admin.register(ExitRequest)
class ExitRequestAdmin(admin.ModelAdmin):
    list_display = ('get_intern_name', 'status', 'mentor_approval', 'hod_approval', 'hr_approval')
    search_fields = ('intern__user__name',)
    list_filter = ('status', 'mentor_approval', 'hod_approval', 'hr_approval')
    raw_id_fields = ('intern',)

    @admin.display(description='Intern Name', ordering='intern__user__name')
    def get_intern_name(self, obj):
        return obj.intern.user.name