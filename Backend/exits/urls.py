from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExitRequestViewSet

router = DefaultRouter()
router.register(r'', ExitRequestViewSet, basename='exitrequest')

urlpatterns = [
    path('', include(router.urls)),
]
