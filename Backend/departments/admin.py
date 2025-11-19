from django.contrib import admin
from .models import Department

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'hod', 'get_mentor_count')
    search_fields = ('name', 'hod__name')
    list_filter = ('name',)
    filter_horizontal = ('mentors',) # Makes adding mentors easier

    @admin.display(description='Mentors')
    def get_mentor_count(self, obj):
        return obj.mentors.count()