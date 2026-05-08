from rest_framework import serializers
from .models import Criterion


FIELD_KEY_CHOICES = {
    '',
    'monthly_income',
    'employment_status',
    'household_size',
    'num_dependents',
    'housing_condition',
    'is_pwd',
    'is_senior',
    'is_solo_parent',
    'is_4ps',
}


class CriterionSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True)

    class Meta:
        model = Criterion
        fields = ['id', 'name', 'weight', 'type', 'field_key', 'is_active', 'updated_by', 'updated_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'updated_by', 'created_at', 'updated_at']

    def validate(self, data):
        # Validate total active weights = 1.00 on create/update
        instance = self.instance
        is_active = data.get('is_active', getattr(instance, 'is_active', True))
        weight = data.get('weight', getattr(instance, 'weight', 0))
        field_key = data.get('field_key', getattr(instance, 'field_key', ''))

        if field_key not in FIELD_KEY_CHOICES:
            raise serializers.ValidationError({
                'field_key': 'Invalid linked profile field.'
            })

        active_qs = Criterion.objects.filter(is_active=True)
        if instance:
            active_qs = active_qs.exclude(pk=instance.pk)

        current_total = sum(c.weight for c in active_qs)
        if is_active:
            new_total = current_total + weight
            if round(float(new_total), 4) > 1.0001:
                raise serializers.ValidationError(
                    f'Total active weights would exceed 1.00 (current: {current_total}, adding: {weight}).'
                )
        return data

    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)

    def create(self, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().create(validated_data)
