from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InternViewSet, AttendanceViewSet, AttendanceTicketViewSet

router = DefaultRouter()
router.register(r'', InternViewSet, basename='intern')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'attendance-tickets', AttendanceTicketViewSet, basename='attendance-ticket')

urlpatterns = [
    path('', include(router.urls)),
]
