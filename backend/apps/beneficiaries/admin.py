from django.contrib import admin
from .models import Household, Family, Beneficiary, BeneficiaryIndicator


@admin.register(Household)
class HouseholdAdmin(admin.ModelAdmin):
    list_display = ['household_code', 'address', 'status', 'purok', 'is_deleted']
    list_filter = ['status', 'is_deleted']
    search_fields = ['household_code', 'address']


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ['household', 'family_number', 'monthly_income_bracket', 'is_deleted']
    list_filter = ['monthly_income_bracket', 'is_deleted']


@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'age', 'role', 'employment_status', 'monthly_income', 'is_tupad_eligible', 'is_deleted']
    search_fields = ['first_name', 'middle_name', 'last_name', 'full_name']
    list_filter = ['employment_status', 'housing_condition', 'is_tupad_eligible', 'is_deleted']


@admin.register(BeneficiaryIndicator)
class BeneficiaryIndicatorAdmin(admin.ModelAdmin):
    list_display = ['beneficiary', 'criterion', 'value', 'updated_at']
