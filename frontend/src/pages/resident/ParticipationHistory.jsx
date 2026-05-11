import { useState, useEffect } from 'react'
import { cyclesApi } from '../../api/cycles'
import { SkeletonTableRows, SkeletonCards } from '../../components/common/Skeleton'

function fmtDate(d) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'
}

export default function ParticipationHistory() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cyclesApi.listParticipation()
      .then((data) => setRecords(data.results ?? data))
      .catch(() => setError('Failed to load participation history.'))
      .finally(() => setLoading(false))
  }, [])

  const totalDays = records.reduce((sum, r) => sum + Number(r.days_worked ?? 0), 0)
  const latestRecord = records[0]

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <p className="page-section-label">Resident Portal</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">Participation History</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          Review your recorded TUPAD participation. These entries are permanent and encoded by barangay officials.
        </p>
      </div>

      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonCards count={3} />
        </div>
      ) : records.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Cycles Participated" value={records.length} tone="primary" />
          <MetricCard label="Total Days Worked" value={totalDays} tone="emerald" />
          <MetricCard label="Latest Project" value={latestRecord?.project_name ?? '--'} tone="slate" compact />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-ink-900">Recorded Participation</h2>
          <p className="mt-0.5 text-xs text-ink-400">Official work records connected to your resident profile.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr>
                {['Cycle', 'Project', 'Days', 'Period', 'Recorded By'].map((h, i) => (
                  <th key={h} className={`border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 ${i <= 1 ? 'text-left' : 'text-center'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={4} cols={5} />
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-ink-400">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-ink-300">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <p className="text-sm font-semibold text-ink-600">No participation records yet</p>
                      <p className="max-w-xs text-center text-xs text-ink-400">
                        Records will appear here after the barangay records your actual TUPAD work participation.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-ink-900">{r.cycle_name}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-ink-600">{r.project_name}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                      <span className="font-bold text-primary-700">{r.days_worked}</span>
                      <span className="ml-1 text-xs text-ink-400">days</span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-500">
                      {fmtDate(r.participation_start)} to {fmtDate(r.participation_end)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-500">{r.recorded_by_name ?? '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && records.length > 0 && (
        <p className="text-xs leading-5 text-ink-400">
          These records are permanent. Contact your barangay official if you have concerns about an entry.
        </p>
      )}
    </div>
  )
}

function MetricCard({ label, value, tone, compact }) {
  const colors = {
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-200 bg-slate-50 text-ink-700',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 ${colors[tone]}`}>
      <p className={`${compact ? 'truncate text-lg' : 'text-2xl'} font-bold`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}

