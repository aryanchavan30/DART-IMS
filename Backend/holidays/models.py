from django.db import models

class Holiday(models.Model):
    date = models.DateField()
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.date}"
