from django.contrib import admin
from .models import Beneficiary, BeneficiaryIndicator


@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'age', 'employment_status', 'monthly_income', 'is_pwd', 'is_senior']
    search_fields = ['full_name']
    list_filter = ['employment_status', 'housing_condition', 'is_pwd', 'is_senior']


@admin.register(BeneficiaryIndicator)
class BeneficiaryIndicatorAdmin(admin.ModelAdmin):
    list_display = ['beneficiary', 'criterion', 'value', 'updated_at']
