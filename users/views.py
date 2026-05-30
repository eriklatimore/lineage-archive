import uuid
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import LineagePermission
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer,
    LineagePermissionSerializer, HandoffTokenSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LineagePermissionListView(generics.ListCreateAPIView):
    serializer_class = LineagePermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LineagePermission.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        viewer_id = self.request.data.get('viewer')
        viewer = get_object_or_404(User, id=viewer_id)
        serializer.save(owner=self.request.user, viewer=viewer)


class LineagePermissionDetailView(generics.DestroyAPIView):
    serializer_class = LineagePermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LineagePermission.objects.filter(owner=self.request.user)


class GenerateHandoffTokenView(APIView):
    """Parent generates a one-time handoff token to send to their child."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        child_id = request.data.get('child_id')
        child = get_object_or_404(User, id=child_id)

        # Verify requester is actually a parent of this child
        if child.paternal_parent != request.user and child.maternal_parent != request.user:
            return Response({'error': 'You are not a parent of this account.'},
                            status=status.HTTP_403_FORBIDDEN)

        token = uuid.uuid4()
        child.handoff_token = token
        child.save()
        return Response({'token': str(token)})


class CompleteHandoffView(APIView):
    """Child completes handoff: transitions account to SOVEREIGN."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = HandoffTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if str(user.handoff_token) != str(serializer.validated_data['token']):
            return Response({'error': 'Invalid handoff token.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.account_status = User.STATUS_SOVEREIGN
        user.handoff_token = None
        user.handoff_completed = True
        user.save()
        return Response({'status': 'Account transitioned to Sovereign Era.'})


class SearchUserView(APIView):
    """Find a user by email to grant viewing permissions."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        email = request.query_params.get('email', '')
        if not email:
            return Response({'error': 'email param required'}, status=400)
        try:
            user = User.objects.get(email=email)
            return Response({'id': str(user.id), 'name': str(user), 'email': user.email})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
