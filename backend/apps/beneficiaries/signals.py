from django.db.models.signals import post_save
from django.dispatch import receiver

# Numeric mappings for choice-type COST indicators.
_EMPLOYMENT_VALUES = {
    'unemployed': 1,
    'displaced_terminated': 2,
    'underemployed': 3,
    'self_employed_informal': 4,
    'employed': 5,
}

_HOUSING_VALUES = {
    'makeshift': 1,
    'semi_permanent': 2,
    'permanent_deteriorating': 3,
    'permanent_good': 4,
}


def _in_sectors(b, code):
    return 1.0 if code in (b.sectors or []) else 0.0


def _sector_raw(b, code):
    return 'Yes' if code in (b.sectors or []) else 'No'


# Maps Criterion.field_key → (numeric_value, raw_value_string) extractor
FIELD_VALUE_MAP = {
    'monthly_income': lambda b: (float(b.monthly_income), str(b.monthly_income)),
    'employment_status': lambda b: (
        float(_EMPLOYMENT_VALUES.get(b.employment_status, 0)),
        b.employment_status,
    ),
    'household_size': lambda b: (float(b.household_size), str(b.household_size)),
    'num_dependents': lambda b: (float(b.num_dependents), str(b.num_dependents)),
    'housing_condition': lambda b: (
        float(_HOUSING_VALUES.get(b.housing_condition, 0)),
        b.housing_condition,
    ),
    'is_pwd': lambda b: (_in_sectors(b, 'PWD'), _sector_raw(b, 'PWD')),
    'is_senior': lambda b: (_in_sectors(b, 'SENIOR'), _sector_raw(b, 'SENIOR')),
    'is_solo_parent': lambda b: (_in_sectors(b, 'SOLO_PARENT'), _sector_raw(b, 'SOLO_PARENT')),
    'is_4ps': lambda b: (_in_sectors(b, '4PS'), _sector_raw(b, '4PS')),
}


@receiver(post_save, sender='beneficiaries.Beneficiary')
def sync_beneficiary_indicators(sender, instance, **kwargs):
    """
    Auto-creates/updates BeneficiaryIndicator rows when a Beneficiary is saved.
    Only processes active Criteria that have a matching field_key.
    """
    from apps.criteria.models import Criterion
    from apps.beneficiaries.models import BeneficiaryIndicator

    if not instance.is_tupad_eligible:
        return

    active_criteria = Criterion.objects.filter(
        is_active=True,
        field_key__in=FIELD_VALUE_MAP.keys(),
    )
    user = instance.updated_by or instance.encoded_by
    for criterion in active_criteria:
        mapper = FIELD_VALUE_MAP.get(criterion.field_key)
        if mapper is None:
            continue
        value, raw_value = mapper(instance)
        from apps.audit.services import log_created, log_updated, snapshot
        try:
            existing = BeneficiaryIndicator.objects.get(beneficiary=instance, criterion=criterion)
            before = snapshot(existing, 'INDICATOR')
        except BeneficiaryIndicator.DoesNotExist:
            before = None
        obj, created = BeneficiaryIndicator.objects.update_or_create(
            beneficiary=instance,
            criterion=criterion,
            defaults={
                'value': value,
                'raw_value': raw_value,
                'encoded_by': user,
            },
        )
        if created:
            log_created(obj, 'INDICATOR', instance.family.household, user)
        elif before:
            log_updated(obj, 'INDICATOR', instance.family.household, before, user)
