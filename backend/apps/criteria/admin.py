from django.contrib import admin
from .models import Criterion


@admin.register(Criterion)
class CriterionAdmin(admin.ModelAdmin):
    list_display = ['name', 'weight', 'type', 'is_active', 'updated_at']
    list_filter = ['type', 'is_active']
