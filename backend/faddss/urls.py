from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import LoginView, LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # App routers
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.beneficiaries.urls')),
    path('api/', include('apps.criteria.urls')),
    path('api/', include('apps.cycles.urls')),
    path('api/', include('apps.scoring.urls')),
    path('api/', include('apps.audit.urls')),
]
