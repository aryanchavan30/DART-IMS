from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager as DefaultUserManager
from django.utils.translation import gettext_lazy as _

# 1. Define the Custom User Manager
class CustomUserManager(DefaultUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        # Add default values for REQUIRED_FIELDS if not provided in the command line
        extra_fields.setdefault('name', 'Admin') 

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)

# 2. Update the User model to use the new manager
class User(AbstractUser):
    class Role(models.TextChoices):
        INTERN = 'Intern', 'Intern'
        HR = 'HR', 'HR'
        MENTOR = 'Mentor', 'Mentor'
        HOD = 'HOD', 'HOD'

    class Shift(models.TextChoices):
        MORNING = 'Morning', 'Morning'
        GENERAL = 'General', 'General'
        NIGHT = 'Night', 'Night'

    username = None
    email = models.EmailField(unique=True)
    login_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    solar_email = models.EmailField(null=True, blank=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.INTERN)
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    shift = models.CharField(max_length=10, choices=Shift.choices, null=True, blank=True)
    week_offs = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    # Assign the custom manager to the objects attribute
    objects = CustomUserManager() 

    def save(self, *args, **kwargs):
        # Set default password for new users (optional but included from your code)
        if not self.pk and not self.password:
            from django.contrib.auth.hashers import make_password
            self.password = make_password('password123')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.email})"

