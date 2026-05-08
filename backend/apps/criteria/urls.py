from django.urls import path
from .views import CriterionListCreateView, CriterionDetailView

urlpatterns = [
    path('criteria/', CriterionListCreateView.as_view(), name='criterion-list'),
    path('criteria/<uuid:pk>/', CriterionDetailView.as_view(), name='criterion-detail'),
]
