import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { beneficiariesApi, householdsApi, familiesApi } from '../../api/beneficiaries'
import { SkeletonForm } from '../../components/common/Skeleton'

const EMPTY_FORM = {
  family: '', role: '', is_household_head: false,
  first_name: '', middle_name: '', last_name: '',
  address: '', birthdate: '', gender: '', civil_status: '',
  contact_number: '', sectors: [], monthly_income: '', employment_status: '',
  household_size: '', num_dependents: '', housing_condition: '',
}

function buildFullName(first, middle, last) {
  return [first, middle, last].map((s) => s.trim()).filter(Boolean).join(' ')
}

function splitFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first_name: '', middle_name: '', last_name: '' }
  if (parts.length === 1) return { first_name: parts[0], middle_name: '', last_name: '' }
  if (parts.length === 2) return { first_name: parts[0], middle_name: '', last_name: parts[1] }
  return { first_name: parts[0], middle_name: parts.slice(1, -1).join(' '), last_name: parts[parts.length - 1] }
}

const SECTOR_OPTIONS = [
  { value: 'PWD', label: 'Person with Disability (PWD)' },
  { value: 'SOLO_PARENT', label: 'Solo Parent' },
  { value: 'SENIOR', label: 'Senior Citizen (60+)' },
  { value: '4PS', label: '4Ps Beneficiary' },
  { value: 'IP', label: 'Indigenous People' },
  { value: 'YOUTH', label: 'Youth (15-30)' },
  { value: 'LACTATING', label: 'Lactating / Pregnant Mother' },
  { value: 'OFW', label: 'OFW Family Member' },
]
const ROLE_OPTIONS = [
  { value: 'head', label: 'Head' }, { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' }, { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' }, { value: 'relative', label: 'Relative' },
]
const GENDER_OPTIONS = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]
const CIVIL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' }, { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' }, { value: 'separated', label: 'Separated' }, { value: 'live_in', label: 'Live-in' },
]
const EMPLOYMENT_OPTIONS = [
  { value: 'unemployed', label: 'Unemployed' }, { value: 'displaced_terminated', label: 'Displaced/Terminated' },
  { value: 'underemployed', label: 'Underemployed' }, { value: 'self_employed_informal', label: 'Self-Employed/Informal' }, { value: 'employed', label: 'Employed' },
]
const HOUSING_OPTIONS = [
  { value: 'makeshift', label: 'Makeshift/Informal Settler' }, { value: 'semi_permanent', label: 'Semi-Permanent' },
  { value: 'permanent_deteriorating', label: 'Permanent but Deteriorating' }, { value: 'permanent_good', label: 'Permanent Good Condition' },
]

function computeAgeFromBirthdate(birthdate) {
  if (!birthdate) return null
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function computeEligible(birthdate, role) {
  const age = computeAgeFromBirthdate(birthdate)
  return age !== null && age >= 18 && role !== 'child'
}

function eligibilityMessage(birthdate, role) {
  const age = computeAgeFromBirthdate(birthdate)
  if (age === null || !role) return 'Complete birthdate and role to check TUPAD eligibility.'
  if (age < 18) return 'Not eligible for TUPAD application because the beneficiary is below 18 years old.'
  if (role === 'child') return 'Not eligible for TUPAD application because role is marked as child.'
  return 'Eligible for TUPAD application. Socio-economic indicators are required for scoring.'
}

function validate(form) {
  const errors = {}
  if (!form.family) errors.family = 'Select the family this beneficiary belongs to.'
  if (!form.role) errors.role = 'Select role.'
  if (!form.first_name.trim()) errors.first_name = 'First name is required.'
  if (!form.last_name.trim()) errors.last_name = 'Last name is required.'
  if (!form.birthdate) errors.birthdate = 'Birthdate is required.'
  if (!form.gender) errors.gender = 'Select gender.'
  if (!form.civil_status) errors.civil_status = 'Select civil status.'
  if (computeEligible(form.birthdate, form.role)) {
    if (!form.employment_status) errors.employment_status = 'Select employment status.'
    if (form.monthly_income === '' || isNaN(form.monthly_income) || Number(form.monthly_income) < 0)
      errors.monthly_income = 'Enter a valid monthly income.'
    if (!form.household_size || isNaN(form.household_size) || Number(form.household_size) < 1)
      errors.household_size = 'Household size must be at least 1.'
    if (form.num_dependents === '' || isNaN(form.num_dependents) || Number(form.num_dependents) < 0)
      errors.num_dependents = 'Enter number of dependents (0 or more).'
    if (!form.housing_condition) errors.housing_condition = 'Select housing condition.'
  }
  return errors
}

export default function BeneficiaryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  const [households, setHouseholds] = useState([])
  const [families, setFamilies] = useState([])
  const [selectedHousehold, setSelectedHousehold] = useState('')
  const [hhRefreshing, setHhRefreshing] = useState(false)
  const [famRefreshing, setFamRefreshing] = useState(false)

  const fetchHouseholds = () => {
    setHhRefreshing(true)
    householdsApi.list({ no_page: 'true' })
      .then((d) => setHouseholds(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(() => {})
      .finally(() => setHhRefreshing(false))
  }

  const fetchFamilies = (householdId) => {
    if (!householdId) { setFamilies([]); return }
    setFamRefreshing(true)
    familiesApi.list({ household: householdId })
      .then((d) => setFamilies(d.results ?? d))
      .catch(() => {})
      .finally(() => setFamRefreshing(false))
  }

  useEffect(() => { fetchHouseholds() }, [])

  useEffect(() => { fetchFamilies(selectedHousehold) }, [selectedHousehold])

  useEffect(() => {
    if (!isEdit) return
    beneficiariesApi.get(id)
      .then((data) => {
        if (data.family_detail?.household) setSelectedHousehold(String(data.family_detail.household))
        const { first_name, middle_name, last_name } = splitFullName(data.full_name)
        setForm({
          family: data.family ? String(data.family) : '',
          role: data.role ?? '',
          is_household_head: data.is_household_head ?? false,
          first_name, middle_name, last_name,
          address: data.address ?? '', birthdate: data.birthdate ?? '',
          gender: data.gender ?? '', civil_status: data.civil_status ?? '', contact_number: data.contact_number ?? '',
          sectors: data.sectors ?? [], monthly_income: String(data.monthly_income ?? ''),
          employment_status: data.employment_status ?? '', household_size: String(data.household_size ?? ''),
          num_dependents: String(data.num_dependents ?? '0'), housing_condition: data.housing_condition ?? '',
        })
      })
      .catch(() => setServerError('Failed to load beneficiary data.'))
      .finally(() => setFetching(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }
  const handleHouseholdChange = (e) => { setSelectedHousehold(e.target.value); setForm((prev) => ({ ...prev, family: '' })) }
  const toggleSector = (code) => {
    setForm((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(code) ? prev.sectors.filter((s) => s !== code) : [...prev.sectors, code],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setLoading(true)
    setServerError('')
    const eligible = computeEligible(form.birthdate, form.role)
    const payload = {
      ...form,
      full_name: buildFullName(form.first_name, form.middle_name, form.last_name),
      family: form.family,
      household_size: eligible ? Number(form.household_size) : 1,
      num_dependents: eligible ? Number(form.num_dependents) : 0,
      monthly_income: eligible ? Number(form.monthly_income) : 0,
      employment_status: eligible ? form.employment_status : 'unemployed',
      housing_condition: eligible ? form.housing_condition : 'makeshift',
    }
    try {
      if (isEdit) await beneficiariesApi.update(id, payload)
      else await beneficiariesApi.create(payload)
      navigate('/official/beneficiaries')
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const fieldErrors = {}
        for (const [key, val] of Object.entries(detail)) fieldErrors[key] = Array.isArray(val) ? val[0] : val
        setErrors(fieldErrors)
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const computedAge = computeAgeFromBirthdate(form.birthdate)
  const isEligible = computeEligible(form.birthdate, form.role)
  const eligibleMessage = eligibilityMessage(form.birthdate, form.role)

  if (fetching) return (
    <div className="max-w-2xl space-y-5">
      <div className="skeleton h-8 w-48" />
      <div className="card p-6"><SkeletonForm fields={6} /></div>
    </div>
  )

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/official/beneficiaries')} className="btn-ghost mb-3 -ml-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <p className="page-section-label">Barangay Operations</p>
          <h1 className="text-2xl font-bold text-ink-900">{isEdit ? 'Edit Beneficiary' : 'Add Beneficiary'}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Encode the resident profile, household assignment, sector membership, and scoring indicators used by TUPAD selection.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="alert-error mb-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}

      <div className={`rounded-lg border px-4 py-3 ${
        isEligible ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-ink-600'
      }`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{isEligible ? 'TUPAD Eligible' : 'Eligibility Check'}</p>
            <p className="mt-0.5 text-xs leading-5">{eligibleMessage}</p>
          </div>
          <span className={`badge shrink-0 ${isEligible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-ink-500'}`}>
            {computedAge !== null ? `${computedAge} years old` : 'Age pending'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Household Assignment */}
        <FormSection title="Household Assignment" number={1}>
          <Field label="Household" error={errors.household}>
            <div className="flex gap-2">
              <select value={selectedHousehold} onChange={handleHouseholdChange} className={`${inp(errors.household)} flex-1`}>
                <option value="">Select household...</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.household_code} — {h.address?.slice(0, 50)}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchHouseholds}
                disabled={hhRefreshing}
                className="btn-secondary shrink-0 px-2.5"
                title="Refresh household list"
              >
                <svg className={hhRefreshing ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>
          </Field>
          {selectedHousehold && (
            <Field label="Family" error={errors.family}>
              <div className="flex gap-2">
                <select name="family" value={form.family} onChange={handleChange} className={`${inp(errors.family)} flex-1`}>
                  <option value="">Select family...</option>
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>Family {f.family_number} ({f.monthly_income_bracket})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fetchFamilies(selectedHousehold)}
                  disabled={famRefreshing}
                  className="btn-secondary shrink-0 px-2.5"
                  title="Refresh family list"
                >
                  <svg className={famRefreshing ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role in Household" error={errors.role}>
              <select name="role" value={form.role} onChange={handleChange} className={inp(errors.role)}>
                <option value="">Select...</option>
                {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" name="is_household_head" checked={form.is_household_head} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 accent-primary-600" />
                <span className="text-sm font-medium text-ink-700">Household Head</span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* Profile Information */}
        <FormSection title="Profile Information" number={2}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="First Name" error={errors.first_name}>
              <input name="first_name" value={form.first_name} onChange={handleChange} className={inp(errors.first_name)} placeholder="Juan" />
            </Field>
            <Field label="Middle Name" hint="Optional">
              <input name="middle_name" value={form.middle_name} onChange={handleChange} className="form-input" placeholder="Santos" />
            </Field>
            <Field label="Last Name" error={errors.last_name}>
              <input name="last_name" value={form.last_name} onChange={handleChange} className={inp(errors.last_name)} placeholder="Dela Cruz" />
            </Field>
          </div>
          <Field label="Address (if different from household)" error={errors.address}>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2} className={inp(errors.address)} placeholder="Purok, Barangay Batobalani, Paracale, CamNorte" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Birthdate" error={errors.birthdate}>
              <input name="birthdate" type="date" value={form.birthdate} onChange={handleChange} className={inp(errors.birthdate)} />
            </Field>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Age (auto-computed)</label>
              <div className="form-input bg-slate-50 text-ink-600 cursor-default">
                {computedAge !== null ? `${computedAge} years old` : '--'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gender" error={errors.gender}>
              <select name="gender" value={form.gender} onChange={handleChange} className={inp(errors.gender)}>
                <option value="">Select...</option>
                {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Civil Status" error={errors.civil_status}>
              <select name="civil_status" value={form.civil_status} onChange={handleChange} className={inp(errors.civil_status)}>
                <option value="">Select...</option>
                {CIVIL_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Contact Number (optional)" error={errors.contact_number}>
            <input name="contact_number" value={form.contact_number} onChange={handleChange} className={inp(errors.contact_number)} placeholder="09XXXXXXXXX" />
          </Field>
        </FormSection>

        {/* Sector Membership */}
        <FormSection
          title="Sector Membership"
          number={3}
          badge={
            <span className={`badge ${isEligible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-ink-500'}`}>
              {isEligible ? 'TUPAD Eligible' : 'Not Eligible'}
            </span>
          }
        >
          <p className="text-xs text-ink-400">Select all sectors that apply. Multiple selections allowed.</p>
          <div className="grid grid-cols-2 gap-2">
            {SECTOR_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition ${
                  form.sectors.includes(value)
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.sectors.includes(value)}
                  onChange={() => toggleSector(value)}
                  className="h-4 w-4 rounded border-slate-300 accent-primary-600"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </FormSection>

        {/* TUPAD Socio-Economic Indicators */}
        {isEligible && (
          <FormSection title="TUPAD Socio-Economic Indicators" number={4}>
            <Field label="Employment Status" error={errors.employment_status}>
              <select name="employment_status" value={form.employment_status} onChange={handleChange} className={inp(errors.employment_status)}>
                <option value="">Select...</option>
                {EMPLOYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Monthly Income (PHP)" error={errors.monthly_income}>
              <input name="monthly_income" type="number" min="0" step="0.01" value={form.monthly_income} onChange={handleChange} className={inp(errors.monthly_income)} placeholder="0.00" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Household Size" error={errors.household_size}>
                <input name="household_size" type="number" min="1" value={form.household_size} onChange={handleChange} className={inp(errors.household_size)} />
              </Field>
              <Field label="Number of Dependents" error={errors.num_dependents}>
                <input name="num_dependents" type="number" min="0" value={form.num_dependents} onChange={handleChange} className={inp(errors.num_dependents)} />
              </Field>
            </div>
            <Field label="Housing Condition" error={errors.housing_condition}>
              <select name="housing_condition" value={form.housing_condition} onChange={handleChange} className={inp(errors.housing_condition)}>
                <option value="">Select...</option>
                {HOUSING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </FormSection>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                  <path d="M21 12a9 9 0 00-9-9" />
                </svg>
                Saving...
              </>
            ) : isEdit ? 'Save Changes' : 'Add Beneficiary'}
          </button>
          <button type="button" onClick={() => navigate('/official/beneficiaries')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}

function FormSection({ title, number, badge, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">{number}</span>
          <h2 className="text-sm font-bold text-ink-700 uppercase tracking-wider">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  )
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-semibold text-ink-700">{label}</label>
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function inp(error) {
  return `form-input ${error ? 'form-input-error' : ''}`
}
