from django.urls import path
from .views import BeneficiaryListCreateView, BeneficiaryDetailView, BeneficiaryIndicatorView

urlpatterns = [
    path('beneficiaries/', BeneficiaryListCreateView.as_view(), name='beneficiary-list'),
    path('beneficiaries/<int:pk>/', BeneficiaryDetailView.as_view(), name='beneficiary-detail'),
    path('beneficiaries/<int:pk>/indicators/', BeneficiaryIndicatorView.as_view(), name='beneficiary-indicators'),
]
