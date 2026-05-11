import { useState, useEffect } from 'react'
import { criteriaApi } from '../../api/criteria'
import { SkeletonTableRows } from '../../components/common/Skeleton'

const EMPTY_FORM = { name: '', weight: '', type: 'cost', field_key: '', is_active: true }

const FIELD_KEY_OPTIONS = [
  { value: '', label: 'Manual indicator' },
  { value: 'monthly_income', label: 'Monthly Income' },
  { value: 'employment_status', label: 'Employment Status' },
  { value: 'household_size', label: 'Household Size' },
  { value: 'num_dependents', label: 'Number of Dependents' },
  { value: 'housing_condition', label: 'Housing Condition' },
  { value: 'is_pwd', label: 'PWD Status' },
  { value: 'is_senior', label: 'Senior Citizen Status' },
  { value: 'is_solo_parent', label: 'Solo Parent Status' },
  { value: 'is_4ps', label: '4Ps Beneficiary' },
]

function fieldLabel(value) {
  return FIELD_KEY_OPTIONS.find((o) => o.value === (value ?? ''))?.label ?? value ?? 'Manual indicator'
}

function toPercent(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number * 100 : 0
}

function formatPercent(value) {
  return `${toPercent(value).toFixed(2)}%`
}

function validate(form, criteria, editingId) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required.'
  const percentWeight = parseFloat(form.weight)
  const w = percentWeight / 100
  if (!form.weight || isNaN(percentWeight) || percentWeight <= 0 || percentWeight > 100)
    errors.weight = 'Weight must be between 0.01% and 100%.'
  if (!form.type) errors.type = 'Type is required.'
  if (!errors.weight && form.is_active) {
    const others = criteria.filter((c) => c.is_active && c.id !== editingId)
    const currentTotal = others.reduce((sum, c) => sum + parseFloat(c.weight), 0)
    if (currentTotal + w > 1.0001)
      errors.weight = `Total active weight would exceed 100% (current: ${formatPercent(currentTotal)}).`
  }
  return errors
}

export default function CriteriaManagement() {
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchCriteria = async () => {
    setLoading(true)
    try {
      const data = await criteriaApi.list()
      setCriteria(data.results ?? data)
    } catch {
      setError('Failed to load criteria.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCriteria() }, [])

  const activeCriteria = criteria.filter((c) => c.is_active)
  const inactiveCount = criteria.length - activeCriteria.length
  const activeTotal = activeCriteria.reduce((sum, c) => sum + parseFloat(c.weight), 0)
  const isBalanced = Math.abs(activeTotal - 1) < 0.0001
  const manualCount = criteria.filter((c) => !c.field_key).length
  const progress = Math.min(activeTotal, 1) * 100
  const filteredCriteria = criteria.filter((c) => {
    const haystack = `${c.name ?? ''} ${fieldLabel(c.field_key)} ${c.type ?? ''}`.toLowerCase()
    const matchesSearch = haystack.includes(search.trim().toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.is_active) ||
      (statusFilter === 'inactive' && !c.is_active)
    return matchesSearch && matchesStatus
  })

  const handleEdit = (criterion) => {
    setEditingId(criterion.id)
    setForm({ name: criterion.name, weight: String(toPercent(criterion.weight)), type: criterion.type, field_key: criterion.field_key ?? '', is_active: criterion.is_active })
    setFormErrors({})
    setShowForm(true)
  }

  const handleNew = () => { setEditingId(null); setForm(EMPTY_FORM); setFormErrors({}); setShowForm(true) }
  const handleCancel = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setFormErrors({}) }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form, criteria, editingId)
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setSaving(true)
    setError('')
    const payload = { ...form, weight: parseFloat((parseFloat(form.weight) / 100).toFixed(4)) }
    try {
      if (editingId) await criteriaApi.update(editingId, payload)
      else await criteriaApi.create(payload)
      await fetchCriteria()
      handleCancel()
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const fieldErrors = {}
        for (const [key, val] of Object.entries(detail)) fieldErrors[key] = Array.isArray(val) ? val[0] : val
        setFormErrors(fieldErrors)
      } else {
        setError('Failed to save criterion.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (criterion) => {
    try {
      await criteriaApi.update(criterion.id, { is_active: !criterion.is_active })
      await fetchCriteria()
    } catch {
      setError('Failed to update criterion status.')
    }
  }

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-section-label">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Scoring Criteria</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">Configure the weighted rules used to rank TUPAD applicants and keep the active total balanced at 100%.</p>
        </div>
        {!showForm && (
          <button onClick={handleNew} className="btn-primary shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Criterion
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Active Criteria" value={activeCriteria.length} color="primary" />
        <MetricCard label="Inactive Criteria" value={inactiveCount} color="slate" />
        <MetricCard label="Manual Indicators" value={manualCount} color="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section className="space-y-5">
          <div className={`rounded-xl border px-5 py-4 ${isBalanced ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">Active weight total</p>
                <p className="mt-0.5 text-xs text-ink-500">Active criteria should add up to exactly 100% before ranking.</p>
              </div>
              <div className={`font-mono text-2xl font-bold ${isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
                {formatPercent(activeTotal)}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
              <div className={`h-full rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={isBalanced ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                {isBalanced ? 'Balanced and ready' : activeTotal > 1 ? 'Over total' : 'Rebalancing needed'}
              </span>
              <span className="font-mono text-ink-500">target 100%</span>
            </div>
          </div>

          {error && (
            <div className="alert-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {showForm && (
            <div className="card">
              <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-ink-900">{editingId ? 'Edit Criterion' : 'New Criterion'}</h2>
                  <p className="mt-0.5 text-xs text-ink-500">Set the weight, direction, and optional resident profile field used by the scoring engine.</p>
                </div>
                <button onClick={handleCancel} className="btn-ghost p-1 text-ink-400 hover:text-ink-700">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 p-5">
                <Field label="Criterion Name" error={formErrors.name}>
                  <input name="name" value={form.name} onChange={handleChange} className={inp(formErrors.name)} placeholder="e.g. Monthly Income" />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Weight (%)" error={formErrors.weight}>
                    <div className="relative">
                      <input name="weight" type="number" step="0.01" min="0.01" max="100" value={form.weight} onChange={handleChange} className={`${inp(formErrors.weight)} pr-10`} placeholder="60" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">%</span>
                    </div>
                  </Field>
                  <Field label="Scoring Direction" error={formErrors.type}>
                    <select name="type" value={form.type} onChange={handleChange} className={inp(formErrors.type)}>
                      <option value="cost">Cost: lower value means more need</option>
                      <option value="benefit">Benefit: higher value means more need</option>
                    </select>
                  </Field>
                </div>
                <Field label="Linked Profile Field" error={formErrors.field_key}>
                  <select name="field_key" value={form.field_key} onChange={handleChange} className={inp(formErrors.field_key)}>
                    {FIELD_KEY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 accent-primary-600" />
                  <span>
                    <span className="block text-sm font-semibold text-ink-800">Active in scoring</span>
                    <span className="mt-0.5 block text-xs text-ink-500">Only active criteria count toward the 100% total.</span>
                  </span>
                </label>
                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <button type="submit" disabled={saving} className="btn-primary justify-center">
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Criterion'}
                  </button>
                  <button type="button" onClick={handleCancel} className="btn-secondary justify-center">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </section>

        <aside className="card p-5">
          <h2 className="text-base font-bold text-ink-900">Quick Guide</h2>
          <div className="mt-4 space-y-3">
            <GuideItem title="Weights" text="All active weights must total 100%." />
            <GuideItem title="Cost criteria" text="Lower values score higher, such as lower income." />
            <GuideItem title="Benefit criteria" text="Higher values score higher, such as more dependents." />
            <GuideItem title="Manual indicators" text="Use these when a rule is not directly mapped to a profile field." />
          </div>
        </aside>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search criteria by name, type, or field..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input lg:max-w-[200px]">
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          {(search || statusFilter !== 'all') && (
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all') }} className="btn-secondary justify-center">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">Criteria Library</h2>
              <p className="text-xs text-ink-500">{filteredCriteria.length} shown from {criteria.length} criterion{criteria.length === 1 ? '' : 's'}.</p>
            </div>
            <span className={`badge ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isBalanced ? 'Balanced' : 'Needs review'}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr>
                {['Name', 'Weight', 'Type', 'Field', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 ${i === 0 || i === 3 ? 'text-left' : 'text-center'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={5} cols={6} />
              ) : filteredCriteria.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-ink-400">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink-300">
                        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                      <p className="text-sm font-semibold text-ink-600">{criteria.length === 0 ? 'No criteria defined yet' : 'No criteria match the filters'}</p>
                      <p className="text-xs text-ink-400">{criteria.length === 0 ? 'Add scoring criteria to enable applicant ranking.' : 'Clear the search or choose another status.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCriteria.map((c) => (
                  <tr key={c.id} className={`transition-colors hover:bg-slate-50/70 ${!c.is_active ? 'opacity-50' : ''}`}>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <p className="font-semibold text-ink-900">{c.name}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{c.field_key ? 'Profile field criterion' : 'Manual scoring indicator'}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-700">{formatPercent(c.weight)}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                      <span className={`badge ${c.type === 'cost' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {c.type === 'cost' ? 'Cost' : 'Benefit'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-xs text-ink-500">
                      {fieldLabel(c.field_key)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                      <span className={`badge ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-ink-500'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(c)} className="text-xs font-semibold text-primary-600 transition hover:text-primary-800">Edit</button>
                        <button onClick={() => handleToggleActive(c)} className={`text-xs font-semibold transition ${c.is_active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}>
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

function GuideItem({ title, text }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
      <span>
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-500">{text}</span>
      </span>
    </div>
  )
}

function inp(error) {
  return `form-input ${error ? 'form-input-error' : ''}`
}

function MetricCard({ label, value, color }) {
  const colors = {
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    slate: 'border-slate-200 bg-slate-50 text-ink-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }

  return (
    <div className={`rounded-lg border px-4 py-3 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}

