import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Sovereign user node. Every user is a cryptographically isolated
    node on the family graph with directional lineage connections.
    """
    STATUS_PROTECTED = 'PROTECTED_ERA'
    STATUS_SOVEREIGN = 'SOVEREIGN'
    STATUS_CHOICES = [
        (STATUS_PROTECTED, 'Protected Era (0-13)'),
        (STATUS_SOVEREIGN, 'Sovereign (13+)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    birth_date = models.DateField(null=True, blank=True)
    account_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_SOVEREIGN
    )
    paternal_parent = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='paternal_children'
    )
    maternal_parent = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='maternal_children'
    )
    # Users who can view this person's compiled lineage
    viewing_permissions_granted_to = models.ManyToManyField(
        'self', blank=True, symmetrical=False,
        related_name='can_view'
    )
    # Handoff token: parent sends this to child at age 13
    handoff_token = models.UUIDField(null=True, blank=True)
    handoff_completed = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def age(self):
        if not self.birth_date:
            return None
        today = timezone.now().date()
        return (today - self.birth_date).days // 365

    def is_protected_era(self):
        age = self.age()
        return age is not None and age < 13

    def __str__(self):
        return f"{self.get_full_name() or self.email}"


class LineagePermission(models.Model):
    """Explicit access token — one row per granted viewer."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions_given')
    viewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions_received')
    granted_at = models.DateTimeField(auto_now_add=True)
    # Granular: can viewer see protected era (0-13) content?
    include_protected_era = models.BooleanField(default=False)

    class Meta:
        unique_together = ('owner', 'viewer')

    def __str__(self):
        return f"{self.viewer} can view {self.owner}"
