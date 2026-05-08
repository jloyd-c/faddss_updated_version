from django.db import models
import uuid


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=100)
    target_table = models.CharField(max_length=100)
    target_id = models.CharField(max_length=50, null=True, blank=True)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise PermissionError('Audit logs cannot be updated.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Audit logs cannot be deleted.')

    def __str__(self):
        return f'[{self.timestamp}] {self.user} — {self.action} on {self.target_table}'


class ProfileChangeLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class TargetType(models.TextChoices):
        HOUSEHOLD = 'HOUSEHOLD', 'Household'
        FAMILY = 'FAMILY', 'Family'
        BENEFICIARY = 'BENEFICIARY', 'Beneficiary'
        INDICATOR = 'INDICATOR', 'Indicator'

    class Action(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        UPDATED = 'UPDATED', 'Updated'
        SOFT_DELETED = 'SOFT_DELETED', 'Soft Deleted'
        RESTORED = 'RESTORED', 'Restored'

    household = models.ForeignKey(
        'beneficiaries.Household',
        on_delete=models.PROTECT,
        related_name='change_logs',
    )
    target_type = models.CharField(max_length=15, choices=TargetType.choices)
    target_id = models.CharField(max_length=50)
    action = models.CharField(max_length=15, choices=Action.choices)
    changed_fields = models.JSONField(default=dict)
    changed_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='profile_changes',
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'profile_change_logs'
        ordering = ['-changed_at']

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise PermissionError('Profile change logs cannot be updated.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Profile change logs cannot be deleted.')

    @classmethod
    def log_change(cls, household, target_type, target_id, action, changed_fields, changed_by, notes=''):
        return cls.objects.create(
            household=household,
            target_type=target_type,
            target_id=str(target_id),
            action=action,
            changed_fields=changed_fields,
            changed_by=changed_by,
            notes=notes,
        )

    def __str__(self):
        return f'[{self.changed_at}] {self.action} {self.target_type} {self.target_id}'
