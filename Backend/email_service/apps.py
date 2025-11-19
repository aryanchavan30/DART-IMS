from django.apps import AppConfig

class EmailConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'email_service'
    verbose_name = 'Email Service'
