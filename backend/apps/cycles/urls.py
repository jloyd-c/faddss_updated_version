from django.urls import path
from .views import (
    ProgramCycleListCreateView,
    ProgramCycleDetailView,
    ParticipationRecordListCreateView,
)

urlpatterns = [
    path('cycles/', ProgramCycleListCreateView.as_view(), name='cycle-list'),
    path('cycles/<int:pk>/', ProgramCycleDetailView.as_view(), name='cycle-detail'),
    path('participation/', ParticipationRecordListCreateView.as_view(), name='participation-list'),
]
