import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cyclesApi } from '../../api/cycles'
import Pagination from '../../components/common/Pagination'
import { SkeletonTableRows } from '../../components/common/Skeleton'

const EMPTY_FORM = { cycle_name: '', start_date: '', end_date: '', slots: '', max_per_household: '1' }

function validate(form) {
  const errors = {}
  if (!form.cycle_name.trim()) errors.cycle_name = 'Cycle name is required.'
  if (!form.start_date) errors.start_date = 'Start date is required.'
  if (!form.end_date) errors.end_date = 'End date is required.'
  if (form.start_date && form.end_date && form.end_date < form.start_date)
    errors.end_date = 'End date must be after start date.'
  if (!form.slots || isNaN(form.slots) || Number(form.slots) < 1)
    errors.slots = 'Slots must be at least 1.'
  if (!form.max_per_household || isNaN(form.max_per_household) || Number(form.max_per_household) < 1)
    errors.max_per_household = 'Must be at least 1.'
  return errors
}

export default function CycleList() {
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const fetchCycles = async (nextPage = page) => {
    setLoading(true)
    try {
      const data = await cyclesApi.list({ page: nextPage })
      setCycles(data.results ?? data)
      setMeta(data.results ? data : null)
      setPage(nextPage)
    } catch {
      setError('Failed to load program cycles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCycles(1) }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    setError('')
    try {
      await cyclesApi.create({ ...form, slots: Number(form.slots), max_per_household: Number(form.max_per_household) })
      await fetchCycles(1)
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const fieldErrors = {}
        for (const [k, v] of Object.entries(detail)) fieldErrors[k] = Array.isArray(v) ? v[0] : v
        setFormErrors(fieldErrors)
      } else {
        setError('Failed to create cycle.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => { setShowForm(false); setForm(EMPTY_FORM); setFormErrors({}) }
  const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-section-label">Barangay Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Program Cycles</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Create cycle windows, set available slots, and move each cycle through applicant marking, scoring, and participation recording.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Cycle
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink-900">New Program Cycle</h2>
              <p className="mt-0.5 text-xs text-ink-500">Define the period, slots, and household cap for this TUPAD cycle.</p>
            </div>
            <button onClick={handleCancel} className="btn-ghost p-1 text-ink-400 hover:text-ink-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <Field label="Cycle Name" error={formErrors.cycle_name}>
              <input name="cycle_name" value={form.cycle_name} onChange={handleChange} className={inp(formErrors.cycle_name)} placeholder="e.g. TUPAD Cycle 1 - 2026" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date" error={formErrors.start_date}>
                <input name="start_date" type="date" value={form.start_date} onChange={handleChange} className={inp(formErrors.start_date)} />
              </Field>
              <Field label="End Date" error={formErrors.end_date}>
                <input name="end_date" type="date" value={form.end_date} onChange={handleChange} className={inp(formErrors.end_date)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Available Slots" error={formErrors.slots}>
                <input name="slots" type="number" min="1" value={form.slots} onChange={handleChange} className={inp(formErrors.slots)} placeholder="e.g. 50" />
              </Field>
              <Field label="Max per Household" error={formErrors.max_per_household}>
                <input name="max_per_household" type="number" min="1" value={form.max_per_household} onChange={handleChange} className={inp(formErrors.max_per_household)} placeholder="e.g. 1" />
              </Field>
            </div>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <button type="submit" disabled={saving} className="btn-primary justify-center">
                {saving ? 'Creating...' : 'Create Cycle'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary justify-center">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                {['Cycle Name', 'Start Date', 'End Date', 'Slots', 'Max/HH', 'Actions'].map((h, i) => (
                  <th key={h} className={`border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 ${i === 0 ? 'text-left' : 'text-center'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={5} cols={6} />
              ) : cycles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-ink-400">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-ink-300">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <p className="text-sm font-semibold text-ink-600">No program cycles yet</p>
                      <p className="text-xs text-ink-400">Create the first cycle to begin applicant selection.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                cycles.map((c) => (
                  <tr key={c.id} className="cursor-pointer transition-colors hover:bg-slate-50/70" onClick={() => navigate(`/official/cycles/${c.id}`)}>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <p className="font-semibold text-ink-900">{c.cycle_name}</p>
                      <p className="mt-0.5 text-xs text-ink-400">Created by {c.created_by_name || 'Official'}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-600">{fmtDate(c.start_date)}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-600">{fmtDate(c.end_date)}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                      <span className="badge bg-primary-100 text-primary-700">{c.slots} slots</span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                      <span className="badge bg-slate-100 text-ink-600">{c.max_per_household} per HH</span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/official/cycles/${c.id}`)}
                        className="text-xs font-semibold text-primary-600 transition hover:text-primary-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} page={page} onPageChange={fetchCycles} label="cycles" />
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function inp(error) {
  return `form-input ${error ? 'form-input-error' : ''}`
}
