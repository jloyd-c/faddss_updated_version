from django.contrib import admin
from .models import ProgramCycle, ParticipationRecord


@admin.register(ProgramCycle)
class ProgramCycleAdmin(admin.ModelAdmin):
    list_display = ['cycle_name', 'start_date', 'end_date', 'created_by', 'created_at']


@admin.register(ParticipationRecord)
class ParticipationRecordAdmin(admin.ModelAdmin):
    list_display = ['beneficiary', 'cycle', 'project_name', 'days_worked', 'created_at']
    list_filter = ['cycle']

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
