from django.urls import path
from .views import (
    VaultItemListView, VaultItemUploadView, VaultItemTriageView,
    AnnualCompileGateView, ExecuteAnnualCompileView, LineageTimelineView
)

urlpatterns = [
    path('items/', VaultItemListView.as_view(), name='vault-list'),
    path('upload/', VaultItemUploadView.as_view(), name='vault-upload'),
    path('upload/<uuid:owner_id>/', VaultItemUploadView.as_view(), name='vault-upload-for-child'),
    path('items/<uuid:pk>/triage/', VaultItemTriageView.as_view(), name='vault-triage'),
    path('gates/', AnnualCompileGateView.as_view(), name='compile-gates'),
    path('compile/<int:year>/', ExecuteAnnualCompileView.as_view(), name='execute-compile'),
    path('timeline/<uuid:owner_id>/', LineageTimelineView.as_view(), name='lineage-timeline'),
]
