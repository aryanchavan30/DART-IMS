from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User
from django import forms  # <-- IMPORT THE FORMS MODULE

# --- This form is used when you ADD a new user ---
class CustomUserCreationForm(UserCreationForm):
    # --- ADD THIS SECTION ---
    # Redefine the email field to add the autocomplete attribute
    email = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={'autocomplete': 'username'})
    )
    # -----------------------

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('email', 'name', 'role', 'department')

# --- This form is used when you EDIT an existing user ---
class CustomUserChangeForm(UserChangeForm):
    # --- ADD THIS SECTION ---
    # Also add it to the change form for consistency
    email = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={'autocomplete': 'username'})
    )
    # -----------------------

    class Meta(UserChangeForm.Meta):
        model = User
        fields = ('email', 'name', 'role', 'department')

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Use the custom forms for add/change
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    # Display in the user list
    list_display = ('email', 'name', 'role', 'department', 'is_staff')
    list_filter = ('role', 'department', 'is_staff', 'is_superuser', 'is_active')
    
    # Search functionality
    search_fields = ('name', 'email')
    ordering = ('email',)

    # Fields to display on the EDIT page
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'role', 'department')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    # Fields to display on the ADD page
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'department', 'password', 'password2'),
        }),
    )