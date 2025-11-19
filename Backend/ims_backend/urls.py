from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import LoginView, CurrentUserView, ChangePasswordView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication endpoints
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/user/', CurrentUserView.as_view(), name='current_user'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API endpoints
    path('api/users/', include('users.urls')),
    path('api/departments/', include('departments.urls')),
    path('api/candidates/', include('candidates.urls')),
    path('api/interns/', include('interns.urls')),
    path('api/stipends/', include('stipends.urls')),
    path('api/leaves/', include('leaves.urls')),
    path('api/extensions/', include('extensions.urls')),
    path('api/exits/', include('exits.urls')),
    path('api/email/', include('email_service.urls')),
    path('api/holidays/', include('holidays.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/webhooks/', include('webhooks.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
