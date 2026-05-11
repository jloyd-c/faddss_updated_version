import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { SkeletonProfile } from '../../components/common/Skeleton'

const EMPLOYMENT_LABELS = { unemployed: 'Unemployed', displaced_terminated: 'Displaced/Terminated', underemployed: 'Underemployed', self_employed_informal: 'Self-Employed/Informal', employed: 'Employed' }
const ROLE_LABELS = { head: 'Head', spouse: 'Spouse', child: 'Child', parent: 'Parent', sibling: 'Sibling', relative: 'Relative' }
const HOUSING_LABELS = { makeshift: 'Makeshift/Informal Settler', semi_permanent: 'Semi-Permanent', permanent_deteriorating: 'Permanent but Deteriorating', permanent_good: 'Permanent Good Condition' }
const CIVIL_STATUS_LABELS = { single: 'Single', married: 'Married', widowed: 'Widowed', separated: 'Separated', live_in: 'Live-in' }
const GENDER_LABELS = { male: 'Male', female: 'Female', other: 'Other' }
const INCOME_BRACKET_LABELS = { UNSPECIFIED: 'Unspecified', NO_INCOME: 'No Income', BELOW_5K: 'Below PHP 5,000', '5K_10K': 'PHP 5,000 - PHP 10,000', '10K_20K': 'PHP 10,000 - PHP 20,000', '20K_30K': 'PHP 20,000 - PHP 30,000', '30K_50K': 'PHP 30,000 - PHP 50,000', ABOVE_50K: 'Above PHP 50,000' }

function fallback(value) {
  return value || '--'
}

function money(value) {
  return `PHP ${Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export default function ResidentProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/resident-profiles/me/')
      .then((r) => setProfile(r.data))
      .catch(() => setError('Failed to load your profile. Please try again later.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-5xl space-y-5">
      <div className="skeleton h-28 w-full" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6"><SkeletonProfile /></div>
        <div className="card p-6"><SkeletonProfile /></div>
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-3xl">
      <div className="alert-error">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
        </svg>
        {error}
      </div>
    </div>
  )

  if (!profile) return null

  const initials = profile.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="max-w-5xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 shadow-lift">
        <div className="p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-primary-100">
                {initials}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-300">Resident Portal</p>
                <h1 className="mt-0.5 text-2xl font-bold">{profile.full_name}</h1>
                <p className="mt-1 text-sm text-primary-100/75">
                  {profile.household_code ? `Household ${profile.household_code}` : 'Resident profile'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${profile.is_tupad_eligible ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-primary-200'}`}>
                {profile.is_tupad_eligible ? 'TUPAD Eligible' : 'Not Eligible'}
              </span>
              {profile.role && <span className="badge bg-white/10 text-primary-200">{ROLE_LABELS[profile.role] ?? profile.role}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <section className="space-y-5">
          <ProfileSection title="Personal Information" icon={<UserIcon />}>
            <Row label="Full Name" value={profile.full_name} />
            <Row label="Address" value={fallback(profile.address)} />
            <Row label="Birthdate" value={fallback(profile.birthdate)} />
            <Row label="Age" value={profile.age != null ? `${profile.age} years old` : '--'} />
            <Row label="Gender" value={GENDER_LABELS[profile.gender] ?? profile.gender ?? '--'} />
            <Row label="Civil Status" value={CIVIL_STATUS_LABELS[profile.civil_status] ?? profile.civil_status ?? '--'} />
            <Row label="Contact Number" value={fallback(profile.contact_number)} />
          </ProfileSection>

          <ProfileSection title="TUPAD Socio-Economic Indicators" icon={<ScoreIcon />}>
            <Row label="Monthly Income" value={money(profile.monthly_income)} />
            <Row label="Employment Status" value={EMPLOYMENT_LABELS[profile.employment_status] ?? profile.employment_status ?? '--'} />
            <Row label="Household Size" value={profile.household_size ?? '--'} />
            <Row label="No. of Dependents" value={profile.num_dependents ?? '--'} />
            <Row label="Housing Condition" value={HOUSING_LABELS[profile.housing_condition] ?? profile.housing_condition ?? '--'} />
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="w-44 shrink-0 text-sm text-ink-500">Sector Membership</dt>
              <dd className="flex flex-wrap justify-end gap-1">
                {(profile.sectors ?? []).length === 0
                  ? <span className="text-sm text-ink-300">--</span>
                  : (profile.sectors ?? []).map((s) => <span key={s} className="badge bg-blue-100 text-blue-700">{s}</span>)
                }
              </dd>
            </div>
          </ProfileSection>
        </section>

        <aside className="space-y-5">
          {(profile.household_code || profile.family_detail) && (
            <ProfileSection title="Household Information" icon={<HouseIcon />}>
              {profile.household_code && <Row label="Household Code" value={<span className="font-mono">{profile.household_code}</span>} />}
              {profile.family_detail && (
                <>
                  <Row label="Family No." value={`Family ${profile.family_detail.family_number}`} />
                  <Row label="Income Bracket" value={INCOME_BRACKET_LABELS[profile.family_detail.monthly_income_bracket] ?? profile.family_detail.monthly_income_bracket} />
                </>
              )}
            </ProfileSection>
          )}

          <div className={`rounded-lg border px-4 py-3 ${profile.is_tupad_eligible ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-sm font-semibold ${profile.is_tupad_eligible ? 'text-emerald-800' : 'text-ink-700'}`}>
              {profile.is_tupad_eligible ? 'Eligible for TUPAD application' : 'Not currently eligible for TUPAD application'}
            </p>
            <p className={`mt-1 text-xs leading-5 ${profile.is_tupad_eligible ? 'text-emerald-700' : 'text-ink-500'}`}>
              Eligibility is based on age: the resident must be 18 years old or above.
            </p>
          </div>

          <p className="text-xs leading-5 text-ink-400">
            This profile is encoded by barangay officials. Contact the barangay hall to request corrections.
          </p>
        </aside>
      </div>
    </div>
  )
}

function ProfileSection({ title, icon, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
        <span className="text-primary-600">{icon}</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-600">{title}</h2>
      </div>
      <dl className="divide-y divide-slate-100 px-5">{children}</dl>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="w-44 shrink-0 text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-900">{value}</dd>
    </div>
  )
}

function UserIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}

function HouseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}

function ScoreIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
}

