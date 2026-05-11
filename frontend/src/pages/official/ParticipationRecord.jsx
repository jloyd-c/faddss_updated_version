import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { cyclesApi } from '../../api/cycles'

const EMPTY_FORM = {
  cycle: '',
  beneficiary: '',
  project_name: '',
  days_worked: '',
  participation_start: '',
  participation_end: '',
}

function validate(form) {
  const errors = {}
  if (!form.cycle) errors.cycle = 'Select a program cycle.'
  if (!form.beneficiary) errors.beneficiary = 'Select a beneficiary.'
  if (!form.project_name.trim()) errors.project_name = 'Project name is required.'
  if (!form.days_worked || isNaN(form.days_worked) || Number(form.days_worked) < 1)
    errors.days_worked = 'Days worked must be at least 1.'
  if (!form.participation_start) errors.participation_start = 'Start date is required.'
  if (!form.participation_end) errors.participation_end = 'End date is required.'
  if (
    form.participation_start &&
    form.participation_end &&
    form.participation_end < form.participation_start
  )
    errors.participation_end = 'End date must be on or after start date.'
  return errors
}

export default function ParticipationRecord() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [selectedApplicants, setSelectedApplicants] = useState([])
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [benSearch, setBenSearch] = useState('')
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    cycle: searchParams.get('cycle') || '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    cyclesApi.list()
      .then((d) => setCycles(d.results ?? d))
      .catch(() => setServerError('Failed to load cycles.'))
  }, [])

  useEffect(() => {
    if (!form.cycle) {
      setSelectedApplicants([])
      return
    }

    setApplicantsLoading(true)
    cyclesApi.listApplications(form.cycle)
      .then((d) => {
        const applications = d.results ?? d
        setSelectedApplicants(applications.filter((app) => app.status === 'selected'))
      })
      .catch(() => setServerError('Failed to load selected applicants for this cycle.'))
      .finally(() => setApplicantsLoading(false))
  }, [form.cycle])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'cycle' ? { beneficiary: '' } : {}),
    }))
    if (name === 'cycle') setBenSearch('')
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setServerError('')
    setSuccess('')
    const payload = {
      ...form,
      cycle: form.cycle,
      beneficiary: form.beneficiary,
      days_worked: Number(form.days_worked),
    }
    try {
      await cyclesApi.recordParticipation(payload)
      const cycleName = cycles.find((c) => String(c.id) === String(form.cycle))?.cycle_name ?? ''
      const beneName = selectedApplicants.find((app) => String(app.beneficiary) === String(form.beneficiary))?.beneficiary_name ?? ''
      setSuccess(`Participation recorded for ${beneName} under ${cycleName}.`)
      setBenSearch('')
      setForm((prev) => ({ ...EMPTY_FORM, cycle: prev.cycle }))
      setErrors({})
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const fieldErrors = {}
        for (const [k, v] of Object.entries(detail)) {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v
        }
        setErrors(fieldErrors)
      } else {
        setServerError('Failed to record participation. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const filteredApplicants = selectedApplicants.filter((app) =>
    app.beneficiary_name.toLowerCase().includes(benSearch.toLowerCase())
  )
  const selectedCycle = cycles.find((c) => String(c.id) === String(form.cycle))
  const selectedBeneficiary = selectedApplicants.find((app) => String(app.beneficiary) === String(form.beneficiary))
  const readyToRecord = Boolean(form.cycle && form.beneficiary)

  const backTarget = form.cycle
    ? `/official/cycles/${form.cycle}`
    : '/official/cycles'

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            onClick={() => navigate(backTarget)}
            className="btn-ghost mb-3 -ml-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <p className="page-section-label">Barangay Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Record Participation</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Log completed TUPAD participation for Resident Profiles selected in a program cycle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${form.cycle ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-ink-500'}`}>
            {form.cycle ? 'Cycle selected' : 'Choose cycle'}
          </span>
          <span className={`badge ${selectedApplicants.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {selectedApplicants.length} selected applicant{selectedApplicants.length === 1 ? '' : 's'}
          </span>
          <span className={`badge ${readyToRecord ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-ink-500'}`}>
            {readyToRecord ? 'Ready to record' : 'Awaiting resident profile'}
          </span>
        </div>
      </div>

      {serverError && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          {serverError}
        </div>
      )}
      {success && (
        <div className="alert-success">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <form onSubmit={handleSubmit} className="card">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-bold text-ink-900">Participation Details</h2>
            <p className="mt-0.5 text-xs text-ink-500">Records are insert-only after saving for audit integrity.</p>
          </div>

          <div className="space-y-5 p-5">
            <section className="space-y-3">
              <SectionTitle number="1" title="Choose Cycle" />
              <Field label="Program Cycle" error={errors.cycle}>
                <select
                  name="cycle"
                  value={form.cycle}
                  onChange={handleChange}
                  className={inp(errors.cycle)}
                >
                  <option value="">Select a cycle...</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{c.cycle_name}</option>
                  ))}
                </select>
              </Field>
              {selectedCycle && (
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-primary-100 text-primary-700">{selectedCycle.start_date} to {selectedCycle.end_date}</span>
                  <span className="badge bg-blue-100 text-blue-700">{selectedCycle.slots} slots</span>
                  <span className="badge bg-slate-100 text-ink-600">max {selectedCycle.max_per_household} per household</span>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle number="2" title="Select Resident Profile" />
              <Field label="Selected Applicant" error={errors.beneficiary}>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-3 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    placeholder={form.cycle ? 'Search selected applicants...' : 'Select a cycle first'}
                    value={benSearch}
                    onChange={(e) => setBenSearch(e.target.value)}
                    disabled={!form.cycle || applicantsLoading}
                    className={`${inp()} pl-9 disabled:bg-slate-100 disabled:text-ink-400`}
                  />
                </div>
                <div className={`mt-2 max-h-64 overflow-auto rounded-lg border ${
                  errors.beneficiary ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-white'
                }`}>
                  {!form.cycle && (
                    <EmptyPanel text="Select a cycle to see accepted applicants." />
                  )}
                  {form.cycle && applicantsLoading && (
                    <EmptyPanel text="Loading selected applicants..." />
                  )}
                  {form.cycle && !applicantsLoading && selectedApplicants.length === 0 && (
                    <EmptyPanel text="No selected applicants yet." />
                  )}
                  {form.cycle && !applicantsLoading && selectedApplicants.length > 0 && filteredApplicants.length === 0 && (
                    <EmptyPanel text="No selected applicant matches your search." />
                  )}
                  {filteredApplicants.map((app, index) => (
                    <button
                      type="button"
                      key={app.id}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, beneficiary: app.beneficiary }))
                        setErrors((prev) => ({ ...prev, beneficiary: undefined }))
                        setSuccess('')
                      }}
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                        String(form.beneficiary) === String(app.beneficiary) ? 'bg-primary-50' : ''
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        String(form.beneficiary) === String(app.beneficiary) ? 'bg-primary-600 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {app.rank_position ?? index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">{app.beneficiary_name}</span>
                        <span className="text-xs text-ink-400">Selected applicant</span>
                      </span>
                      {String(form.beneficiary) === String(app.beneficiary) && (
                        <span className="badge bg-primary-100 text-primary-700">Chosen</span>
                      )}
                    </button>
                  ))}
                </div>
                {form.cycle && !applicantsLoading && selectedApplicants.length === 0 && (
                  <div className="alert-warning mt-2 py-2 text-xs">
                    No selected applicants yet for this cycle. Run scoring and ranking first, then record participation.
                  </div>
                )}
              </Field>
            </section>

            <section className="space-y-3">
              <SectionTitle number="3" title="Work Record" />
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                <Field label="Project Name" error={errors.project_name}>
                  <input
                    name="project_name"
                    value={form.project_name}
                    onChange={handleChange}
                    className={inp(errors.project_name)}
                    placeholder="e.g. Road Clearing Project"
                  />
                </Field>

                <Field label="Days Worked" error={errors.days_worked}>
                  <input
                    name="days_worked"
                    type="number"
                    min="1"
                    value={form.days_worked}
                    onChange={handleChange}
                    className={inp(errors.days_worked)}
                    placeholder="0"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Participation Start" error={errors.participation_start}>
                  <input
                    name="participation_start"
                    type="date"
                    value={form.participation_start}
                    onChange={handleChange}
                    className={inp(errors.participation_start)}
                  />
                </Field>
                <Field label="Participation End" error={errors.participation_end}>
                  <input
                    name="participation_end"
                    type="date"
                    value={form.participation_end}
                    onChange={handleChange}
                    className={inp(errors.participation_end)}
                  />
                </Field>
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary justify-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                      <path d="M21 12a9 9 0 00-9-9" />
                    </svg>
                    Recording...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Record Participation
                  </>
                )}
              </button>
              <p className="text-xs text-ink-400">Saved participation records cannot be edited or deleted.</p>
            </div>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Current Selection</h2>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Cycle" value={selectedCycle?.cycle_name || 'No cycle selected'} active={Boolean(selectedCycle)} />
              <SummaryRow label="Resident Profile" value={selectedBeneficiary?.beneficiary_name || 'No resident profile selected'} active={Boolean(selectedBeneficiary)} />
              <SummaryRow label="Selected pool" value={`${selectedApplicants.length} accepted applicant${selectedApplicants.length === 1 ? '' : 's'}`} active={selectedApplicants.length > 0} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Recording Rule</h2>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-800">Selected applicants only</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Participation can be recorded only after applicants are marked selected by scoring and ranking.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function SectionTitle({ number, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
        {number}
      </span>
      <h2 className="text-sm font-bold text-ink-900">{title}</h2>
    </div>
  )
}

function SummaryRow({ label, value, active }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${active ? 'text-ink-900' : 'text-ink-400'}`}>{value}</p>
    </div>
  )
}

function EmptyPanel({ text }) {
  return (
    <div className="px-5 py-8 text-center text-sm text-ink-400">
      {text}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function inp(error) {
  return `form-input ${error ? 'form-input-error' : ''}`
}

