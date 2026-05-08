from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import ProgramCycle, ParticipationRecord, CycleApplication
from .serializers import ProgramCycleSerializer, ParticipationRecordSerializer, CycleApplicationSerializer
from apps.users.permissions import IsAdminOrOfficial


class ProgramCycleListCreateView(generics.ListCreateAPIView):
    queryset = ProgramCycle.objects.select_related('created_by').order_by('-created_at')
    serializer_class = ProgramCycleSerializer

    def get_permissions(self):
        # Residents can read the cycle list (needed for transparency view)
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrOfficial()]
        return [IsAuthenticated()]


class ProgramCycleDetailView(generics.RetrieveAPIView):
    queryset = ProgramCycle.objects.all()
    serializer_class = ProgramCycleSerializer
    permission_classes = [IsAuthenticated]


class ParticipationRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = ParticipationRecordSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrOfficial()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = ParticipationRecord.objects.select_related('beneficiary', 'cycle', 'recorded_by')
        user = self.request.user
        # Residents see only their own participation records
        if user.is_resident:
            return qs.filter(beneficiary=user.beneficiary).order_by('-created_at')
        cycle_id = self.request.query_params.get('cycle')
        beneficiary_id = self.request.query_params.get('beneficiary')
        if cycle_id:
            qs = qs.filter(cycle_id=cycle_id)
        if beneficiary_id:
            qs = qs.filter(beneficiary_id=beneficiary_id)
        return qs.order_by('-created_at')


class CycleApplicationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/cycles/<cycle_pk>/applications/ — list all applications for a cycle
    POST /api/cycles/<cycle_pk>/applications/ — mark a beneficiary as APPLIED
    """
    serializer_class = CycleApplicationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]
    pagination_class = None

    def get_queryset(self):
        return (
            CycleApplication.objects
            .select_related('beneficiary', 'applied_by')
            .filter(cycle_id=self.kwargs['cycle_pk'])
            .order_by('created_at')
        )

    def create(self, request, *args, **kwargs):
        cycle_pk = self.kwargs['cycle_pk']
        is_ranked = CycleApplication.objects.filter(
            cycle_id=cycle_pk,
            status__in=[
                CycleApplication.STATUS_SELECTED,
                CycleApplication.STATUS_DEFERRED,
            ],
        ).exists()
        if is_ranked:
            raise ValidationError({
                'detail': 'This cycle already has ranking results. Applicant marking is locked.'
            })
        data = {**request.data, 'cycle': cycle_pk}
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
