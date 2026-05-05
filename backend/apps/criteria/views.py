from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Criterion
from .serializers import CriterionSerializer
from apps.users.permissions import IsAdminOrOfficial


class CriterionListCreateView(generics.ListCreateAPIView):
    serializer_class = CriterionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def get_queryset(self):
        qs = Criterion.objects.all().order_by('-is_active', 'name')
        active_only = self.request.query_params.get('active')
        if active_only == 'true':
            qs = qs.filter(is_active=True)
        return qs


class CriterionDetailView(generics.RetrieveUpdateAPIView):
    queryset = Criterion.objects.all()
    serializer_class = CriterionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]
