from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StipendViewSet

router = DefaultRouter()
router.register(r'', StipendViewSet, basename='stipend')

urlpatterns = [
    path('', include(router.urls)),
]
