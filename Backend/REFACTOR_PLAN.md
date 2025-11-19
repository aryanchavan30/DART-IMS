# Core Deletion Refactoring Plan

## Apps to Create/Update:
1. users/ - UserViewSet, LoginView, CurrentUserView, ChangePasswordView, UserSerializer
2. departments/ - DepartmentViewSet, DepartmentSerializer  
3. candidates/ - CandidateViewSet, CandidateSerializer
4. interns/ - InternViewSet, InternSerializer
5. stipends/ - StipendViewSet, StipendSerializer
6. leaves/ - LeaveRequestViewSet, LeaveRequestSerializer
7. extensions/ - ExtensionRequestViewSet, ExtensionPermissionViewSet, ExtensionRequestSerializer, ExtensionPermissionSerializer
8. exits/ - ExitRequestViewSet, ExitRequestSerializer
9. holidays/ - HolidayViewSet, HolidaySerializer
10. notifications/ - SendEmailView, NotificationEmailView, DashboardStatsView

## Steps:
1. Create views.py in each app
2. Create serializers.py in each app  
3. Create urls.py in each app
4. Update ims_backend/urls.py to include all app urls
5. Delete core folder
6. Test everything

