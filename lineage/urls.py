from django.urls import path
from .views import FamilyTreeView

urlpatterns = [
    path('tree/', FamilyTreeView.as_view(), name='family-tree'),
]
