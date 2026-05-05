from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.users.permissions import IsAdminOrOfficial, IsResident
from apps.cycles.models import ProgramCycle
from .engine import compute_rankings


class RankingView(APIView):
    """
    POST /api/scoring/rank/
    Body: { "cycle_id": int, "applicant_ids": [int, ...] }
    Returns the ranked list for the given cycle and applicants.
    """
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def post(self, request):
        cycle_id = request.data.get('cycle_id')
        applicant_ids = request.data.get('applicant_ids', [])

        if not cycle_id or not applicant_ids:
            return Response({'detail': 'cycle_id and applicant_ids are required.'}, status=400)

        cycle = get_object_or_404(ProgramCycle, pk=cycle_id)
        results = compute_rankings(cycle, applicant_ids)
        return Response({'cycle': cycle.cycle_name, 'rankings': results})


class ResidentScoreView(APIView):
    """
    GET /api/scoring/my-score/?cycle_id=<id>
    Returns ranking position and score breakdown for the authenticated resident.
    """
    permission_classes = [IsAuthenticated, IsResident]

    def get(self, request):
        cycle_id = request.query_params.get('cycle_id')
        if not cycle_id:
            return Response({'detail': 'cycle_id query param is required.'}, status=400)

        beneficiary = request.user.beneficiary
        if not beneficiary:
            return Response({'detail': 'No linked beneficiary profile.'}, status=400)

        cycle = get_object_or_404(ProgramCycle, pk=cycle_id)

        # Score only within the context of all applicants for that cycle
        from apps.cycles.models import ParticipationRecord
        applicant_ids = list(
            ParticipationRecord.objects.filter(cycle=cycle)
            .values_list('beneficiary_id', flat=True)
            .distinct()
        ) or [beneficiary.id]

        if beneficiary.id not in applicant_ids:
            applicant_ids.append(beneficiary.id)

        rankings = compute_rankings(cycle, applicant_ids)
        my_entry = next((r for r in rankings if r['beneficiary_id'] == beneficiary.id), None)
        return Response(my_entry or {'detail': 'Not ranked in this cycle.'})
