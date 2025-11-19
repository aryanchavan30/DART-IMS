from django.db import models
from users.models import User

class Department(models.Model):
    class DepartmentName(models.TextChoices):
        WEB = 'Web Development', 'Web Development'
        SAP = 'SAP BTP Development', 'SAP BTP Development'
        RPA = 'RPA', 'RPA'
        GEN_AI = 'Gen AI & LLM', 'Gen AI & LLM'
        IIOT_DEV = 'IIoT Development', 'IIoT Development'
        IIOT_FIELD = 'IIoT Field', 'IIoT Field'
        SCM = 'SCM', 'SCM'
        PM = 'Project Management', 'Project Management'

    id = models.CharField(primary_key=True, max_length=255)
    name = models.CharField(max_length=255, choices=DepartmentName.choices)
    hod = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                            related_name='hod_of_departments')
    mentors = models.ManyToManyField(User, related_name='mentor_in_departments', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
