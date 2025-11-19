from django.contrib import admin, messages
from django.db import transaction
from .models import Candidate
from users.models import User
from interns.models import Intern

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    # --- ADD THIS ACTION ---
    actions = ['onboard_candidates']

    @admin.action(description='Onboard selected candidates and create user profiles')
    def onboard_candidates(self, request, queryset):
        """
        Admin action to onboard selected candidates.
        Creates a User and an Intern profile for each.
        """
        # Filter for candidates who are actually ready for onboarding
        candidates_to_onboard = queryset.filter(status=Candidate.CandidateStatus.SELECTED)
        
        onboarded_count = 0
        
        with transaction.atomic():
            for candidate in candidates_to_onboard:
                # 1. Create the User account
                user, created = User.objects.get_or_create(
                    email=candidate.email,
                    defaults={
                        'name': candidate.name,
                        'role': User.Role.INTERN,
                        'department': candidate.department,
                    }
                )
                if created:
                    # Set a default password for the new user
                    user.set_password('password123')
                    user.save()

                # 2. Create the Intern profile
                # Check if an intern profile already exists to avoid errors
                if not hasattr(candidate, 'intern_profile'):
                    Intern.objects.create(
                        id=f"i_{candidate.id}",
                        user=user,
                        candidate=candidate,
                        joining_date=candidate.joining_date or date.today(),
                        mentor=candidate.assigned_mentor,
                        status=Intern.InternStatus.ACTIVE
                    )

                    # 3. Update the candidate's status to Onboarded
                    candidate.status = Candidate.CandidateStatus.ONBOARDED
                    candidate.save()
                    
                    onboarded_count += 1

        if onboarded_count > 0:
            self.message_user(request, f"Successfully onboarded {onboarded_count} candidate(s).", messages.SUCCESS)
        
        if onboarded_count < len(queryset):
            skipped_count = len(queryset) - onboarded_count
            self.message_user(request, f"Skipped {skipped_count} candidate(s). Please ensure they are in 'Selected' status and not already onboarded.", messages.WARNING)


    # --- The rest of your admin configuration ---
    list_display = (
        'name', 
        'email', 
        'status', 
        'department', 
        'assigned_mentor', 
        'updated_at'
    )
    list_filter = ('status', 'department')
    search_fields = ('name', 'email', 'id')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Candidate Information', {
            'fields': ('id', 'name', 'email', 'department')
        }),
        ('Hiring Status', {
            'fields': ('status', 'assigned_mentor', 'interview_feedback', 'hod_feedback')
        }),
        ('Joining Details', {
            'fields': ('joining_date', 'joining_time', 'joining_location')
        }),
        ('Documents & Data', {
            'fields': ('resume', 'photo', 'signature', 'last_project_report', 'quest_data')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )