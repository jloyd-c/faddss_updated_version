import { useState, useEffect } from 'react'
import { usersApi } from '../../api/users'
import { beneficiariesApi } from '../../api/beneficiaries'
import Pagination from '../../components/common/Pagination'
import { SkeletonTableRows } from '../../components/common/Skeleton'

const ROLE_LABELS = {
  admin: 'Administrator',
  official: 'Barangay Official',
  resident: 'Resident',
}
const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  official: 'bg-blue-100 text-blue-700',
  resident: 'bg-emerald-100 text-emerald-700',
}
const EMPTY_FORM = { username: '', password: '', first_name: '', middle_name: '', last_name: '', role: 'official', beneficiary: '' }

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

function suggestUsername(firstName, lastName) {
  const f = firstName.trim().toLowerCase().replace(/[^a-z]/g, '')
  const l = lastName.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (!f) return l
  if (!l) return f
  return f + '.' + l
}

function validate(form) {
  const errors = {}
  if (!form.first_name.trim()) errors.first_name = 'First name is required.'
  if (!form.last_name.trim()) errors.last_name = 'Last name is required.'
  if (!form.username.trim()) errors.username = 'Username is required.'
  if (!form.password || form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (!form.role) errors.role = 'Select a role.'
  if (form.role === 'resident' && !form.beneficiary)
    errors.beneficiary = 'A resident account must be linked to a beneficiary profile.'
  return errors
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [benSearch, setBenSearch] = useState('')
  const [autoFilled, setAutoFilled] = useState({ full_name: false, username: false })
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const fetchBeneficiaryOptions = async (query = benSearch) => {
    const params = {
      page_size: 100,
      ...(query.trim() ? { search: query.trim() } : {}),
    }
    const benData = await beneficiariesApi.list(params)
    setBeneficiaries(benData.results ?? benData)
  }

  const fetchAll = async (nextPage = page) => {
    setLoading(true)
    try {
      const [userData] = await Promise.all([
        usersApi.list({ page: nextPage }),
        fetchBeneficiaryOptions(),
      ])
      setUsers(userData.results ?? userData)
      setMeta(userData.results ? userData : null)
      setPage(nextPage)
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll(1) }, [])
  useEffect(() => {
    if (form.role !== 'resident') return
    const timer = setTimeout(() => {
      fetchBeneficiaryOptions(benSearch).catch(() => setError('Failed to load beneficiaries.'))
    }, 250)
    return () => clearTimeout(timer)
  }, [benSearch, form.role])

  const usedBeneficiaryIds = new Set(users.filter((u) => u.beneficiary != null).map((u) => u.beneficiary))
  const availableBeneficiaries = beneficiaries.filter((b) => !usedBeneficiaryIds.has(b.id))
  const filteredBeneficiaries = availableBeneficiaries.filter((b) =>
    b.full_name.toLowerCase().includes(benSearch.toLowerCase())
  )

  const selectedBeneficiary = beneficiaries.find((b) => String(b.id) === form.beneficiary) ?? null

  const handleChange = (e) => {
    const { name, value } = e.target

    // Auto-fill name fields and suggest username when a beneficiary is selected
    if (name === 'beneficiary') {
      const ben = beneficiaries.find((b) => String(b.id) === value)
      if (ben) {
        const { first_name, middle_name, last_name } = splitFullName(ben.full_name)
        const suggested = suggestUsername(first_name, last_name)
        setForm((prev) => ({
          ...prev,
          beneficiary: value,
          first_name,
          middle_name,
          last_name,
          username: prev.username || suggested,
        }))
        setAutoFilled({ full_name: true, username: !form.username })
        setFormErrors((prev) => ({ ...prev, beneficiary: undefined, first_name: undefined, last_name: undefined }))
        return
      }
      setForm((prev) => ({ ...prev, beneficiary: '' }))
      setAutoFilled({ full_name: false, username: false })
      return
    }

    // Clear auto-fill badge when user manually edits a name or username field
    if (['first_name', 'middle_name', 'last_name', 'username'].includes(name)) {
      setAutoFilled((prev) => ({ ...prev, full_name: false, ...(name === 'username' ? { username: false } : {}) }))
    }

    setForm((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    if (name === 'role' && value !== 'resident') {
      setForm((prev) => ({ ...prev, [name]: value, beneficiary: '' }))
      setBenSearch('')
      setAutoFilled({ full_name: false, username: false })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    setError('')
    const payload = {
      username: form.username,
      password: form.password,
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      full_name: buildFullName(form.first_name, form.middle_name, form.last_name),
      role: form.role,
      ...(form.role === 'resident' && form.beneficiary ? { beneficiary: form.beneficiary } : {}),
    }
    try {
      await usersApi.create(payload)
      await fetchAll(1)
      setForm(EMPTY_FORM)
      setBenSearch('')
      setShowForm(false)
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const fieldErrors = {}
        for (const [k, v] of Object.entries(detail)) fieldErrors[k] = Array.isArray(v) ? v[0] : v
        setFormErrors(fieldErrors)
      } else {
        setError('Failed to create user.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await usersApi.update(user.id, { is_active: !user.is_active })
      await fetchAll(page)
    } catch {
      setError('Failed to update user status.')
    }
  }

  const handleCancel = () => { setShowForm(false); setForm(EMPTY_FORM); setFormErrors({}); setBenSearch(''); setAutoFilled({ full_name: false, username: false }) }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-section-label">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">User Management</h1>
          <p className="mt-1 text-sm text-ink-500">Create accounts and manage access for officials and residents.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New User
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-ink-900">New User Account</h2>
            <button onClick={handleCancel} className="btn-ghost text-ink-400 hover:text-ink-700 p-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role selector first so beneficiary field appears when needed */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role" error={formErrors.role}>
                <select name="role" value={form.role} onChange={handleChange} className={inp(formErrors.role)}>
                  <option value="official">Barangay Official/Staff</option>
                  <option value="admin">Administrator</option>
                  <option value="resident">Registered Resident</option>
                </select>
              </Field>
              <Field label="Password" error={formErrors.password}>
                <input name="password" type="password" value={form.password} onChange={handleChange} className={inp(formErrors.password)} autoComplete="new-password" />
              </Field>
            </div>

            {/* Beneficiary selector for residents — shown first so it can auto-fill below fields */}
            {form.role === 'resident' && (
              <Field label="Link to Beneficiary Profile" error={formErrors.beneficiary}>
                <input
                  type="text"
                  placeholder="Filter by name…"
                  value={benSearch}
                  onChange={(e) => setBenSearch(e.target.value)}
                  className="form-input mb-1.5"
                />
                <select
                  name="beneficiary"
                  value={form.beneficiary}
                  onChange={handleChange}
                  className={`${inp(formErrors.beneficiary)} min-h-[7rem]`}
                  size={5}
                >
                  <option value="">— Select a beneficiary —</option>
                  {filteredBeneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>{b.full_name}</option>
                  ))}
                </select>
                {availableBeneficiaries.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No matching beneficiary profiles are available, or all matches already have linked accounts.</p>
                )}
              </Field>
            )}

            {/* Beneficiary preview card — appears after selection */}
            {selectedBeneficiary && (
              <div className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-200 text-[12px] font-bold text-primary-800">
                  {selectedBeneficiary.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-900">{selectedBeneficiary.full_name}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-primary-700">
                    {selectedBeneficiary.age != null && <span>Age {selectedBeneficiary.age}</span>}
                    {selectedBeneficiary.household_code && <span>· {selectedBeneficiary.household_code}</span>}
                    {selectedBeneficiary.employment_status && <span>· {selectedBeneficiary.employment_status.replace(/_/g, ' ')}</span>}
                  </div>
                </div>
                <span className="shrink-0 badge bg-primary-200 text-primary-800">Linked</span>
              </div>
            )}

            {/* Name fields — auto-filled when a beneficiary is selected */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="First Name" error={formErrors.first_name} autoFilled={autoFilled.full_name}>
                <input name="first_name" value={form.first_name} onChange={handleChange} className={inp(formErrors.first_name)} placeholder="Juan" />
              </Field>
              <Field label="Middle Name" hint="Optional" autoFilled={autoFilled.full_name}>
                <input name="middle_name" value={form.middle_name} onChange={handleChange} className="form-input" placeholder="Santos" />
              </Field>
              <Field label="Last Name" error={formErrors.last_name} autoFilled={autoFilled.full_name}>
                <input name="last_name" value={form.last_name} onChange={handleChange} className={inp(formErrors.last_name)} placeholder="Dela Cruz" />
              </Field>
            </div>

            <Field label="Username" error={formErrors.username} autoFilled={autoFilled.username}>
              <input name="username" value={form.username} onChange={handleChange} className={inp(formErrors.username)} placeholder="juan.delacruz" autoComplete="off" />
            </Field>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating…' : 'Create User'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Full Name</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Username</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Role</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Status</th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={5} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-300">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    <p className="text-sm font-semibold text-ink-600">No users found</p>
                    <p className="text-xs text-ink-400">Create the first account to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className={`transition-colors hover:bg-slate-50/70 ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="border-b border-slate-100 px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                        {u.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-ink-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 font-mono text-xs text-ink-500">{u.username}</td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                    <span className={`badge ${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-ink-600'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                    <span className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-ink-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs font-semibold transition hover:underline ${u.is_active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} onPageChange={fetchAll} label="users" />
      </div>
    </div>
  )
}

function Field({ label, error, autoFilled, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-semibold text-ink-700">{label}</label>
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
        {autoFilled && (
          <span className="badge bg-primary-100 text-primary-600" style={{ fontSize: '10px' }}>Auto-filled</span>
        )}
      </div>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function inp(error) {
  return `form-input ${error ? 'form-input-error' : ''}`
}
