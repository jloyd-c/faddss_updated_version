from django.db import models
import uuid


class ProgramCycle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    cycle_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    slots = models.PositiveIntegerField(default=0)
    max_per_household = models.PositiveIntegerField(default=1)
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

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
        if not self._state.adding:
            raise PermissionError('Participation records cannot be updated.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Participation records cannot be deleted.')

    def __str__(self):
        return f'{self.beneficiary.full_name} — {self.cycle.cycle_name}'


class CycleApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    STATUS_APPLIED = 'applied'
    STATUS_SELECTED = 'selected'
    STATUS_DEFERRED = 'deferred'
    STATUS_CHOICES = [
        (STATUS_APPLIED, 'Applied'),
        (STATUS_SELECTED, 'Selected'),
        (STATUS_DEFERRED, 'Deferred'),
    ]

    beneficiary = models.ForeignKey(
        'beneficiaries.Beneficiary',
        on_delete=models.PROTECT,
        related_name='applications',
    )
    cycle = models.ForeignKey(
        ProgramCycle,
        on_delete=models.PROTECT,
        related_name='applications',
    )
    application_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_APPLIED)
    computed_score = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True)
    rank_position = models.IntegerField(null=True, blank=True)
    applied_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='marked_applications',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cycle_applications'
        unique_together = ['beneficiary', 'cycle']

    def __str__(self):
        return f'{self.beneficiary.full_name} — {self.cycle.cycle_name} ({self.status})'
