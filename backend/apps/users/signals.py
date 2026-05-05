from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    from apps.audit.models import AuditLog
    AuditLog.objects.create(
        user=user,
        action='login',
        target_table='users',
        target_id=user.id,
    )
