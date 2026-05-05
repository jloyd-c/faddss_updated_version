from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_OFFICIAL = 'official'
    ROLE_RESIDENT = 'resident'
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Administrator'),
        (ROLE_OFFICIAL, 'Barangay Official/Staff'),
        (ROLE_RESIDENT, 'Registered Resident'),
    ]

    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_OFFICIAL)
    beneficiary = models.OneToOneField(
        'beneficiaries.Beneficiary',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_account',
    )
    # is_active is inherited from AbstractUser
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.full_name} ({self.role})'

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

    @property
    def is_official(self):
        return self.role == self.ROLE_OFFICIAL

    @property
    def is_resident(self):
        return self.role == self.ROLE_RESIDENT
