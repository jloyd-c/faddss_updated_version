from rest_framework import serializers
from .models import ProgramCycle, ParticipationRecord


class ProgramCycleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = ProgramCycle
        fields = ['id', 'cycle_name', 'start_date', 'end_date', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ParticipationRecordSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(source='beneficiary.full_name', read_only=True)
    cycle_name = serializers.CharField(source='cycle.cycle_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = ParticipationRecord
        fields = [
            'id', 'beneficiary', 'beneficiary_name', 'cycle', 'cycle_name',
            'project_name', 'days_worked', 'participation_start', 'participation_end',
            'recorded_by', 'recorded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at']

    def create(self, validated_data):
        validated_data['recorded_by'] = self.context['request'].user
        return super().create(validated_data)
