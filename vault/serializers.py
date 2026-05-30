from rest_framework import serializers
from .models import VaultItem, AnnualCompileGate


class VaultItemSerializer(serializers.ModelSerializer):
    file_display_url = serializers.SerializerMethodField()

    class Meta:
        model = VaultItem
        fields = [
            'id', 'owner', 'uploaded_by', 'file', 'file_url',
            'file_display_url', 'timestamp', 'created_at',
            'status', 'era', 'year'
        ]
        read_only_fields = ['id', 'owner', 'uploaded_by', 'created_at', 'year', 'era']

    def get_file_display_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file_url or None


class VaultItemUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaultItem
        fields = ['file', 'timestamp']


class VaultItemTriageSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['keep', 'queue', 'delete'])


class AnnualCompileGateSerializer(serializers.ModelSerializer):
    queued_count = serializers.SerializerMethodField()

    class Meta:
        model = AnnualCompileGate
        fields = ['id', 'target_year', 'is_locked', 'compiled_at', 'item_count', 'queued_count']
        read_only_fields = ['id', 'is_locked', 'compiled_at', 'item_count']

    def get_queued_count(self, obj):
        return VaultItem.objects.filter(
            owner=obj.user,
            year=obj.target_year,
            status=VaultItem.STATUS_QUEUED
        ).count()
