from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.users.permissions import IsAdminOrOfficial


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').order_by('-timestamp')
        action = self.request.query_params.get('action')
        table = self.request.query_params.get('table')
        user_id = self.request.query_params.get('user')
        if action:
            qs = qs.filter(action__icontains=action)
        if table:
            qs = qs.filter(target_table=table)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs
