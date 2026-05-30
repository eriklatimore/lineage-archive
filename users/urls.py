from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, ProfileView,
    LineagePermissionListView, LineagePermissionDetailView,
    GenerateHandoffTokenView, CompleteHandoffView, SearchUserView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('permissions/', LineagePermissionListView.as_view(), name='permissions'),
    path('permissions/<uuid:pk>/', LineagePermissionDetailView.as_view(), name='permission-detail'),
    path('handoff/generate/', GenerateHandoffTokenView.as_view(), name='handoff-generate'),
    path('handoff/complete/', CompleteHandoffView.as_view(), name='handoff-complete'),
    path('search/', SearchUserView.as_view(), name='user-search'),
]
