from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ProgramCycle, ParticipationRecord
from .serializers import ProgramCycleSerializer, ParticipationRecordSerializer
from apps.users.permissions import IsAdminOrOfficial


class ProgramCycleListCreateView(generics.ListCreateAPIView):
    queryset = ProgramCycle.objects.select_related('created_by').order_by('-created_at')
    serializer_class = ProgramCycleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]


class ProgramCycleDetailView(generics.RetrieveAPIView):
    queryset = ProgramCycle.objects.all()
    serializer_class = ProgramCycleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]


class ParticipationRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = ParticipationRecordSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def get_queryset(self):
        qs = ParticipationRecord.objects.select_related('beneficiary', 'cycle', 'recorded_by')
        cycle_id = self.request.query_params.get('cycle')
        beneficiary_id = self.request.query_params.get('beneficiary')
        if cycle_id:
            qs = qs.filter(cycle_id=cycle_id)
        if beneficiary_id:
            qs = qs.filter(beneficiary_id=beneficiary_id)
        return qs.order_by('-created_at')
