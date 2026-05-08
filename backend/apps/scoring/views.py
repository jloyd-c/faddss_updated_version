from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.users.permissions import IsAdminOrOfficial, IsResident
from apps.cycles.models import ProgramCycle, CycleApplication
from apps.audit.models import AuditLog
from .engine import run_ranking, compute_rankings


class RankingView(APIView):
    """
    POST /api/scoring/rank/
    Body: { "cycle_id": int }

    Reads all APPLIED CycleApplications for the cycle, runs the full ranking
    algorithm (household rule, scoring, selection), writes SELECTED/DEFERRED
    status back, and returns the ranked list.
    """
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def post(self, request):
        cycle_id = request.data.get('cycle_id')
        if not cycle_id:
            return Response({'detail': 'cycle_id is required.'}, status=400)

        cycle = get_object_or_404(ProgramCycle, pk=cycle_id)
        results = run_ranking(cycle)

        # Enrich with beneficiary names for the frontend
        if results:
            from apps.cycles.models import CycleApplication
            from apps.beneficiaries.models import Beneficiary
            names = dict(
                Beneficiary.objects.filter(
                    id__in=[r['beneficiary_id'] for r in results]
                ).values_list('id', 'full_name')
            )
            for r in results:
                r['beneficiary_name'] = names.get(r['beneficiary_id'], '')

        AuditLog.objects.create(
            user=request.user,
            action='generate_ranking',
            target_table='cycle_applications',
            target_id=str(cycle.id),
            details={
                'cycle_name': cycle.cycle_name,
                'cycle_id': str(cycle.id),
                'applicants_ranked': len(results),
                'slots': cycle.slots,
            },
        )

        return Response({'cycle': cycle.cycle_name, 'slots': cycle.slots, 'rankings': results})


class ResidentScoreView(APIView):
    """
    GET /api/scoring/my-score/?cycle_id=<id>

    Returns the authenticated resident's ranking position, score, and
    criteria breakdown for the given cycle. The score and rank are read from
    the stored CycleApplication; the breakdown is computed dynamically from
    BeneficiaryIndicator so it always reflects the current indicator values.
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

        try:
            application = CycleApplication.objects.get(beneficiary=beneficiary, cycle=cycle)
        except CycleApplication.DoesNotExist:
            return Response({'detail': 'You have not applied for this cycle.'}, status=400)

        # Compute breakdown dynamically from BeneficiaryIndicator
        entries = compute_rankings(cycle, [beneficiary.id])
        breakdown = entries[0]['breakdown'] if entries else []
        has_participated = entries[0]['has_participated'] if entries else False

        return Response({
            'status': application.status,
            'rank': application.rank_position,
            'total_score': application.computed_score,
            'has_participated': has_participated,
            'breakdown': breakdown,
        })
