from rest_framework import serializers
from .models import ProgramCycle, ParticipationRecord, CycleApplication


class ProgramCycleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = ProgramCycle
        fields = [
            'id', 'cycle_name', 'start_date', 'end_date',
            'slots', 'max_per_household',
            'created_by', 'created_by_name', 'created_at',
        ]
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

    def validate(self, attrs):
        beneficiary = attrs.get('beneficiary', getattr(self.instance, 'beneficiary', None))
        cycle = attrs.get('cycle', getattr(self.instance, 'cycle', None))
        if beneficiary and cycle:
            is_selected = CycleApplication.objects.filter(
                beneficiary=beneficiary,
                cycle=cycle,
                status=CycleApplication.STATUS_SELECTED,
            ).exists()
            if not is_selected:
                raise serializers.ValidationError(
                    'Participation can only be recorded for selected cycle applicants.'
                )
        return attrs

    def create(self, validated_data):
        validated_data['recorded_by'] = self.context['request'].user
        return super().create(validated_data)


class CycleApplicationSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(source='beneficiary.full_name', read_only=True)
    applied_by_name = serializers.CharField(source='applied_by.full_name', read_only=True)

    class Meta:
        model = CycleApplication
        fields = [
            'id', 'beneficiary', 'beneficiary_name', 'cycle',
            'application_date', 'status',
            'computed_score', 'rank_position',
            'applied_by', 'applied_by_name', 'created_at',
        ]
        read_only_fields = [
            'id', 'application_date', 'status',
            'computed_score', 'rank_position',
            'applied_by', 'applied_by_name', 'created_at',
        ]

    def validate(self, attrs):
        beneficiary = attrs.get('beneficiary', getattr(self.instance, 'beneficiary', None))
        if beneficiary and not beneficiary.is_tupad_eligible:
            raise serializers.ValidationError({
                'beneficiary': 'Only TUPAD-eligible adult beneficiaries can be marked as applicants.'
            })
        return attrs

    def create(self, validated_data):
        validated_data['applied_by'] = self.context['request'].user
        return super().create(validated_data)
