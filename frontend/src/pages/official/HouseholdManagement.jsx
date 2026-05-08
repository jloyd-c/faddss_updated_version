import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { householdsApi, familiesApi } from '../../api/beneficiaries'
import Pagination from '../../components/common/Pagination'
import { Skeleton } from '../../components/common/Skeleton'

const INCOME_BRACKET_LABELS = {
  NO_INCOME: 'No Income',
  BELOW_5K: 'Below PHP 5,000',
  '5K_10K': 'PHP 5,000 - PHP 10,000',
  '10K_20K': 'PHP 10,000 - PHP 20,000',
  '20K_30K': 'PHP 20,000 - PHP 30,000',
  '30K_50K': 'PHP 30,000 - PHP 50,000',
  ABOVE_50K: 'Above PHP 50,000',
  UNSPECIFIED: 'Unspecified',
}

const INCOME_BRACKET_OPTIONS = Object.entries(INCOME_BRACKET_LABELS)

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'VACANT', label: 'Vacant' },
  { value: 'ABANDONED', label: 'Abandoned' },
  { value: 'DEMOLISHED', label: 'Demolished' },
]

const STATUS_BADGE = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  VACANT: 'bg-yellow-100 text-yellow-700',
  ABANDONED: 'bg-orange-100 text-orange-700',
  DEMOLISHED: 'bg-red-100 text-red-700',
}

const EMPTY_HH = { household_code: '', address: '', status: 'ACTIVE', purok: '', latitude: '', longitude: '', notes: '' }
const EMPTY_FAM = { household: '', monthly_income_bracket: 'UNSPECIFIED' }

export default function HouseholdManagement() {
  const navigate = useNavigate()
  const [households, setHouseholds] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const [selectedHH, setSelectedHH] = useState(null)
  const [families, setFamilies] = useState([])
  const [familiesLoading, setFamiliesLoading] = useState(false)

  const [hhForm, setHhForm] = useState(EMPTY_HH)
  const [hhErrors, setHhErrors] = useState({})
  const [hhSaving, setHhSaving] = useState(false)
  const [showHhForm, setShowHhForm] = useState(false)

  const [famForm, setFamForm] = useState(EMPTY_FAM)
  const [famErrors, setFamErrors] = useState({})
  const [famSaving, setFamSaving] = useState(false)
  const [showFamForm, setShowFamForm] = useState(false)

  const loadHouseholds = (nextPage = page, query = search) => {
    setLoading(true)
    setError('')
    householdsApi.list({ search: query.trim(), page: nextPage })
      .then((d) => {
        const rows = d.results ?? d
        setHouseholds(rows)
        setMeta(d.results ? d : null)
        setPage(nextPage)
        if (selectedHH) {
          const freshSelected = rows.find((hh) => hh.id === selectedHH.id)
          if (freshSelected) setSelectedHH(freshSelected)
        }
      })
      .catch(() => setError('Failed to load households.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(() => loadHouseholds(1, search), 250)
    return () => clearTimeout(timer)
  }, [search])

  const loadFamilies = (hhId) => {
    setFamiliesLoading(true)
    familiesApi.list({ household: hhId })
      .then((d) => setFamilies(d.results ?? d))
      .catch(() => setError('Failed to load families.'))
      .finally(() => setFamiliesLoading(false))
  }

  const selectHH = (hh) => {
    setSelectedHH(hh)
    loadFamilies(hh.id)
    setShowFamForm(false)
    setFamForm({ ...EMPTY_FAM, household: hh.id })
  }

  const handleHhChange = (e) => {
    const { name, value } = e.target
    setHhForm((p) => ({ ...p, [name]: value }))
    setHhErrors((p) => ({ ...p, [name]: undefined }))
  }

  const submitHousehold = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!hhForm.household_code.trim()) errs.household_code = 'Household code is required.'
    if (!hhForm.address.trim()) errs.address = 'Address is required.'
    if (Object.keys(errs).length) { setHhErrors(errs); return }

    setHhSaving(true)
    setError('')
    try {
      const payload = {
        ...hhForm,
        latitude: hhForm.latitude !== '' ? Number(hhForm.latitude) : null,
        longitude: hhForm.longitude !== '' ? Number(hhForm.longitude) : null,
      }
      await householdsApi.create(payload)
      setShowHhForm(false)
      setHhForm(EMPTY_HH)
      loadHouseholds(1, search)
    } catch (err) {
      const d = err.response?.data
      if (typeof d === 'object') {
        const fe = {}
        for (const [k, v] of Object.entries(d)) fe[k] = Array.isArray(v) ? v[0] : v
        setHhErrors(fe)
      } else {
        setError('Failed to create household.')
      }
    } finally {
      setHhSaving(false)
    }
  }

  const handleFamChange = (e) => {
    const { name, value } = e.target
    setFamForm((p) => ({ ...p, [name]: value }))
    setFamErrors((p) => ({ ...p, [name]: undefined }))
  }

  const submitFamily = async (e) => {
    e.preventDefault()
    if (!selectedHH) return
    setFamSaving(true)
    setError('')
    try {
      await familiesApi.create({ ...famForm, household: selectedHH.id })
      setShowFamForm(false)
      setFamForm({ ...EMPTY_FAM, household: selectedHH.id })
      loadFamilies(selectedHH.id)
      loadHouseholds(page, search)
    } catch (err) {
      const d = err.response?.data
      if (typeof d === 'object') {
        const fe = {}
        for (const [k, v] of Object.entries(d)) fe[k] = Array.isArray(v) ? v[0] : v
        setFamErrors(fe)
      } else {
        setError('Failed to create family.')
      }
    } finally {
      setFamSaving(false)
    }
  }

  const activeCount = households.filter((hh) => hh.status === 'ACTIVE').length
  const familyCountOnPage = households.reduce((sum, hh) => sum + (hh.family_count ?? 0), 0)

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-section-label">Barangay Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Households & Families</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Manage household records first, then add family groups before encoding individual beneficiaries.
          </p>
        </div>
        <button onClick={() => setShowHhForm((v) => !v)} className="btn-primary shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {showHhForm ? <path d="M18 6L6 18M6 6l12 12" /> : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
          </svg>
          {showHhForm ? 'Close Form' : 'New Household'}
        </button>
      </div>

      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Households Found" value={meta?.count ?? households.length} color="primary" />
        <MetricCard label="Active On Page" value={activeCount} color="emerald" />
        <MetricCard label="Families On Page" value={familyCountOnPage} color="blue" />
      </div>

      {showHhForm && (
        <form onSubmit={submitHousehold} className="card">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-bold text-ink-900">New Household</h2>
            <p className="mt-0.5 text-xs text-ink-500">Create the household location and status record.</p>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <Field label="Household Code" error={hhErrors.household_code}>
              <input name="household_code" value={hhForm.household_code} onChange={handleHhChange} className={inp(hhErrors.household_code)} placeholder="BATO-HH-001" />
            </Field>
            <Field label="Status" error={hhErrors.status}>
              <select name="status" value={hhForm.status} onChange={handleHhChange} className={inp(hhErrors.status)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Address" error={hhErrors.address}>
              <textarea name="address" value={hhForm.address} onChange={handleHhChange} rows={3} className={inp(hhErrors.address)} placeholder="Street, purok, barangay" />
            </Field>
            <div className="space-y-4">
              <Field label="Purok / Sitio" error={hhErrors.purok} hint="Optional">
                <input name="purok" value={hhForm.purok} onChange={handleHhChange} className={inp(hhErrors.purok)} placeholder="Purok 1" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Latitude" error={hhErrors.latitude} hint="Optional">
                  <input name="latitude" type="number" step="any" value={hhForm.latitude} onChange={handleHhChange} className={inp(hhErrors.latitude)} placeholder="14.076" />
                </Field>
                <Field label="Longitude" error={hhErrors.longitude} hint="Optional">
                  <input name="longitude" type="number" step="any" value={hhForm.longitude} onChange={handleHhChange} className={inp(hhErrors.longitude)} placeholder="122.785" />
                </Field>
              </div>
            </div>
            <div className="lg:col-span-2">
              <Field label="Notes" error={hhErrors.notes} hint="Optional">
                <textarea name="notes" value={hhForm.notes} onChange={handleHhChange} rows={2} className={inp(hhErrors.notes)} placeholder="Additional household information" />
              </Field>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
            <button type="submit" disabled={hhSaving} className="btn-primary justify-center">
              {hhSaving ? 'Saving...' : 'Add Household'}
            </button>
            <button type="button" onClick={() => setShowHhForm(false)} className="btn-secondary justify-center">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section className="space-y-4">
          <div className="card p-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search household code or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : households.length === 0 ? (
              <EmptyPanel title="No households found" text="Create a household before adding families and beneficiaries." />
            ) : (
              <div className="divide-y divide-slate-100">
                {households.map((hh) => (
                  <button
                    key={hh.id}
                    onClick={() => selectHH(hh)}
                    className={`w-full px-4 py-4 text-left transition hover:bg-slate-50 ${
                      selectedHH?.id === hh.id ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink-900">{hh.household_code}</p>
                          <span className={`badge ${STATUS_BADGE[hh.status] ?? 'bg-slate-100 text-ink-600'}`}>{hh.status}</span>
                        </div>
                        <p className="mt-1 truncate text-sm text-ink-500">{hh.address}</p>
                        {hh.purok && <p className="mt-0.5 text-xs text-ink-400">{hh.purok}</p>}
                      </div>
                      <span className="badge shrink-0 bg-slate-100 text-ink-600">
                        {hh.family_count} {hh.family_count === 1 ? 'family' : 'families'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Pagination meta={meta} page={page} onPageChange={(next) => loadHouseholds(next, search)} label="households" />
          </div>
        </section>

        <aside className="space-y-4">
          {selectedHH ? (
            <>
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-ink-900">{selectedHH.household_code}</h2>
                    <p className="mt-1 text-sm text-ink-500">{selectedHH.address}</p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[selectedHH.status] ?? 'bg-slate-100 text-ink-600'}`}>{selectedHH.status}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <SummaryRow label="Purok / Sitio" value={selectedHH.purok || 'Not specified'} />
                  <SummaryRow label="Families" value={`${selectedHH.family_count ?? families.length} family group${(selectedHH.family_count ?? families.length) === 1 ? '' : 's'}`} />
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div>
                    <h2 className="text-base font-bold text-ink-900">Families</h2>
                    <p className="mt-0.5 text-xs text-ink-500">Family groups inside selected household.</p>
                  </div>
                  <button onClick={() => setShowFamForm((v) => !v)} className="btn-secondary px-3 py-1.5 text-xs">
                    {showFamForm ? 'Cancel' : 'Add Family'}
                  </button>
                </div>

                {showFamForm && (
                  <form onSubmit={submitFamily} className="border-b border-slate-200 p-4">
                    <Field label="Monthly Income Bracket" error={famErrors.monthly_income_bracket}>
                      <select name="monthly_income_bracket" value={famForm.monthly_income_bracket} onChange={handleFamChange} className={inp(famErrors.monthly_income_bracket)}>
                        {INCOME_BRACKET_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </Field>
                    <button type="submit" disabled={famSaving} className="btn-primary mt-3 w-full justify-center">
                      {famSaving ? 'Saving...' : 'Add Family'}
                    </button>
                  </form>
                )}

                {familiesLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : families.length === 0 ? (
                  <EmptyPanel title="No families yet" text="Add a family group before adding beneficiaries." />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {families.map((f) => (
                      <div key={f.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">Family {f.family_number}</p>
                            <p className="mt-0.5 text-xs text-ink-500">{INCOME_BRACKET_LABELS[f.monthly_income_bracket]}</p>
                          </div>
                          <span className="badge bg-primary-100 text-primary-700">{f.member_count} members</span>
                        </div>
                        <button
                          onClick={() => navigate(`/official/beneficiaries?family=${f.id}`)}
                          className="mt-2 text-xs font-semibold text-primary-600 transition hover:text-primary-800"
                        >
                          View members
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                </svg>
              </div>
              <h2 className="mt-3 text-base font-bold text-ink-900">Select a household</h2>
              <p className="mt-1 text-sm text-ink-500">Choose a household from the list to view or add family groups.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }) {
  const colors = {
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  )
}

function EmptyPanel({ title, text }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold text-ink-600">{title}</p>
      <p className="mt-1 text-xs text-ink-400">{text}</p>
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
