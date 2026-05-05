from rest_framework import serializers
from .models import Beneficiary, BeneficiaryIndicator


class BeneficiaryIndicatorSerializer(serializers.ModelSerializer):
    criterion_name = serializers.CharField(source='criterion.name', read_only=True)

    class Meta:
        model = BeneficiaryIndicator
        fields = ['id', 'criterion', 'criterion_name', 'value', 'encoded_by', 'updated_at']
        read_only_fields = ['id', 'encoded_by', 'updated_at']


class BeneficiarySerializer(serializers.ModelSerializer):
    indicators = BeneficiaryIndicatorSerializer(many=True, read_only=True)
    encoded_by_name = serializers.CharField(source='encoded_by.full_name', read_only=True)

    class Meta:
        model = Beneficiary
        fields = [
            'id', 'full_name', 'address', 'age', 'household_size',
            'monthly_income', 'employment_status', 'housing_condition',
            'is_pwd', 'is_senior', 'encoded_by', 'encoded_by_name',
            'updated_by', 'indicators', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'encoded_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['encoded_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class BeneficiaryIndicatorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeneficiaryIndicator
        fields = ['criterion', 'value']

    def create(self, validated_data):
        validated_data['encoded_by'] = self.context['request'].user
        validated_data['beneficiary'] = self.context['beneficiary']
        obj, _ = BeneficiaryIndicator.objects.update_or_create(
            beneficiary=validated_data['beneficiary'],
            criterion=validated_data['criterion'],
            defaults={'value': validated_data['value'], 'encoded_by': validated_data['encoded_by']},
        )
        return obj
