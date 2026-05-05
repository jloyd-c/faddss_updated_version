from django.db import models


class AuditLog(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=100)
    target_table = models.CharField(max_length=100)
    target_id = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        # INSERT-ONLY enforcement at the model layer
        if self.pk:
            raise PermissionError('Audit logs cannot be updated.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Audit logs cannot be deleted.')

    def __str__(self):
        return f'[{self.timestamp}] {self.user} — {self.action} on {self.target_table}'
