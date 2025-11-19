from django.urls import path
from .views import (
    JobApplicationCreateView,
    JobApplicationListView,
    JotFormSubmissionsView,
    get_jotform_forms,
    get_jotform_candidates,
    trigger_sync,
    get_sync_info,
    get_local_candidates
)

urlpatterns = [
    path('apply/', JobApplicationCreateView.as_view(), name='create-application'),
    path('applications/', JobApplicationListView.as_view(), name='list-applications'),
    path('jotform/submissions/', JotFormSubmissionsView.as_view(), name='jotform-submissions'),
    path('jotform/forms/', get_jotform_forms, name='jotform-forms'),
    path('jotform/candidates/', get_jotform_candidates, name='jotform-candidates'),
    # Sync endpoints
    path('sync/trigger/', trigger_sync, name='trigger-sync'),
    path('sync/info/', get_sync_info, name='sync-info'),
    path('candidates/local/', get_local_candidates, name='local-candidates'),
]