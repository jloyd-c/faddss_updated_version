from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='criteria.Criterion')
def log_criterion_change(sender, instance, created, **kwargs):
    from apps.audit.models import AuditLog
    action = 'create_criterion' if created else 'update_criterion'
    AuditLog.objects.create(
        user=instance.updated_by,
        action=action,
        target_table='criteria',
        target_id=instance.id,
    )


@receiver(post_save, sender='cycles.ParticipationRecord')
def log_participation_record(sender, instance, created, **kwargs):
    from apps.audit.models import AuditLog
    if created:
        AuditLog.objects.create(
            user=instance.recorded_by,
            action='record_participation',
            target_table='participation_records',
            target_id=instance.id,
        )


@receiver(post_save, sender='users.User')
def log_resident_account_creation(sender, instance, created, **kwargs):
    from apps.audit.models import AuditLog
    if created and instance.role == 'resident':
        AuditLog.objects.create(
            user=None,
            action='create_resident_account',
            target_table='users',
            target_id=instance.id,
        )
