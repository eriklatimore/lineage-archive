from rest_framework.permissions import BasePermission
from .models import VaultItem


class CanUploadToVault(BasePermission):
    """
    Parent can upload to child's vault during Protected Era.
    Sovereign users upload only to their own vault.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        # Owner always has access
        if obj.owner == user:
            return True
        # Parent can access Protected Era items of their child
        if obj.era == VaultItem.ERA_PROTECTED:
            child = obj.owner
            if child.paternal_parent == user or child.maternal_parent == user:
                return True
        return False


class CanDeleteVaultItem(BasePermission):
    """
    - Child (Sovereign): can delete only their own Sovereign Era items.
    - Parent: can delete only Protected Era items of their child.
    - Neither can delete items outside their era.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        # Sovereign user deleting their own sovereign-era item
        if obj.owner == user and obj.era == VaultItem.ERA_SOVEREIGN:
            return True
        # Parent deleting child's protected era item
        if obj.era == VaultItem.ERA_PROTECTED:
            child = obj.owner
            if child.paternal_parent == user or child.maternal_parent == user:
                return True
        return False
