from django.urls import path
from . import views

urlpatterns = [
    path('send/', views.send_email, name='send_email'),
    path('notifications/', views.send_notification_email, name='send_notification_email'),
]
