from rest_framework import serializers
from .models import Household, Family, Beneficiary, BeneficiaryIndicator, SECTOR_CHOICES
from apps.audit.services import log_created, log_updated, snapshot


class HouseholdSerializer(serializers.ModelSerializer):
    encoded_by_name = serializers.CharField(source='encoded_by.full_name', read_only=True)
    family_count = serializers.SerializerMethodField()

    class Meta:
        model = Household
        fields = [
            'id', 'household_code', 'address', 'status', 'purok',
            'latitude', 'longitude', 'notes',
            'encoded_by', 'encoded_by_name', 'updated_by',
            'family_count', 'is_deleted', 'deleted_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'encoded_by', 'updated_by', 'is_deleted', 'deleted_at', 'deleted_by', 'created_at', 'updated_at']

    def get_family_count(self, obj):
        return obj.families.count()

    def create(self, validated_data):
        validated_data['encoded_by'] = self.context['request'].user
        instance = super().create(validated_data)
        log_created(instance, 'HOUSEHOLD', instance, self.context['request'].user)
        return instance

    def update(self, instance, validated_data):
        before = snapshot(instance, 'HOUSEHOLD')
        validated_data['updated_by'] = self.context['request'].user
        instance = super().update(instance, validated_data)
        log_updated(instance, 'HOUSEHOLD', instance, before, self.context['request'].user)
        return instance


class FamilySerializer(serializers.ModelSerializer):
    encoded_by_name = serializers.CharField(source='encoded_by.full_name', read_only=True)
    household_code = serializers.CharField(source='household.household_code', read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Family
        fields = [
            'id', 'household', 'household_code', 'family_number',
            'monthly_income_bracket', 'encoded_by', 'encoded_by_name',
            'member_count', 'is_deleted', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'family_number', 'encoded_by', 'is_deleted', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def create(self, validated_data):
        validated_data['encoded_by'] = self.context['request'].user
        if 'family_number' not in validated_data:
            household = validated_data['household']
            last = Family.all_objects.filter(household=household).order_by('-family_number').first()
            validated_data['family_number'] = (last.family_number + 1) if last else 1
        instance = super().create(validated_data)
        log_created(instance, 'FAMILY', instance.household, self.context['request'].user)
        return instance

    def update(self, instance, validated_data):
        before = snapshot(instance, 'FAMILY')
        validated_data['updated_by'] = self.context['request'].user
        instance = super().update(instance, validated_data)
        log_updated(instance, 'FAMILY', instance.household, before, self.context['request'].user)
        return instance


class BeneficiaryIndicatorSerializer(serializers.ModelSerializer):
    criterion_name = serializers.CharField(source='criterion.name', read_only=True)

    class Meta:
        model = BeneficiaryIndicator
        fields = ['id', 'criterion', 'criterion_name', 'value', 'raw_value', 'encoded_by', 'updated_at']
        read_only_fields = ['id', 'encoded_by', 'updated_at']


class BeneficiarySerializer(serializers.ModelSerializer):
    indicators = BeneficiaryIndicatorSerializer(many=True, read_only=True)
    encoded_by_name = serializers.CharField(source='encoded_by.full_name', read_only=True)
    family_detail = FamilySerializer(source='family', read_only=True)
    household_code = serializers.SerializerMethodField()

    class Meta:
        model = Beneficiary
        fields = [
            'id',
            # Hierarchy
            'family', 'family_detail', 'household', 'household_code',
            'role', 'is_household_head',
            # Fixed profile
            'first_name', 'middle_name', 'last_name',
            'full_name', 'address', 'birthdate', 'age', 'gender',
            'civil_status', 'contact_number',
            # Sectors + eligibility
            'sectors', 'is_tupad_eligible',
            # TUPAD indicators (flat)
            'monthly_income', 'employment_status', 'household_size',
            'num_dependents', 'housing_condition',
            # Soft delete
            'is_deleted', 'deleted_at',
            # Metadata
            'encoded_by', 'encoded_by_name', 'updated_by',
            'indicators', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'household', 'age', 'is_tupad_eligible',
            'is_deleted', 'deleted_at', 'encoded_by', 'updated_by',
            'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        instance = self.instance
        family = attrs.get('family', getattr(instance, 'family', None))
        role = attrs.get('role', getattr(instance, 'role', None))
        birthdate = attrs.get('birthdate', getattr(instance, 'birthdate', None))
        gender = attrs.get('gender', getattr(instance, 'gender', None))
        civil_status = attrs.get('civil_status', getattr(instance, 'civil_status', None))
        sectors = attrs.get('sectors', getattr(instance, 'sectors', []))
        is_household_head = attrs.get(
            'is_household_head',
            getattr(instance, 'is_household_head', False),
        )

        errors = {}
        if family is None:
            errors['family'] = 'Resident profile must belong to a Family.'
        if not role:
            errors['role'] = 'Role is required.'
        if not birthdate:
            errors['birthdate'] = 'Birthdate is required.'
        if not gender:
            errors['gender'] = 'Gender is required.'
        if not civil_status:
            errors['civil_status'] = 'Civil status is required.'
        if not isinstance(sectors, list):
            errors['sectors'] = 'Sectors must be a list.'
        else:
            allowed = {code for code, _ in SECTOR_CHOICES}
            invalid = [code for code in sectors if code not in allowed]
            if invalid:
                errors['sectors'] = f'Invalid sector code(s): {", ".join(invalid)}.'

        if family and is_household_head:
            household_head_qs = Beneficiary.objects.filter(
                family__household=family.household,
                is_household_head=True,
            )
            if instance:
                household_head_qs = household_head_qs.exclude(pk=instance.pk)
            if household_head_qs.exists():
                errors['is_household_head'] = 'Only one resident profile per Household can be marked as household head.'

        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def get_household_code(self, obj):
        if obj.family_id and obj.family.household_id:
            return obj.family.household.household_code
        if obj.household_id:
            return obj.household.household_code
        return None

    def create(self, validated_data):
        validated_data['encoded_by'] = self.context['request'].user
        if validated_data.get('family'):
            validated_data['household'] = validated_data['family'].household
        instance = super().create(validated_data)
        log_created(instance, 'BENEFICIARY', instance.family.household, self.context['request'].user)
        return instance

    def update(self, instance, validated_data):
        before = snapshot(instance, 'BENEFICIARY')
        validated_data['updated_by'] = self.context['request'].user
        if validated_data.get('family'):
            validated_data['household'] = validated_data['family'].household
        instance = super().update(instance, validated_data)
        log_updated(instance, 'BENEFICIARY', instance.family.household, before, self.context['request'].user)
        return instance


class BeneficiaryIndicatorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeneficiaryIndicator
        fields = ['criterion', 'value', 'raw_value']

    def create(self, validated_data):
        beneficiary = self.context['beneficiary']
        if not beneficiary.is_tupad_eligible:
            raise serializers.ValidationError(
                'Indicators can only be encoded for TUPAD-eligible adult resident profiles.'
            )
        before = None
        try:
            before = snapshot(BeneficiaryIndicator.objects.get(
                beneficiary=beneficiary,
                criterion=validated_data['criterion'],
            ), 'INDICATOR')
        except BeneficiaryIndicator.DoesNotExist:
            pass
        validated_data['encoded_by'] = self.context['request'].user
        validated_data['beneficiary'] = beneficiary
        obj, created = BeneficiaryIndicator.objects.update_or_create(
            beneficiary=validated_data['beneficiary'],
            criterion=validated_data['criterion'],
            defaults={
                'value': validated_data['value'],
                'raw_value': validated_data.get('raw_value', str(validated_data['value'])),
                'encoded_by': validated_data['encoded_by'],
            },
        )
        if created:
            log_created(obj, 'INDICATOR', beneficiary.family.household, self.context['request'].user)
        elif before:
            log_updated(obj, 'INDICATOR', beneficiary.family.household, before, self.context['request'].user)
        return obj
