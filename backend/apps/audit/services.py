from django.forms.models import model_to_dict

from .models import ProfileChangeLog


PROFILE_FIELDS = {
    'HOUSEHOLD': [
        'household_code', 'address', 'purok', 'status',
        'latitude', 'longitude', 'notes',
    ],
    'FAMILY': ['household', 'family_number', 'monthly_income_bracket'],
    'BENEFICIARY': [
        'family', 'first_name', 'middle_name', 'last_name', 'full_name',
        'birthdate', 'age', 'gender', 'civil_status', 'role',
        'is_household_head', 'contact_number', 'sectors',
        'is_tupad_eligible', 'monthly_income', 'employment_status',
        'household_size', 'num_dependents', 'housing_condition',
    ],
    'INDICATOR': ['beneficiary', 'criterion', 'value', 'raw_value'],
}


def snapshot(instance, target_type):
    data = model_to_dict(instance, fields=PROFILE_FIELDS[target_type])
    return {key: _serialize(value) for key, value in data.items()}


def log_created(instance, target_type, household, changed_by):
    current = snapshot(instance, target_type)
    ProfileChangeLog.log_change(
        household=household,
        target_type=target_type,
        target_id=instance.pk,
        action=ProfileChangeLog.Action.CREATED,
        changed_fields={key: {'old': None, 'new': value} for key, value in current.items()},
        changed_by=changed_by,
    )


def log_updated(instance, target_type, household, before, changed_by):
    after = snapshot(instance, target_type)
    changed_fields = {
        key: {'old': before.get(key), 'new': after.get(key)}
        for key in after
        if before.get(key) != after.get(key)
    }
    if not changed_fields:
        return None
    return ProfileChangeLog.log_change(
        household=household,
        target_type=target_type,
        target_id=instance.pk,
        action=ProfileChangeLog.Action.UPDATED,
        changed_fields=changed_fields,
        changed_by=changed_by,
    )


def log_state_change(instance, target_type, household, action, changed_by, notes=''):
    return ProfileChangeLog.log_change(
        household=household,
        target_type=target_type,
        target_id=instance.pk,
        action=action,
        changed_fields={'is_deleted': {'old': action == ProfileChangeLog.Action.RESTORED, 'new': action == ProfileChangeLog.Action.SOFT_DELETED}},
        changed_by=changed_by,
        notes=notes,
    )


def _serialize(value):
    if hasattr(value, 'pk'):
        return str(value.pk)
    if isinstance(value, list):
        return [_serialize(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize(item) for key, item in value.items()}
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    return str(value)
