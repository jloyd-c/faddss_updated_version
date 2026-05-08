from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog, ProfileChangeLog
from .serializers import AuditLogSerializer, ProfileChangeLogSerializer
from apps.users.permissions import IsAdminOrOfficial


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').order_by('-timestamp')
        action = self.request.query_params.get('action')
        table = self.request.query_params.get('table')
        user_id = self.request.query_params.get('user')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if action:
            qs = qs.filter(action__icontains=action)
        if table:
            qs = qs.filter(target_table=table)
        if user_id:
            qs = qs.filter(user_id=user_id)
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        return qs


class ProfileChangeLogListView(generics.ListAPIView):
    serializer_class = ProfileChangeLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def get_queryset(self):
        qs = ProfileChangeLog.objects.select_related(
            'household', 'changed_by'
        ).order_by('-changed_at')
        household_id = self.request.query_params.get('household')
        target_type = self.request.query_params.get('target_type')
        action = self.request.query_params.get('action')
        user_id = self.request.query_params.get('user')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if household_id:
            qs = qs.filter(household_id=household_id)
        if target_type:
            qs = qs.filter(target_type=target_type)
        if action:
            qs = qs.filter(action=action)
        if user_id:
            qs = qs.filter(changed_by_id=user_id)
        if date_from:
            qs = qs.filter(changed_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(changed_at__date__lte=date_to)
        return qs
