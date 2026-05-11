from datetime import date
from django.db import models
from django.utils import timezone
import uuid


ELIGIBLE_EMPLOYMENT = {'unemployed', 'displaced_terminated', 'underemployed'}

SECTOR_CHOICES = [
    ('PWD', 'Person with Disability'),
    ('SOLO_PARENT', 'Solo Parent'),
    ('SENIOR', 'Senior Citizen'),
    ('4PS', '4Ps / Pantawid Pamilya'),
    ('IP', 'Indigenous People'),
    ('YOUTH', 'Youth (15-30)'),
    ('LACTATING', 'Lactating / Pregnant Mother'),
    ('OFW', 'OFW Family Member'),
]


# ── Soft-delete infrastructure ────────────────────────────────────────────────

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """For admin/audit views only — includes soft-deleted records."""
    def get_queryset(self):
        return super().get_queryset()


class SoftDeleteMixin(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        'users.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_deletions',
    )

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def soft_delete(self, deleted_by_user=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by_user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])


# ── Models ────────────────────────────────────────────────────────────────────

class Household(SoftDeleteMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('VACANT', 'Vacant'),
        ('ABANDONED', 'Abandoned'),
        ('DEMOLISHED', 'Demolished'),
    ]

    household_code = models.CharField(max_length=50, unique=True)
    address = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    purok = models.CharField(max_length=100, blank=True, default='')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    encoded_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='encoded_households',
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='updated_households',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'households'

    def __str__(self):
        return f'{self.household_code} — {self.address[:50]}'


class Family(SoftDeleteMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    INCOME_BRACKET_CHOICES = [
        ('NO_INCOME', 'No Income'),
        ('BELOW_5K', 'Below ₱5,000'),
        ('5K_10K', '₱5,000 – ₱10,000'),
        ('10K_20K', '₱10,000 – ₱20,000'),
        ('20K_30K', '₱20,000 – ₱30,000'),
        ('30K_50K', '₱30,000 – ₱50,000'),
        ('ABOVE_50K', 'Above ₱50,000'),
        ('UNSPECIFIED', 'Unspecified'),
    ]

    household = models.ForeignKey(
        Household,
        on_delete=models.PROTECT,
        related_name='families',
    )
    family_number = models.PositiveIntegerField()
    monthly_income_bracket = models.CharField(
        max_length=20,
        choices=INCOME_BRACKET_CHOICES,
        default='UNSPECIFIED',
    )
    encoded_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='encoded_families',
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='updated_families',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'families'
        unique_together = ['household', 'family_number']

    def __str__(self):
        return f'{self.household.household_code} — Family {self.family_number}'


class Beneficiary(SoftDeleteMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    ROLE_CHOICES = [
        ('head', 'Head'),
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('sibling', 'Sibling'),
        ('relative', 'Relative'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    CIVIL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('widowed', 'Widowed'),
        ('separated', 'Separated'),
        ('live_in', 'Live-in'),
    ]

    EMPLOYMENT_STATUS_CHOICES = [
        ('unemployed', 'Unemployed'),
        ('displaced_terminated', 'Displaced/Terminated'),
        ('underemployed', 'Underemployed'),
        ('self_employed_informal', 'Self-Employed/Informal'),
        ('employed', 'Employed'),
    ]

    HOUSING_CONDITION_CHOICES = [
        ('makeshift', 'Makeshift/Informal Settler'),
        ('semi_permanent', 'Semi-Permanent'),
        ('permanent_deteriorating', 'Permanent but Deteriorating'),
        ('permanent_good', 'Permanent Good Condition'),
    ]

    # Household hierarchy
    family = models.ForeignKey(
        Family,
        on_delete=models.PROTECT,
        related_name='members',
    )
    # Legacy direct household FK (kept for compatibility)
    household = models.ForeignKey(
        Household,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='direct_members',
    )

    # Role in household
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    is_household_head = models.BooleanField(default=False)

    # Fixed profile fields
    first_name = models.CharField(max_length=100, blank=True, default='')
    middle_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')
    full_name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default='')
    birthdate = models.DateField()
    age = models.PositiveIntegerField(default=0)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    civil_status = models.CharField(max_length=10, choices=CIVIL_STATUS_CHOICES)
    contact_number = models.CharField(max_length=20, blank=True, default='')

    # Sector membership (multiple simultaneous)
    sectors = models.JSONField(default=list, blank=True)

    # Auto-computed eligibility flag
    is_tupad_eligible = models.BooleanField(default=False)

    # TUPAD socio-economic indicators (flat — synced to BeneficiaryIndicator via signal)
    monthly_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    employment_status = models.CharField(max_length=25, choices=EMPLOYMENT_STATUS_CHOICES, default='unemployed')
    household_size = models.PositiveIntegerField(default=1)
    num_dependents = models.PositiveIntegerField(default=0)
    housing_condition = models.CharField(max_length=25, choices=HOUSING_CONDITION_CHOICES, default='makeshift')

    encoded_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='encoded_beneficiaries',
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='updated_beneficiaries',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'beneficiaries'

    def sync_name_fields(self):
        name_parts = [
            self.first_name.strip(),
            self.middle_name.strip(),
            self.last_name.strip(),
        ]
        if any(name_parts):
            self.full_name = ' '.join(part for part in name_parts if part)
            return

        parts = self.full_name.strip().split()
        if len(parts) == 1:
            self.first_name = parts[0]
        elif len(parts) == 2:
            self.first_name = parts[0]
            self.last_name = parts[1]
        elif len(parts) > 2:
            self.first_name = parts[0]
            self.middle_name = ' '.join(parts[1:-1])
            self.last_name = parts[-1]

    def save(self, *args, **kwargs):
        self.sync_name_fields()
        if self.birthdate:
            today = date.today()
            self.age = (
                today.year - self.birthdate.year
                - ((today.month, today.day) < (self.birthdate.month, self.birthdate.day))
            )
        self.is_tupad_eligible = self.age >= 18
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name


class BeneficiaryIndicator(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    beneficiary = models.ForeignKey(
        Beneficiary,
        on_delete=models.CASCADE,
        related_name='indicators',
    )
    criterion = models.ForeignKey(
        'criteria.Criterion',
        on_delete=models.PROTECT,
        related_name='indicators',
    )
    value = models.DecimalField(max_digits=12, decimal_places=4)
    raw_value = models.CharField(max_length=255, blank=True, default='')
    encoded_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='encoded_indicators',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'beneficiary_indicators'
        unique_together = ['beneficiary', 'criterion']

    def __str__(self):
        return f'{self.beneficiary.full_name} — {self.criterion.name}: {self.value}'
