from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InternViewSet

router = DefaultRouter()
router.register(r'', InternViewSet, basename='intern')

urlpatterns = [
    path('', include(router.urls)),
]
