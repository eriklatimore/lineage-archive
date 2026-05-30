from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import LineagePermission

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name',
                  'birth_date', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        # Auto-set account status based on age
        if user.birth_date:
            from django.utils import timezone
            age = (timezone.now().date() - user.birth_date).days // 365
            user.account_status = User.STATUS_PROTECTED if age < 13 else User.STATUS_SOVEREIGN
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    paternal_parent_name = serializers.SerializerMethodField()
    maternal_parent_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'birth_date', 'account_status', 'age',
            'paternal_parent', 'paternal_parent_name',
            'maternal_parent', 'maternal_parent_name',
            'handoff_completed',
        ]
        read_only_fields = ['id', 'account_status', 'handoff_completed']

    def get_age(self, obj):
        return obj.age()

    def get_paternal_parent_name(self, obj):
        return str(obj.paternal_parent) if obj.paternal_parent else None

    def get_maternal_parent_name(self, obj):
        return str(obj.maternal_parent) if obj.maternal_parent else None


class LineagePermissionSerializer(serializers.ModelSerializer):
    viewer_email = serializers.EmailField(source='viewer.email', read_only=True)
    viewer_name = serializers.SerializerMethodField()

    class Meta:
        model = LineagePermission
        fields = ['id', 'viewer', 'viewer_email', 'viewer_name',
                  'include_protected_era', 'granted_at']
        read_only_fields = ['id', 'granted_at']

    def get_viewer_name(self, obj):
        return obj.viewer.get_full_name() or obj.viewer.email


class HandoffTokenSerializer(serializers.Serializer):
    token = serializers.UUIDField()
