from decimal import Decimal
from apps.criteria.models import Criterion
from apps.beneficiaries.models import BeneficiaryIndicator
from apps.cycles.models import ParticipationRecord


def compute_rankings(cycle, applicant_ids):
    """
    Returns a ranked list of dicts for the given cycle and applicant beneficiary IDs.

    Each dict:
      {
        'beneficiary_id': int,
        'total_score': Decimal,
        'has_participated': bool,
        'breakdown': [{'criterion_id', 'criterion_name', 'weight', 'raw_value', 'normalized', 'contribution'}],
        'created_at': datetime,
      }
    """
    active_criteria = list(Criterion.objects.filter(is_active=True))
    if not active_criteria:
        return []

    participated_ids = set(
        ParticipationRecord.objects.filter(cycle=cycle)
        .values_list('beneficiary_id', flat=True)
    )

    # Collect raw values per criterion across all applicants
    criterion_values = {}
    for criterion in active_criteria:
        values = list(
            BeneficiaryIndicator.objects.filter(
                criterion=criterion,
                beneficiary_id__in=applicant_ids,
            ).values('beneficiary_id', 'value', 'beneficiary__created_at')
        )
        criterion_values[criterion.id] = {
            row['beneficiary_id']: row for row in values
        }

    # Compute min/max per criterion for normalization
    ranges = {}
    for criterion in active_criteria:
        vals = [
            float(row['value'])
            for row in criterion_values[criterion.id].values()
        ]
        if len(vals) < 2:
            # Cannot normalize with a single data point — treat as 0
            ranges[criterion.id] = {'min': 0, 'max': 0, 'single': True}
        else:
            ranges[criterion.id] = {'min': min(vals), 'max': max(vals), 'single': False}

    results = []
    for b_id in applicant_ids:
        total_score = Decimal('0')
        breakdown = []

        for criterion in active_criteria:
            row = criterion_values[criterion.id].get(b_id)
            raw_value = float(row['value']) if row else 0.0
            r = ranges[criterion.id]

            if r['single'] or r['max'] == r['min']:
                normalized = 0.0
            elif criterion.type == Criterion.TYPE_COST:
                normalized = (r['max'] - raw_value) / (r['max'] - r['min'])
            else:
                normalized = (raw_value - r['min']) / (r['max'] - r['min'])

            contribution = Decimal(str(normalized)) * criterion.weight
            total_score += contribution

            breakdown.append({
                'criterion_id': criterion.id,
                'criterion_name': criterion.name,
                'weight': criterion.weight,
                'raw_value': raw_value,
                'normalized': round(normalized, 6),
                'contribution': contribution,
            })

        created_at = (
            row['beneficiary__created_at']
            if row else None
        )
        results.append({
            'beneficiary_id': b_id,
            'total_score': total_score,
            'has_participated': b_id in participated_ids,
            'breakdown': breakdown,
            'created_at': created_at,
        })

    # --- Sorting ---
    # Priority: non-participants first, then by score desc, then by highest-weight criterion desc,
    # then by earliest created_at
    highest_weight_criterion = max(active_criteria, key=lambda c: c.weight)

    def sort_key(entry):
        participated_flag = 1 if entry['has_participated'] else 0
        score = -float(entry['total_score'])
        hw_value = -next(
            (b['raw_value'] for b in entry['breakdown']
             if b['criterion_id'] == highest_weight_criterion.id),
            0.0,
        )
        created = entry['created_at'] or ''
        return (participated_flag, score, hw_value, created)

    results.sort(key=sort_key)

    for rank, entry in enumerate(results, start=1):
        entry['rank'] = rank

    return results
