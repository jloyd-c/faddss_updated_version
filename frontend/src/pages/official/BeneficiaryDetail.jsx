import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { residentProfilesApi } from '../../api/beneficiaries'
import { SkeletonForm } from '../../components/common/Skeleton'

const EMPLOYMENT_LABELS = {
  unemployed: 'Unemployed',
  displaced_terminated: 'Displaced/Terminated',
  underemployed: 'Underemployed',
  self_employed_informal: 'Self-Employed/Informal',
  employed: 'Employed',
}
const EMPLOYMENT_COLOR = {
  unemployed: 'bg-red-100 text-red-700',
  displaced_terminated: 'bg-orange-100 text-orange-700',
  underemployed: 'bg-amber-100 text-amber-700',
  self_employed_informal: 'bg-blue-100 text-blue-700',
  employed: 'bg-emerald-100 text-emerald-700',
}
const HOUSING_LABELS = {
  makeshift: 'Makeshift / Informal Settler',
  semi_permanent: 'Semi-Permanent',
  permanent_deteriorating: 'Permanent but Deteriorating',
  permanent_good: 'Permanent Good Condition',
}
const SECTOR_LABELS = {
  PWD: 'Person with Disability (PWD)',
  SOLO_PARENT: 'Solo Parent',
  SENIOR: 'Senior Citizen (60+)',
  '4PS': '4Ps Beneficiary',
  IP: 'Indigenous People',
  YOUTH: 'Youth (15-30)',
  LACTATING: 'Lactating / Pregnant Mother',
  OFW: 'OFW Family Member',
}

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

function fmt(val, fallback = '—') {
  if (val === null || val === undefined || val === '') return fallback
  return val
}

function DetailSection({ title, number, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">{number}</span>
        <h2 className="text-sm font-bold text-ink-700 uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, mono = false }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-ink-400 self-center">{label}</span>
      <span className={`text-sm text-ink-800 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function BeneficiaryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    residentProfilesApi.get(id)
      .then(setData)
      .catch(() => setError('Failed to load resident profile.'))
  }, [id])

  if (error) return (
    <div className="max-w-3xl">
      <div className="alert-error">{error}</div>
    </div>
  )

  if (!data) return (
    <div className="max-w-3xl space-y-5">
      <div className="skeleton h-8 w-48" />
      <div className="card p-6"><SkeletonForm fields={6} /></div>
    </div>
  )

  const sectors = data.sectors ?? []

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/official/resident-profiles')} className="btn-ghost mb-3 -ml-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Resident Profiles
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
              {initials(data.full_name)}
            </div>
            <div>
              <p className="page-section-label">Barangay Operations</p>
              <h1 className="text-2xl font-bold text-ink-900">{data.full_name}</h1>
              <p className="mt-0.5 text-sm capitalize text-ink-500">
                {fmt(data.role)} · {data.household_code ?? 'No household'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {data.is_tupad_eligible ? (
              <span className="badge bg-emerald-100 text-emerald-700">TUPAD Eligible</span>
            ) : (
              <span className="badge bg-slate-100 text-ink-500">Not Eligible</span>
            )}
            <button
              onClick={() => navigate(`/official/resident-profiles/${id}/edit`)}
              className="btn-primary"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Section 1 – Household Assignment */}
      <DetailSection title="Household Assignment" number={1}>
        <Row label="Household" value={data.household_code} mono />
        <Row label="Family" value={data.family_detail ? `Family ${data.family_detail.family_number}` : null} />
        <Row label="Role in Household" value={data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : null} />
        <Row label="Household Head" value={data.is_household_head ? 'Yes' : 'No'} />
      </DetailSection>

      {/* Section 2 – Profile Information */}
      <DetailSection title="Profile Information" number={2}>
        <Row label="Full Name" value={data.full_name} />
        <Row label="Age" value={data.age != null ? `${data.age} years old` : null} />
        <Row label="Birthdate" value={data.birthdate} />
        <Row label="Gender" value={data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : null} />
        <Row label="Civil Status" value={data.civil_status ? data.civil_status.replace('_', '-').replace(/\b\w/g, (c) => c.toUpperCase()) : null} />
        <Row label="Contact Number" value={data.contact_number} />
        <Row label="Address" value={data.address} />
      </DetailSection>

      {/* Section 3 – Sector Membership */}
      <DetailSection title="Sector Membership" number={3}>
        {sectors.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No sector membership recorded.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <span key={s} className="badge bg-blue-50 text-blue-700 text-xs">{SECTOR_LABELS[s] ?? s}</span>
            ))}
          </div>
        )}
      </DetailSection>

      {/* Section 4 – TUPAD Indicators (only if eligible) */}
      {data.is_tupad_eligible && (
        <DetailSection title="TUPAD Socio-Economic Indicators" number={4}>
          <Row
            label="Employment Status"
            value={
              <span className={`badge ${EMPLOYMENT_COLOR[data.employment_status] ?? 'bg-slate-100 text-ink-600'}`}>
                {EMPLOYMENT_LABELS[data.employment_status] ?? data.employment_status}
              </span>
            }
          />
          <Row label="Monthly Income" value={data.monthly_income != null ? `₱${Number(data.monthly_income).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} />
          <Row label="Household Size" value={data.household_size} />
          <Row label="No. of Dependents" value={data.num_dependents} />
          <Row label="Housing Condition" value={HOUSING_LABELS[data.housing_condition] ?? data.housing_condition} />
        </DetailSection>
      )}
    </div>
  )
}


