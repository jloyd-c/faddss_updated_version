from rest_framework import serializers
from .models import AuditLog, ProfileChangeLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'target_table', 'target_id', 'details', 'timestamp']
        read_only_fields = fields


class ProfileChangeLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    household_code = serializers.CharField(source='household.household_code', read_only=True)

    class Meta:
        model = ProfileChangeLog
        fields = [
            'id', 'household', 'household_code',
            'target_type', 'target_id', 'action',
            'changed_fields', 'changed_by', 'changed_by_name',
            'changed_at', 'notes',
        ]
        read_only_fields = fields
