from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    ROLE_ADMIN = 'admin'
    ROLE_OFFICIAL = 'official'
    ROLE_RESIDENT = 'resident'
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Administrator'),
        (ROLE_OFFICIAL, 'Barangay Official/Staff'),
        (ROLE_RESIDENT, 'Registered Resident'),
    ]

    middle_name = models.CharField(max_length=150, blank=True, default='')
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
        super().save(*args, **kwargs)

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
