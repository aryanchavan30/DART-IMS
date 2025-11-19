from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import ExtensionPermissionViewSet, ExtensionRequestViewSet

# Create separate routers for each ViewSet
router_permissions = DefaultRouter()
router_permissions.lookup_value_regex = '[^/]+'  # This line allows dots in the ID
router_permissions.register(r'extension-permissions', ExtensionPermissionViewSet, basename='extensionpermission')

router_requests = DefaultRouter()
router_requests.lookup_value_regex = '[^/]+'  # This line also allows dots in the ID
router_requests.register(r'extension-requests', ExtensionRequestViewSet, basename='extensionrequest')

# This is the final, correct urlpatterns list.
# All the old re_path entries have been removed.
urlpatterns = [
    path('', include(router_permissions.urls)),
    path('', include(router_requests.urls)),
]