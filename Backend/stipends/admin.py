from django.contrib import admin
from .models import Stipend

@admin.register(Stipend)
class StipendAdmin(admin.ModelAdmin):
    list_display = ('get_intern_name', 'month', 'amount', 'hr_approval', 'hod_approval')
    search_fields = ('intern__user__name', 'month', 'id')
    list_filter = ('month', 'hr_approval', 'hod_approval')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('intern',)

    @admin.display(description='Intern Name', ordering='intern__user__name')
    def get_intern_name(self, obj):
        return obj.intern.user.name