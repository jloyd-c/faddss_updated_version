from django.db import models
import uuid


class Criterion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    TYPE_BENEFIT = 'benefit'
    TYPE_COST = 'cost'
    TYPE_CHOICES = [
        (TYPE_BENEFIT, 'Benefit'),
        (TYPE_COST, 'Cost'),
    ]

    name = models.CharField(max_length=255)
    weight = models.DecimalField(max_digits=5, decimal_places=4)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    field_key = models.CharField(max_length=50, blank=True, default='')
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='updated_criteria',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'criteria'

    def __str__(self):
        return f'{self.name} (weight={self.weight}, type={self.type})'
