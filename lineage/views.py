from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

User = get_user_model()


class FamilyTreeView(APIView):
    """Returns the user's immediate family graph (parents + children)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'self': {
                'id': str(user.id),
                'name': str(user),
                'account_status': user.account_status,
                'age': user.age(),
            },
            'paternal_parent': self._node(user.paternal_parent),
            'maternal_parent': self._node(user.maternal_parent),
            'paternal_children': [self._node(c) for c in user.paternal_children.all()],
            'maternal_children': [self._node(c) for c in user.maternal_children.all()],
        }
        return Response(data)

    def _node(self, user):
        if not user:
            return None
        return {
            'id': str(user.id),
            'name': str(user),
            'account_status': user.account_status,
        }
