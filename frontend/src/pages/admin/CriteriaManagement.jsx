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

function validate(form, criteria, editingId) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required.'
  const w = parseFloat(form.weight)
  if (!form.weight || isNaN(w) || w <= 0 || w > 1)
    errors.weight = 'Weight must be between 0.0001 and 1.0000.'
  if (!form.type) errors.type = 'Type is required.'
  if (!errors.weight && form.is_active) {
    const others = criteria.filter((c) => c.is_active && c.id !== editingId)
    const currentTotal = others.reduce((sum, c) => sum + parseFloat(c.weight), 0)
    if (currentTotal + w > 1.0001)
      errors.weight = `Total active weight would exceed 1.00 (current: ${currentTotal.toFixed(4)}).`
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

  const activeTotal = criteria.filter((c) => c.is_active).reduce((sum, c) => sum + parseFloat(c.weight), 0)
  const isBalanced = Math.abs(activeTotal - 1) < 0.0001

  const handleEdit = (criterion) => {
    setEditingId(criterion.id)
    setForm({ name: criterion.name, weight: String(criterion.weight), type: criterion.type, field_key: criterion.field_key ?? '', is_active: criterion.is_active })
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
    const payload = { ...form, weight: parseFloat(parseFloat(form.weight).toFixed(4)) }
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
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="page-section-label">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Scoring Criteria</h1>
          <p className="mt-1 text-sm text-ink-500">Configure the weighted criteria used in TUPAD applicant scoring.</p>
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

      {/* Weight balance indicator */}
      <div className={`flex items-center gap-3 rounded-xl border px-5 py-3.5 ${isBalanced ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className={`h-2 w-2 rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <p className="text-sm text-ink-700">
          Active weight total:{' '}
          <span className={`font-bold font-mono ${isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
            {activeTotal.toFixed(4)}
          </span>
          {' '}/ 1.0000
          {isBalanced && <span className="ml-2 text-xs text-emerald-600 font-semibold">Balanced ✓</span>}
          {!isBalanced && <span className="ml-2 text-xs text-amber-600 font-semibold">Rebalancing needed</span>}
        </p>
      </div>

      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-ink-900">{editingId ? 'Edit Criterion' : 'New Criterion'}</h2>
            <button onClick={handleCancel} className="btn-ghost p-1 text-ink-400 hover:text-ink-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Criterion Name" error={formErrors.name}>
              <input name="name" value={form.name} onChange={handleChange} className={inp(formErrors.name)} placeholder="e.g. Monthly Income" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight (0–1)" error={formErrors.weight}>
                <input name="weight" type="number" step="0.0001" min="0.0001" max="1" value={form.weight} onChange={handleChange} className={inp(formErrors.weight)} placeholder="0.6000" />
              </Field>
              <Field label="Type" error={formErrors.type}>
                <select name="type" value={form.type} onChange={handleChange} className={inp(formErrors.type)}>
                  <option value="cost">Cost (lower = more needy)</option>
                  <option value="benefit">Benefit (higher = more needy)</option>
                </select>
              </Field>
            </div>
            <Field label="Linked Profile Field" error={formErrors.field_key}>
              <select name="field_key" value={form.field_key} onChange={handleChange} className={inp(formErrors.field_key)}>
                {FIELD_KEY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 accent-primary-600" />
              <span className="text-sm font-medium text-ink-700">Active (included in scoring)</span>
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Criterion'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Name</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Weight</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Type</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Field</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Status</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={6} />
            ) : criteria.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink-300">
                      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                    <p className="text-sm font-semibold text-ink-600">No criteria defined yet</p>
                    <p className="text-xs text-ink-400">Add scoring criteria to enable applicant ranking.</p>
                  </div>
                </td>
              </tr>
            ) : (
              criteria.map((c) => (
                <tr key={c.id} className={`transition-colors hover:bg-slate-50/70 ${!c.is_active ? 'opacity-50' : ''}`}>
                  <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-ink-900">{c.name}</td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-700">{parseFloat(c.weight).toFixed(4)}</td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                    <span className={`badge ${c.type === 'cost' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-500">
                    {FIELD_KEY_OPTIONS.find((o) => o.value === (c.field_key ?? ''))?.label ?? c.field_key ?? '—'}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                    <span className={`badge ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-ink-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleEdit(c)} className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition">Edit</button>
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
