from django.urls import path
from .views import (
    ProgramCycleListCreateView,
    ProgramCycleDetailView,
    ParticipationRecordListCreateView,
    CycleApplicationListCreateView,
)

urlpatterns = [
    path('cycles/', ProgramCycleListCreateView.as_view(), name='cycle-list'),
    path('cycles/<uuid:pk>/', ProgramCycleDetailView.as_view(), name='cycle-detail'),
    path('cycles/<uuid:cycle_pk>/applications/', CycleApplicationListCreateView.as_view(), name='cycle-applications'),
    path('participation/', ParticipationRecordListCreateView.as_view(), name='participation-list'),
]
