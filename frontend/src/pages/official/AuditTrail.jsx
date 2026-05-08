import { useState, useEffect } from 'react'
import { auditApi } from '../../api/audit'
import Pagination from '../../components/common/Pagination'
import { SkeletonTableRows } from '../../components/common/Skeleton'

function fmtTimestamp(ts) {
  return new Date(ts).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_COLORS = {
  CREATED: 'bg-emerald-100 text-emerald-700',
  UPDATED: 'bg-blue-100 text-blue-700',
  SOFT_DELETED: 'bg-red-100 text-red-700',
  RESTORED: 'bg-purple-100 text-purple-700',
}

function FilterBar({ children }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-5 py-4">
      {children}
    </div>
  )
}

/* ── System Audit Log ───────────────────────────────────────────────────── */

function SystemAuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const fetchLogs = async (nextPage = page) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: nextPage }
      if (actionFilter) params.action = actionFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const data = await auditApi.list(params)
      setLogs(data.results ?? data)
      setMeta(data.results ? data : null)
      setPage(nextPage)
    } catch {
      setError('Failed to load system audit logs.')
    } finally {
      setLoading(false)
    }
  }

  // Debounce text input (300 ms); date picks fire immediately (0 ms)
  useEffect(() => {
    const delay = actionFilter.trim() ? 300 : 0
    const timer = setTimeout(() => fetchLogs(1), delay)
    return () => clearTimeout(timer)
  }, [actionFilter, dateFrom, dateTo])

  const hasFilters = actionFilter || dateFrom || dateTo

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <FilterBar>
        <div className="flex-1 min-w-40">
          <label className="mb-1 block text-xs font-semibold text-ink-500">Action keyword</label>
          <input type="text" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="e.g. MARKED_APPLICANT" className="form-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-500">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-500">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" />
        </div>
        {hasFilters && (
          <button onClick={() => { setActionFilter(''); setDateFrom(''); setDateTo('') }} className="btn-secondary self-end">Clear</button>
        )}
      </FilterBar>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Timestamp', 'User', 'Action', 'Table', 'Record ID'].map((h, i) => (
                <th key={h} className={`px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200 ${i <= 1 ? 'text-left' : 'text-center'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={6} cols={5} />
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-400">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-ink-300">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p className="text-sm font-semibold text-ink-600">No audit logs found</p>
                    <p className="text-xs text-ink-400">{hasFilters ? 'Try adjusting your filters.' : 'Logs will appear as actions occur.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="border-b border-slate-100 px-4 py-3.5 text-xs text-ink-500 whitespace-nowrap">{fmtTimestamp(log.timestamp)}</td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-ink-700 font-medium">
                    {log.user_name ?? <span className="text-ink-400 italic text-xs">System</span>}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                    <span className="rounded-md bg-primary-50 px-2.5 py-1 font-mono text-xs font-semibold text-primary-700">{log.action}</span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-500">{log.target_table}</td>
                  <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-400">{log.target_id ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} onPageChange={fetchLogs} label="audit logs" />
      </div>
      <p className="text-xs text-ink-400">{meta?.count ?? logs.length} record(s) — insert-only, immutable.</p>
    </div>
  )
}

/* ── Profile Change Log ─────────────────────────────────────────────────── */

function ProfileChangeLogTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const fetchLogs = async (nextPage = page) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: nextPage }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const data = await auditApi.profileChanges(params)
      setLogs(data.results ?? data)
      setMeta(data.results ? data : null)
      setPage(nextPage)
    } catch {
      setError('Failed to load profile change logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(1), 0)
    return () => clearTimeout(timer)
  }, [dateFrom, dateTo])

  const hasFilters = dateFrom || dateTo

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <FilterBar>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-500">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-500">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" />
        </div>
        {hasFilters && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="btn-secondary self-end">Clear</button>
        )}
      </FilterBar>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Timestamp', 'Changed By', 'Action', 'Type', 'Household', 'Changes'].map((h, i) => (
                <th key={h} className={`px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 bg-slate-50 border-b border-slate-200 ${i <= 1 ? 'text-left' : 'text-center'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={6} />
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-400">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-ink-300">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" />
                    </svg>
                    <p className="text-sm font-semibold text-ink-600">No profile change logs</p>
                    <p className="text-xs text-ink-400">Changes to beneficiary profiles will appear here.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id
                const fieldCount = Object.keys(log.changed_fields ?? {}).length
                return (
                  <>
                    <tr key={log.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="border-b border-slate-100 px-4 py-3.5 text-xs text-ink-500 whitespace-nowrap">{fmtTimestamp(log.changed_at)}</td>
                      <td className="border-b border-slate-100 px-4 py-3.5 font-medium text-ink-700">{log.changed_by_name}</td>
                      <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                        <span className={`badge ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-ink-600'}`}>{log.action}</span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-500">{log.target_type}</td>
                      <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-500">{log.household_code}</td>
                      <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                        {fieldCount > 0 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition"
                          >
                            {isExpanded ? 'Hide' : `${fieldCount} field${fieldCount > 1 ? 's' : ''}`}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Changed Fields</p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-ink-400">
                                <th className="pb-1.5 text-left font-semibold">Field</th>
                                <th className="pb-1.5 text-left font-semibold text-red-500">Before</th>
                                <th className="pb-1.5 text-left font-semibold text-emerald-600">After</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(log.changed_fields).map(([field, change]) => (
                                <tr key={field} className="border-b border-slate-100 last:border-0">
                                  <td className="py-1.5 font-mono text-ink-600">{field}</td>
                                  <td className="py-1.5 text-red-600 line-through">{String(change.old ?? '—')}</td>
                                  <td className="py-1.5 text-emerald-700 font-medium">{String(change.new ?? '—')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {log.notes && <p className="mt-2 text-xs text-ink-400 italic">Note: {log.notes}</p>}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} onPageChange={fetchLogs} label="profile changes" />
      </div>
      <p className="text-xs text-ink-400">{meta?.count ?? logs.length} record(s) — insert-only, immutable.</p>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */

export default function AuditTrail() {
  const [activeTab, setActiveTab] = useState('system')

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <p className="page-section-label">Barangay Operations</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">Audit Trail</h1>
        <p className="mt-1 text-sm text-ink-500">Insert-only logs of all system actions and profile changes. Immutable records for accountability.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100/60 p-1 w-fit">
        {[
          { key: 'system', label: 'System Audit Log' },
          { key: 'profile', label: 'Profile Change Log' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === key
                ? 'bg-white text-ink-900 shadow-card'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'system' ? <SystemAuditLog /> : <ProfileChangeLogTab />}
    </div>
  )
}
