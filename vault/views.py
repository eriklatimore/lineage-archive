from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import VaultItem, AnnualCompileGate
from .serializers import (
    VaultItemSerializer, VaultItemUploadSerializer,
    VaultItemTriageSerializer, AnnualCompileGateSerializer
)
from .permissions import CanUploadToVault, CanDeleteVaultItem


class VaultItemListView(generics.ListAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = VaultItem.objects.filter(owner=user)
        status_filter = self.request.query_params.get('status')
        year_filter = self.request.query_params.get('year')
        era_filter = self.request.query_params.get('era')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if year_filter:
            qs = qs.filter(year=year_filter)
        if era_filter:
            qs = qs.filter(era=era_filter)
        return qs


class VaultItemUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, CanUploadToVault]

    def post(self, request, owner_id=None):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Determine owner (self-upload vs parent uploading for child)
        if owner_id:
            owner = get_object_or_404(User, id=owner_id)
        else:
            owner = request.user

        serializer = VaultItemUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        timestamp = serializer.validated_data['timestamp']

        # Determine era based on owner's age at time of photo
        era = VaultItem.ERA_SOVEREIGN
        if owner.birth_date:
            age_at_time = (timestamp.date() - owner.birth_date).days // 365
            if age_at_time < 13:
                era = VaultItem.ERA_PROTECTED

        item = VaultItem.objects.create(
            owner=owner,
            uploaded_by=request.user,
            file=serializer.validated_data.get('file'),
            timestamp=timestamp,
            era=era,
            status=VaultItem.STATUS_UNAPPROVED,
        )
        return Response(VaultItemSerializer(item, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class VaultItemTriageView(APIView):
    """Monthly triage: keep private, queue for compile, or delete."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        item = get_object_or_404(VaultItem, pk=pk, owner=request.user)

        # Enforce era-based deletion rules
        perm = CanDeleteVaultItem()
        if not perm.has_object_permission(request, self, item):
            return Response({'error': 'You cannot modify this item.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = VaultItemTriageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        if action == 'keep':
            item.status = VaultItem.STATUS_UNAPPROVED
            item.save()
            return Response({'status': 'kept in private archive'})
        elif action == 'queue':
            item.status = VaultItem.STATUS_QUEUED
            item.save()
            return Response({'status': 'queued for annual compile'})
        elif action == 'delete':
            item.delete()
            return Response({'status': 'permanently deleted'},
                            status=status.HTTP_204_NO_CONTENT)


class AnnualCompileGateView(generics.ListAPIView):
    serializer_class = AnnualCompileGateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AnnualCompileGate.objects.filter(user=self.request.user)


class ExecuteAnnualCompileView(APIView):
    """
    The 365-Day Ceremony: seals all QUEUED items for a year
    into LINEAGE_POSTED and locks the gate permanently.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, year):
        user = request.user
        gate, _ = AnnualCompileGate.objects.get_or_create(user=user, target_year=year)

        if gate.is_locked:
            return Response({'error': f'{year} is already sealed.'},
                            status=status.HTTP_400_BAD_REQUEST)

        queued_items = VaultItem.objects.filter(
            owner=user, year=year, status=VaultItem.STATUS_QUEUED
        )
        count = queued_items.count()

        if count == 0:
            return Response({'error': 'No items queued for this year.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Seal: move all queued to posted
        queued_items.update(status=VaultItem.STATUS_POSTED)
        gate.is_locked = True
        gate.compiled_at = timezone.now()
        gate.item_count = count
        gate.save()

        return Response({
            'status': f'{year} sealed to your lineage.',
            'items_posted': count,
            'compiled_at': gate.compiled_at,
        })


class LineageTimelineView(APIView):
    """
    Read-only timeline view for a permitted viewer.
    Returns only LINEAGE_POSTED items grouped by year.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, owner_id):
        from django.contrib.auth import get_user_model
        from users.models import LineagePermission
        User = get_user_model()

        owner = get_object_or_404(User, id=owner_id)
        viewer = request.user

        # Check viewing permission (owner can always view their own timeline)
        if viewer != owner:
            has_permission = LineagePermission.objects.filter(
                owner=owner, viewer=viewer
            ).exists()
            if not has_permission:
                return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        qs = VaultItem.objects.filter(owner=owner, status=VaultItem.STATUS_POSTED)

        # Hide protected era from non-parents who don't have explicit access
        if viewer != owner:
            perm = LineagePermission.objects.get(owner=owner, viewer=viewer)
            if not perm.include_protected_era:
                qs = qs.filter(era=VaultItem.ERA_SOVEREIGN)

        # Group by year
        from collections import defaultdict
        timeline = defaultdict(list)
        for item in qs:
            timeline[item.year].append(
                VaultItemSerializer(item, context={'request': request}).data
            )

        return Response({
            'owner': str(owner),
            'years': sorted(timeline.keys(), reverse=True),
            'timeline': dict(timeline),
        })
