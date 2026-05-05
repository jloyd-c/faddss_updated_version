from django.db import models


class Beneficiary(models.Model):
    EMPLOYMENT_EMPLOYED = 'employed'
    EMPLOYMENT_UNEMPLOYED = 'unemployed'
    EMPLOYMENT_SELF_EMPLOYED = 'self_employed'
    EMPLOYMENT_STATUS_CHOICES = [
        (EMPLOYMENT_EMPLOYED, 'Employed'),
        (EMPLOYMENT_UNEMPLOYED, 'Unemployed'),
        (EMPLOYMENT_SELF_EMPLOYED, 'Self-Employed'),
    ]

    HOUSING_OWNED = 'owned'
    HOUSING_RENTED = 'rented'
    HOUSING_INFORMAL = 'informal'
    HOUSING_CONDITION_CHOICES = [
        (HOUSING_OWNED, 'Owned'),
        (HOUSING_RENTED, 'Rented'),
        (HOUSING_INFORMAL, 'Informal/Makeshift'),
    ]

    full_name = models.CharField(max_length=255)
    address = models.TextField()
    age = models.PositiveIntegerField()
    household_size = models.PositiveIntegerField()
    monthly_income = models.DecimalField(max_digits=10, decimal_places=2)
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS_CHOICES)
    housing_condition = models.CharField(max_length=20, choices=HOUSING_CONDITION_CHOICES)
    is_pwd = models.BooleanField(default=False)
    is_senior = models.BooleanField(default=False)
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

    def __str__(self):
        return self.full_name


class BeneficiaryIndicator(models.Model):
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
