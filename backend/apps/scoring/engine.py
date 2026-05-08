from decimal import Decimal
from apps.criteria.models import Criterion
from apps.beneficiaries.models import BeneficiaryIndicator
from apps.cycles.models import ParticipationRecord


def compute_rankings(cycle, applicant_ids):
    """
    Pure computation: returns a ranked list for the given applicant IDs.
    Does NOT write anything to the database.

    Each entry:
      {
        'beneficiary_id': int,
        'total_score': Decimal,
        'has_participated': bool,   # participated in any PRIOR cycle (not this one)
        'breakdown': [...],
        'created_at': datetime,
        'rank': int,
      }
    """
    if not applicant_ids:
        return []

    active_criteria = list(Criterion.objects.filter(is_active=True))
    if not active_criteria:
        return []

    # Priority rule: check participation in any PREVIOUS cycle (not the current one)
    participated_ids = set(
        ParticipationRecord.objects
        .filter(beneficiary_id__in=applicant_ids)
        .exclude(cycle=cycle)
        .values_list('beneficiary_id', flat=True)
        .distinct()
    )

    # Gather indicator values per criterion
    criterion_values = {}
    for criterion in active_criteria:
        rows = list(
            BeneficiaryIndicator.objects.filter(
                criterion=criterion,
                beneficiary_id__in=applicant_ids,
            ).values('beneficiary_id', 'value', 'raw_value', 'beneficiary__created_at')
        )
        criterion_values[criterion.id] = {row['beneficiary_id']: row for row in rows}

    # Compute min/max per criterion for normalization
    ranges = {}
    for criterion in active_criteria:
        vals = [float(row['value']) for row in criterion_values[criterion.id].values()]
        if len(vals) < 2:
            ranges[criterion.id] = {'min': 0.0, 'max': 0.0, 'single': True}
        else:
            ranges[criterion.id] = {'min': min(vals), 'max': max(vals), 'single': False}

    results = []
    for b_id in applicant_ids:
        total_score = Decimal('0')
        breakdown = []
        last_row = None

        for criterion in active_criteria:
            row = criterion_values[criterion.id].get(b_id)
            raw_numeric = float(row['value']) if row else 0.0
            raw_display = row['raw_value'] if row else '—'
            r = ranges[criterion.id]

            if r['single'] or r['max'] == r['min']:
                normalized = 0.0
            elif criterion.type == Criterion.TYPE_COST:
                normalized = (r['max'] - raw_numeric) / (r['max'] - r['min'])
            else:
                normalized = (raw_numeric - r['min']) / (r['max'] - r['min'])

            contribution = Decimal(str(normalized)) * criterion.weight
            total_score += contribution

            breakdown.append({
                'criterion_id': criterion.id,
                'criterion_name': criterion.name,
                'weight': criterion.weight,
                'raw_value': raw_display,
                'normalized': round(normalized, 6),
                'contribution': contribution,
            })

            if row:
                last_row = row

        results.append({
            'beneficiary_id': b_id,
            'total_score': total_score,
            'has_participated': b_id in participated_ids,
            'breakdown': breakdown,
            'created_at': last_row['beneficiary__created_at'] if last_row else None,
        })

    # Sort: non-participants first → score desc → highest-weight criterion value desc → earliest created_at
    highest_weight = max(active_criteria, key=lambda c: c.weight)

    def sort_key(entry):
        participated_flag = 1 if entry['has_participated'] else 0
        score = -float(entry['total_score'])
        hw_value = -next(
            (b['normalized'] for b in entry['breakdown'] if b['criterion_id'] == highest_weight.id),
            0.0,
        )
        created = entry['created_at'] or ''
        return (participated_flag, score, hw_value, created)

    results.sort(key=sort_key)
    for rank, entry in enumerate(results, start=1):
        entry['rank'] = rank

    return results


def run_ranking(cycle):
    """
    Full ranking flow per spec. Reads APPLIED applications, applies the household
    rule, computes scores, writes SELECTED/DEFERRED + score + rank back to
    CycleApplication. Returns the full result list for display.
    """
    from apps.cycles.models import CycleApplication

    applications = list(
        CycleApplication.objects
        .select_related(
            'beneficiary',
            'beneficiary__family',
            'beneficiary__family__household',
            'beneficiary__household',
        )
        .filter(cycle=cycle, status=CycleApplication.STATUS_APPLIED)
    )

    if not applications:
        return []

    all_ids = [app.beneficiary_id for app in applications]
    app_by_id = {app.beneficiary_id: app for app in applications}

    # Step 2: automatic selection when applicants <= slots
    if len(applications) <= cycle.slots:
        for app in applications:
            app.status = CycleApplication.STATUS_SELECTED
            app.computed_score = None
            app.rank_position = None
        CycleApplication.objects.bulk_update(applications, ['status', 'computed_score', 'rank_position'])
        return [
            {
                'beneficiary_id': app.beneficiary_id,
                'application_id': app.id,
                'status': CycleApplication.STATUS_SELECTED,
                'rank': None,
                'total_score': None,
                'has_participated': False,
                'breakdown': [],
                'deferred_by_household': False,
            }
            for app in applications
        ]

    # Step 3: household rule — pre-compute scores to pick highest scorers per household
    all_scored = compute_rankings(cycle, all_ids)
    score_by_id = {r['beneficiary_id']: float(r['total_score']) for r in all_scored}

    deferred_ids = set()
    household_groups = {}
    for app in applications:
        # Resolve household via family chain first, fall back to direct household FK
        b = app.beneficiary
        if b.family_id and b.family.household_id:
            hid = b.family.household_id
        else:
            hid = b.household_id
        if hid is not None:
            household_groups.setdefault(hid, []).append(app)

    for hh_apps in household_groups.values():
        if len(hh_apps) > cycle.max_per_household:
            sorted_apps = sorted(
                hh_apps,
                key=lambda a: score_by_id.get(a.beneficiary_id, 0.0),
                reverse=True,
            )
            for excess in sorted_apps[cycle.max_per_household:]:
                deferred_ids.add(excess.beneficiary_id)

    # Steps 4-7: rank remaining applicants, assign SELECTED / DEFERRED
    remaining_ids = [aid for aid in all_ids if aid not in deferred_ids]
    ranked = compute_rankings(cycle, remaining_ids)

    bulk_updates = []
    result = []

    for entry in ranked:
        app = app_by_id[entry['beneficiary_id']]
        status = (
            CycleApplication.STATUS_SELECTED
            if entry['rank'] <= cycle.slots
            else CycleApplication.STATUS_DEFERRED
        )
        app.status = status
        app.computed_score = entry['total_score']
        app.rank_position = entry['rank']
        bulk_updates.append(app)
        result.append({
            **entry,
            'application_id': app.id,
            'status': status,
            'deferred_by_household': False,
        })

    # Household-deferred entries — marked DEFERRED, no score or rank
    for b_id in deferred_ids:
        app = app_by_id[b_id]
        app.status = CycleApplication.STATUS_DEFERRED
        app.computed_score = None
        app.rank_position = None
        bulk_updates.append(app)
        result.append({
            'beneficiary_id': b_id,
            'application_id': app.id,
            'status': CycleApplication.STATUS_DEFERRED,
            'rank': None,
            'total_score': None,
            'has_participated': False,
            'breakdown': [],
            'deferred_by_household': True,
        })

    CycleApplication.objects.bulk_update(bulk_updates, ['status', 'computed_score', 'rank_position'])
    return result
