import uuid
from django.db import models
from django.conf import settings


class VaultItem(models.Model):
    """
    A single media item in a user's private vault.
    Status moves: UNAPPROVED_STORAGE -> QUEUED_COMPILE -> LINEAGE_POSTED
    """
    STATUS_UNAPPROVED = 'UNAPPROVED_STORAGE'
    STATUS_QUEUED = 'QUEUED_COMPILE'
    STATUS_POSTED = 'LINEAGE_POSTED'
    STATUS_CHOICES = [
        (STATUS_UNAPPROVED, 'Raw Storage'),
        (STATUS_QUEUED, 'Queued for Compile'),
        (STATUS_POSTED, 'Posted to Lineage'),
    ]

    ERA_PROTECTED = 'PROTECTED'
    ERA_SOVEREIGN = 'SOVEREIGN'
    ERA_CHOICES = [
        (ERA_PROTECTED, 'Protected Era (0-13)'),
        (ERA_SOVEREIGN, 'Sovereign Era (13+)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vault_items'
    )
    # uploaded_by may differ from owner (parent uploads for child in protected era)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_items'
    )
    file = models.ImageField(upload_to='vault/%Y/%m/', null=True, blank=True)
    file_url = models.URLField(blank=True)  # for external S3 in prod
    timestamp = models.DateTimeField()       # original photo timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNAPPROVED)
    era = models.CharField(max_length=10, choices=ERA_CHOICES, default=ERA_SOVEREIGN)
    year = models.IntegerField()             # extracted from timestamp for quick filtering

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.owner} — {self.timestamp.date()} [{self.status}]"

    def save(self, *args, **kwargs):
        if self.timestamp:
            self.year = self.timestamp.year
        super().save(*args, **kwargs)


class AnnualCompileGate(models.Model):
    """
    One gate per user per year. Controls whether the year is sealed.
    is_locked=True means the year is permanently sealed to lineage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='compile_gates'
    )
    target_year = models.IntegerField()
    is_locked = models.BooleanField(default=False)
    compiled_at = models.DateTimeField(null=True, blank=True)
    item_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'target_year')
        ordering = ['-target_year']

    def __str__(self):
        status = "SEALED" if self.is_locked else "open"
        return f"{self.user} — {self.target_year} [{status}]"
