import { useState, useEffect } from 'react'
import { usersApi } from '../../api/users'
import { residentProfilesApi } from '../../api/beneficiaries'
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

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

function validate(form) {
  const errors = {}
  if (!form.first_name.trim()) errors.first_name = 'First name is required.'
  if (!form.last_name.trim()) errors.last_name = 'Last name is required.'
  if (!form.username.trim()) errors.username = 'Username is required.'
  if (!form.password || form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (!form.role) errors.role = 'Select a role.'
  if (form.role === 'resident' && !form.beneficiary)
    errors.beneficiary = 'A resident account must be linked to a resident profile.'
  return errors
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [residentProfiles, setResidentProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [passwordResetUser, setPasswordResetUser] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm_password: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [benSearch, setBenSearch] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [autoFilled, setAutoFilled] = useState({ full_name: false, username: false })
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const fetchBeneficiaryOptions = async (query = benSearch) => {
    const params = {
      page_size: 100,
      ...(query.trim() ? { search: query.trim() } : {}),
    }
    const benData = await residentProfilesApi.list(params)
    setResidentProfiles(benData.results ?? benData)
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
      fetchBeneficiaryOptions(benSearch).catch(() => setError('Failed to load resident profiles.'))
    }, 250)
    return () => clearTimeout(timer)
  }, [benSearch, form.role])

  const usedBeneficiaryIds = new Set(users.filter((u) => u.beneficiary != null).map((u) => u.beneficiary))
  const availableResidentProfiles = residentProfiles.filter((b) => !usedBeneficiaryIds.has(b.id))
  const filteredResidentProfiles = availableResidentProfiles.filter((b) =>
    b.full_name.toLowerCase().includes(benSearch.toLowerCase())
  )
  const filteredUsers = users.filter((u) => {
    const haystack = `${u.full_name ?? ''} ${u.username ?? ''}`.toLowerCase()
    return haystack.includes(search.trim().toLowerCase()) && (roleFilter === 'all' || u.role === roleFilter)
  })
  const activeCount = users.filter((u) => u.is_active).length
  const inactiveCount = users.length - activeCount
  const residentCount = users.filter((u) => u.role === 'resident').length
  const selectedBeneficiary = residentProfiles.find((b) => String(b.id) === form.beneficiary) ?? null

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'beneficiary') {
      const ben = residentProfiles.find((b) => String(b.id) === value)
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

  const handleOpenPasswordReset = (user) => {
    setPasswordResetUser(user)
    setPasswordForm({ password: '', confirm_password: '' })
    setPasswordErrors({})
    setSuccess('')
    setError('')
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!passwordForm.password || passwordForm.password.length < 8) errors.password = 'Password must be at least 8 characters.'
    if (passwordForm.password !== passwordForm.confirm_password) errors.confirm_password = 'Passwords do not match.'
    if (Object.keys(errors).length) { setPasswordErrors(errors); return }

    setResetting(true)
    setError('')
    setSuccess('')
    try {
      await usersApi.resetPassword(passwordResetUser.id, { password: passwordForm.password })
      setSuccess(`Password updated for ${passwordResetUser.full_name}.`)
      setPasswordResetUser(null)
      setPasswordForm({ password: '', confirm_password: '' })
      setPasswordErrors({})
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const fieldErrors = {}
        for (const [k, v] of Object.entries(detail)) fieldErrors[k] = Array.isArray(v) ? v[0] : v
        setPasswordErrors(fieldErrors)
      } else {
        setError('Failed to update password.')
      }
    } finally {
      setResetting(false)
    }
  }

  const handleCancelPasswordReset = () => {
    setPasswordResetUser(null)
    setPasswordForm({ password: '', confirm_password: '' })
    setPasswordErrors({})
  }

  const handleCancel = () => { setShowForm(false); setForm(EMPTY_FORM); setFormErrors({}); setBenSearch(''); setAutoFilled({ full_name: false, username: false }) }

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-section-label">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">User Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">Create accounts, link resident profiles, and control access for administrators, barangay officials, and residents.</p>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Users On Page" value={users.length} color="primary" />
        <MetricCard label="Active Accounts" value={activeCount} color="emerald" />
        <MetricCard label="Resident Links" value={residentCount} color="blue" />
      </div>

      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert-success">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {success}
        </div>
      )}

      {showForm && (
        <div className="card">
          <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-ink-900">New User Account</h2>
              <p className="mt-0.5 text-xs text-ink-500">Choose the role first. Resident accounts can be linked to an existing resident profile.</p>
            </div>
            <button onClick={handleCancel} className="btn-ghost p-1 text-ink-400 hover:text-ink-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Role" error={formErrors.role}>
                <select name="role" value={form.role} onChange={handleChange} className={inp(formErrors.role)}>
                  <option value="official">Barangay Official/Staff</option>
                  <option value="admin">Administrator</option>
                  <option value="resident">Registered Resident</option>
                </select>
              </Field>
              <Field label="Temporary Password" error={formErrors.password}>
                <input name="password" type="password" value={form.password} onChange={handleChange} className={inp(formErrors.password)} autoComplete="new-password" />
              </Field>
            </div>

            {form.role === 'resident' && (
              <Field label="Link to resident profile" error={formErrors.beneficiary}>
                <input
                  type="text"
                  placeholder="Filter by name..."
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
                  <option value="">-- Select a beneficiary --</option>
                  {filteredResidentProfiles.map((b) => (
                    <option key={b.id} value={b.id}>{b.full_name}</option>
                  ))}
                </select>
                {availableResidentProfiles.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No matching resident profiles are available, or all matches already have linked accounts.</p>
                )}
              </Field>
            )}

            {selectedBeneficiary && (
              <div className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-200 text-[12px] font-bold text-primary-800">
                  {initials(selectedBeneficiary.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary-900">{selectedBeneficiary.full_name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-primary-700">
                    {selectedBeneficiary.age != null && <span>Age {selectedBeneficiary.age}</span>}
                    {selectedBeneficiary.household_code && <span>Household {selectedBeneficiary.household_code}</span>}
                    {selectedBeneficiary.employment_status && <span>{selectedBeneficiary.employment_status.replace(/_/g, ' ')}</span>}
                  </div>
                </div>
                <span className="badge shrink-0 bg-primary-200 text-primary-800">Linked</span>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
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

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button type="submit" disabled={saving} className="btn-primary justify-center">
                {saving ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary justify-center">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {passwordResetUser && (
        <div className="card">
          <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-ink-900">Change Password</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Set a new temporary password for <span className="font-semibold text-ink-700">{passwordResetUser.full_name}</span>.
              </p>
            </div>
            <button onClick={handleCancelPasswordReset} className="btn-ghost p-1 text-ink-400 hover:text-ink-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={handlePasswordReset} className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="New Password" error={passwordErrors.password}>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => {
                    setPasswordForm((prev) => ({ ...prev, password: e.target.value }))
                    setPasswordErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  className={inp(passwordErrors.password)}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm Password" error={passwordErrors.confirm_password}>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => {
                    setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))
                    setPasswordErrors((prev) => ({ ...prev, confirm_password: undefined }))
                  }}
                  className={inp(passwordErrors.confirm_password)}
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <div className="alert-info">
              <span className="text-sm">Share the new password with the user through an approved barangay channel. The old password will stop working immediately.</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={resetting} className="btn-primary justify-center">
                {resetting ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" onClick={handleCancelPasswordReset} className="btn-secondary justify-center">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-input lg:max-w-[220px]">
            <option value="all">All roles</option>
            <option value="admin">Administrators</option>
            <option value="official">Officials/Staff</option>
            <option value="resident">Residents</option>
          </select>
          {(search || roleFilter !== 'all') && (
            <button type="button" onClick={() => { setSearch(''); setRoleFilter('all') }} className="btn-secondary justify-center">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">Account Directory</h2>
              <p className="text-xs text-ink-500">{filteredUsers.length} shown from {users.length} account{users.length === 1 ? '' : 's'} on this page.</p>
            </div>
            <span className={`badge ${inactiveCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {inactiveCount} inactive
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-ink-400">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-300">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      <p className="text-sm font-semibold text-ink-600">{users.length === 0 ? 'No users found' : 'No users match the filters'}</p>
                      <p className="text-xs text-ink-400">{users.length === 0 ? 'Create the first account to get started.' : 'Clear the search or choose a different role.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={`transition-colors hover:bg-slate-50/70 ${!u.is_active ? 'opacity-50' : ''}`}>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                          {initials(u.full_name)}
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
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenPasswordReset(u)}
                          className="text-xs font-semibold text-primary-600 transition hover:text-primary-800"
                        >
                          Password
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`text-xs font-semibold transition hover:underline ${u.is_active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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



