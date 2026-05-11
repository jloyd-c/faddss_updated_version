from datetime import date, timedelta
from decimal import Decimal
import random

from django.core.management.base import BaseCommand

from apps.beneficiaries.models import (
    Beneficiary,
    BeneficiaryIndicator,
    Family,
    Household,
)
from apps.criteria.models import Criterion
from apps.cycles.models import CycleApplication, ParticipationRecord, ProgramCycle
from apps.scoring.engine import run_ranking
from apps.users.models import User


class Command(BaseCommand):
    help = 'Seed realistic FADDSS test data for local development.'

    def add_arguments(self, parser):
        parser.add_argument('--beneficiaries', type=int, default=500)
        parser.add_argument('--applications', type=int, default=100)
        parser.add_argument('--slots', type=int, default=50)

    def handle(self, *args, **options):
        random.seed(20260507)
        target_beneficiaries = options['beneficiaries']
        target_applications = options['applications']
        slots = options['slots']

        admin = self.ensure_user(
            username='admin',
            password='Admin12345',
            first_name='FADDSS',
            middle_name='',
            last_name='Administrator',
            role=User.ROLE_ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        official = self.ensure_user(
            username='official',
            password='Official12345',
            first_name='Barangay',
            middle_name='',
            last_name='Official',
            role=User.ROLE_OFFICIAL,
            is_staff=True,
            is_superuser=False,
        )

        criteria = self.ensure_criteria(admin)
        households = self.ensure_households(official)
        families = self.ensure_families(households, official)
        created_beneficiaries = self.ensure_beneficiaries(
            families,
            official,
            target_beneficiaries,
        )
        created_indicators, updated_indicators = self.ensure_indicators(criteria, official)
        cycle = self.ensure_cycle(official, slots)
        applications_created = self.ensure_applications(cycle, official, target_applications)
        CycleApplication.objects.filter(cycle=cycle).update(
            status=CycleApplication.STATUS_APPLIED,
            computed_score=None,
            rank_position=None,
        )
        ranking = run_ranking(cycle)
        participation_created = self.ensure_participation(cycle, official)
        residents_created = self.ensure_residents(cycle)

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
        self.stdout.write('Login accounts:')
        self.stdout.write('  admin / Admin12345')
        self.stdout.write('  official / Official12345')
        self.stdout.write('  resident1-resident5 / Resident12345')
        self.stdout.write(f'Households: {Household.objects.count()}')
        self.stdout.write(f'Families: {Family.objects.count()}')
        self.stdout.write(
            f'Beneficiaries: {Beneficiary.objects.count()} '
            f'(added this run: {created_beneficiaries})'
        )
        self.stdout.write(
            f'Indicators: {BeneficiaryIndicator.objects.count()} '
            f'(created: {created_indicators}, updated: {updated_indicators})'
        )
        self.stdout.write(
            f'Applications in cycle: {CycleApplication.objects.filter(cycle=cycle).count()} '
            f'(created this run: {applications_created})'
        )
        self.stdout.write(f'Ranking rows recalculated: {len(ranking)}')
        self.stdout.write(
            f'Selected: '
            f'{CycleApplication.objects.filter(cycle=cycle, status=CycleApplication.STATUS_SELECTED).count()}'
        )
        self.stdout.write(
            f'Deferred: '
            f'{CycleApplication.objects.filter(cycle=cycle, status=CycleApplication.STATUS_DEFERRED).count()}'
        )
        self.stdout.write(f'Participation records added this run: {participation_created}')
        self.stdout.write(f'Resident accounts added this run: {residents_created}')

    def ensure_user(
        self,
        username,
        password,
        first_name,
        middle_name,
        last_name,
        role,
        is_staff,
        is_superuser,
    ):
        user, _ = User.objects.get_or_create(username=username)
        user.first_name = first_name
        user.middle_name = middle_name
        user.last_name = last_name
        user.role = role
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.is_active = True
        user.email = user.email or f'{username}@example.com'
        user.set_password(password)
        user.save()
        return user

    def ensure_criteria(self, admin):
        specs = [
            ('Monthly Income', Decimal('0.3500'), Criterion.TYPE_COST, 'monthly_income'),
            ('Number of Dependents', Decimal('0.2500'), Criterion.TYPE_BENEFIT, 'num_dependents'),
            ('Employment Vulnerability', Decimal('0.2000'), Criterion.TYPE_BENEFIT, 'employment_status'),
            ('Housing Vulnerability', Decimal('0.1200'), Criterion.TYPE_BENEFIT, 'housing_condition'),
            ('Priority Sector Membership', Decimal('0.0800'), Criterion.TYPE_BENEFIT, 'sectors'),
        ]
        criteria = []
        for name, weight, criterion_type, field_key in specs:
            criterion, _ = Criterion.objects.update_or_create(
                name=name,
                defaults={
                    'weight': weight,
                    'type': criterion_type,
                    'field_key': field_key,
                    'is_active': True,
                    'updated_by': admin,
                },
            )
            criteria.append(criterion)
        return criteria

    def ensure_households(self, official):
        puroks = [
            'Purok 1',
            'Purok 2',
            'Purok 3',
            'Purok 4',
            'Purok 5',
            'Centro',
            'Sitio Ilawod',
            'Sitio Tabok',
        ]
        households = []
        for number in range(1, 101):
            purok = random.choice(puroks)
            household, _ = Household.objects.get_or_create(
                household_code=f'BTB-HH-{number:04d}',
                defaults={
                    'address': f'Barangay Batobalani, {purok}',
                    'status': 'ACTIVE',
                    'purok': purok,
                    'notes': 'Seed test household',
                    'encoded_by': official,
                },
            )
            households.append(household)
        return households

    def ensure_families(self, households, official):
        income_brackets = ['NO_INCOME', 'BELOW_5K', '5K_10K', '10K_20K', 'UNSPECIFIED']
        families = []
        for index, household in enumerate(households, start=1):
            family_count = 1 if index <= 75 else 2
            for family_number in range(1, family_count + 1):
                family, _ = Family.objects.get_or_create(
                    household=household,
                    family_number=family_number,
                    defaults={
                        'monthly_income_bracket': random.choice(income_brackets),
                        'encoded_by': official,
                    },
                )
                families.append(family)
        return families

    def ensure_beneficiaries(self, families, official, target):
        first_names = [
            'Juan',
            'Maria',
            'Jose',
            'Ana',
            'Pedro',
            'Rosa',
            'Carlo',
            'Liza',
            'Mark',
            'Grace',
            'Ramon',
            'Elena',
            'Nico',
            'Mila',
            'Jun',
            'Arlene',
            'Paolo',
            'Jessa',
            'Daniel',
            'Regina',
        ]
        middle_names = ['Santos', 'Reyes', 'Garcia', 'Mendoza', 'Flores', 'Cruz', 'Ramos', 'Torres']
        last_names = ['Dela Cruz', 'Reyes', 'Santos', 'Garcia', 'Mendoza', 'Ramos', 'Torres', 'Flores']
        sectors_pool = ['PWD', 'SOLO_PARENT', 'SENIOR', '4PS', 'IP', 'YOUTH', 'OFW']
        employment_choices = ['unemployed', 'displaced_terminated', 'underemployed', 'self_employed_informal', 'employed']
        housing_choices = ['makeshift', 'semi_permanent', 'permanent_deteriorating', 'permanent_good']
        created = 0

        while Beneficiary.objects.count() < target:
            family = random.choice(families)
            household = family.household
            sequence = Beneficiary.objects.count() + 1
            role = random.choice(['head', 'spouse', 'parent', 'sibling', 'relative', 'child'])
            age = random.randint(8, 17) if role == 'child' and random.random() < 0.65 else random.randint(18, 64)
            first = random.choice(first_names)
            middle = random.choice(middle_names)
            last = random.choice(last_names)
            employment = random.choices(employment_choices, weights=[35, 18, 22, 15, 10])[0]
            housing = random.choices(housing_choices, weights=[25, 35, 25, 15])[0]
            monthly_income = (
                random.choice([0, 1500, 2500, 3500, 5000, 7500, 9000, 12000])
                if employment != 'employed'
                else random.choice([10000, 12000, 15000, 18000])
            )
            sectors = random.sample(sectors_pool, random.choices([0, 1, 2], weights=[45, 40, 15])[0])
            if age >= 60 and 'SENIOR' not in sectors:
                sectors.append('SENIOR')

            Beneficiary.objects.create(
                family=family,
                household=household,
                role=role,
                is_household_head=False,
                first_name=first,
                middle_name=middle,
                last_name=last,
                full_name=f'{first} {middle} {last} Test {sequence}',
                address=household.address,
                birthdate=date.today() - timedelta(days=age * 365 + random.randint(0, 364)),
                gender=random.choice(['male', 'female']),
                civil_status=random.choice(['single', 'married', 'widowed', 'separated', 'live_in']),
                contact_number=f'09{random.randint(100000000, 999999999)}',
                sectors=sectors,
                monthly_income=monthly_income,
                employment_status=employment,
                household_size=random.randint(3, 6),
                num_dependents=random.randint(0, 5),
                housing_condition=housing,
                encoded_by=official,
            )
            created += 1
        return created

    def ensure_indicators(self, criteria, official):
        employment_value = {
            'unemployed': 100,
            'displaced_terminated': 95,
            'underemployed': 80,
            'self_employed_informal': 55,
            'employed': 20,
        }
        housing_value = {
            'makeshift': 100,
            'semi_permanent': 70,
            'permanent_deteriorating': 55,
            'permanent_good': 15,
        }
        created_count = 0
        updated_count = 0

        for beneficiary in Beneficiary.objects.all():
            sectors = beneficiary.sectors or []
            values = {
                'Monthly Income': (Decimal(str(beneficiary.monthly_income)), str(beneficiary.monthly_income)),
                'Number of Dependents': (Decimal(str(beneficiary.num_dependents)), str(beneficiary.num_dependents)),
                'Employment Vulnerability': (
                    Decimal(str(employment_value.get(beneficiary.employment_status, 0))),
                    beneficiary.employment_status.replace('_', ' '),
                ),
                'Housing Vulnerability': (
                    Decimal(str(housing_value.get(beneficiary.housing_condition, 0))),
                    beneficiary.housing_condition.replace('_', ' '),
                ),
                'Priority Sector Membership': (
                    Decimal(str(len(sectors))),
                    ', '.join(sectors) if sectors else 'None',
                ),
            }
            for criterion in criteria:
                value, raw_value = values[criterion.name]
                _, created = BeneficiaryIndicator.objects.update_or_create(
                    beneficiary=beneficiary,
                    criterion=criterion,
                    defaults={'value': value, 'raw_value': raw_value, 'encoded_by': official},
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
        return created_count, updated_count

    def ensure_cycle(self, official, slots):
        cycle, _ = ProgramCycle.objects.update_or_create(
            cycle_name='TUPAD Batobalani Test Cycle 2026',
            defaults={
                'start_date': date.today(),
                'end_date': date.today() + timedelta(days=30),
                'slots': slots,
                'max_per_household': 1,
                'created_by': official,
            },
        )
        return cycle

    def ensure_applications(self, cycle, official, target):
        created = 0
        eligible = Beneficiary.objects.filter(is_tupad_eligible=True).order_by('created_at')[:target]
        for beneficiary in eligible:
            _, was_created = CycleApplication.objects.get_or_create(
                beneficiary=beneficiary,
                cycle=cycle,
                defaults={'applied_by': official},
            )
            created += int(was_created)
        return created

    def ensure_participation(self, cycle, official):
        selected = CycleApplication.objects.filter(
            cycle=cycle,
            status=CycleApplication.STATUS_SELECTED,
        ).select_related('beneficiary')[:20]
        created = 0
        for index, application in enumerate(selected, start=1):
            if ParticipationRecord.objects.filter(
                beneficiary=application.beneficiary,
                cycle=cycle,
            ).exists():
                continue
            ParticipationRecord.objects.create(
                beneficiary=application.beneficiary,
                cycle=cycle,
                project_name=random.choice([
                    'Roadside Clearing',
                    'Barangay Hall Maintenance',
                    'Drainage Clearing',
                    'Coastal Cleanup',
                ]),
                days_worked=random.randint(5, 10),
                participation_start=date.today() + timedelta(days=index % 5),
                participation_end=date.today() + timedelta(days=(index % 5) + random.randint(5, 10)),
                recorded_by=official,
            )
            created += 1
        return created

    def ensure_residents(self, cycle):
        selected = CycleApplication.objects.filter(
            cycle=cycle,
            status=CycleApplication.STATUS_SELECTED,
        ).select_related('beneficiary')[:5]
        created = 0
        for index, application in enumerate(selected, start=1):
            beneficiary = application.beneficiary
            user, was_created = User.objects.get_or_create(username=f'resident{index}')
            existing_link = User.objects.filter(beneficiary=beneficiary).exclude(pk=user.pk).first()
            if existing_link:
                user = existing_link
                was_created = False
            user.first_name = beneficiary.first_name
            user.middle_name = beneficiary.middle_name
            user.last_name = beneficiary.last_name
            user.role = User.ROLE_RESIDENT
            user.beneficiary = beneficiary
            user.is_active = True
            user.email = user.email or f'resident{index}@example.com'
            user.set_password('Resident12345')
            user.save()
            created += int(was_created)
        return created
