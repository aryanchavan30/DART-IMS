from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import ExitRequest
from .serializers import ExitRequestSerializer


class ExitRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ExitRequest model.
    """
    queryset = ExitRequest.objects.all()
    serializer_class = ExitRequestSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Return all exit requests with related data"""
        return ExitRequest.objects.select_related(
            'intern',
            'intern__user',
            'intern__candidate',
            'intern__candidate__department'
        ).all()
