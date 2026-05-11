from django.urls import path
from .views import (
    HouseholdListCreateView, HouseholdDetailView, HouseholdSoftDeleteView,
    FamilyListCreateView, FamilyDetailView,
    BeneficiaryListCreateView, BeneficiaryDetailView, BeneficiarySoftDeleteView,
    BeneficiaryIndicatorView, ResidentProfileView,
)

urlpatterns = [
    # Households
    path('households/', HouseholdListCreateView.as_view(), name='household-list'),
    path('households/<uuid:pk>/', HouseholdDetailView.as_view(), name='household-detail'),
    path('households/<uuid:pk>/soft-delete/', HouseholdSoftDeleteView.as_view(), name='household-soft-delete'),

    # Families
    path('families/', FamilyListCreateView.as_view(), name='family-list'),
    path('families/<uuid:pk>/', FamilyDetailView.as_view(), name='family-detail'),

    # Resident profiles (preferred public API wording)
    path('resident-profiles/', BeneficiaryListCreateView.as_view(), name='resident-profile-list'),
    path('resident-profiles/me/', ResidentProfileView.as_view(), name='resident-profile-me'),
    path('resident-profiles/<uuid:pk>/', BeneficiaryDetailView.as_view(), name='resident-profile-detail'),
    path('resident-profiles/<uuid:pk>/indicators/', BeneficiaryIndicatorView.as_view(), name='resident-profile-indicators'),
    path('resident-profiles/<uuid:pk>/soft-delete/', BeneficiarySoftDeleteView.as_view(), name='resident-profile-soft-delete'),

    # Beneficiaries (legacy API aliases kept for compatibility)
    path('beneficiaries/', BeneficiaryListCreateView.as_view(), name='beneficiary-list'),
    path('beneficiaries/me/', ResidentProfileView.as_view(), name='beneficiary-me'),
    path('beneficiaries/<uuid:pk>/', BeneficiaryDetailView.as_view(), name='beneficiary-detail'),
    path('beneficiaries/<uuid:pk>/indicators/', BeneficiaryIndicatorView.as_view(), name='beneficiary-indicators'),
    path('beneficiaries/<uuid:pk>/soft-delete/', BeneficiarySoftDeleteView.as_view(), name='beneficiary-soft-delete'),
]
