from django.urls import path
from .views import AuditLogListView, ProfileChangeLogListView

urlpatterns = [
    path('audit/', AuditLogListView.as_view(), name='audit-list'),
    path('audit/profile-changes/', ProfileChangeLogListView.as_view(), name='profile-change-log'),
]
