from django.urls import path
from .views import (
    CycleRankingReportView,
    BeneficiaryMasterlistReportView,
    ParticipationHistoryReportView,
    AuditTrailReportView,
    HouseholdReportView,
)

urlpatterns = [
    path('reports/cycle-ranking/', CycleRankingReportView.as_view()),
    path('reports/beneficiary-masterlist/', BeneficiaryMasterlistReportView.as_view()),
    path('reports/participation-history/', ParticipationHistoryReportView.as_view()),
    path('reports/audit-trail/', AuditTrailReportView.as_view()),
    path('reports/household/', HouseholdReportView.as_view()),
]
