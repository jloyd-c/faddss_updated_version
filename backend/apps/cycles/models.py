from django.db import models


class ProgramCycle(models.Model):
    cycle_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='created_cycles',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'program_cycles'

    def __str__(self):
        return self.cycle_name


class ParticipationRecord(models.Model):
    beneficiary = models.ForeignKey(
        'beneficiaries.Beneficiary',
        on_delete=models.PROTECT,
        related_name='participation_records',
    )
    cycle = models.ForeignKey(
        ProgramCycle,
        on_delete=models.PROTECT,
        related_name='participation_records',
    )
    project_name = models.CharField(max_length=255)
    days_worked = models.PositiveIntegerField()
    participation_start = models.DateField()
    participation_end = models.DateField()
    recorded_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='recorded_participations',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'participation_records'

    def save(self, *args, **kwargs):
        # INSERT-ONLY enforcement at the model layer
        if self.pk:
            raise PermissionError('Participation records cannot be updated.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Participation records cannot be deleted.')

    def __str__(self):
        return f'{self.beneficiary.full_name} — {self.cycle.cycle_name}'
