import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cyclesApi } from '../../api/cycles'
import { Skeleton } from '../../components/common/Skeleton'

const STATUS_BADGE = {
  applied: 'bg-blue-100 text-blue-700',
  selected: 'bg-emerald-100 text-emerald-700',
  deferred: 'bg-amber-100 text-amber-700',
}

function statusLabel(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending'
}

function fmtDate(d) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'
}

function fmtScore(score) {
  return score != null ? Number(score).toFixed(4) : '--'
}

export default function CycleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cycle, setCycle] = useState(null)
  const [applications, setApplications] = useState([])
  const [participation, setParticipation] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [cycleData, appData, partData] = await Promise.all([
          cyclesApi.get(id),
          cyclesApi.listApplications(id),
          cyclesApi.listParticipation({ cycle: id }),
        ])
        setCycle(cycleData)
        setApplications(appData.results ?? appData)
        setParticipation(partData.results ?? partData)
      } catch {
        setError('Failed to load cycle data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-6xl space-y-5">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert-error">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
        </svg>
        {error}
      </div>
    )
  }

  if (!cycle) return null

  const applied = applications.filter((a) => a.status === 'applied').length
  const selected = applications.filter((a) => a.status === 'selected').length
  const deferred = applications.filter((a) => a.status === 'deferred').length
  const hasApplicants = applications.length > 0
  const hasResults = selected > 0 || deferred > 0
  const hasParticipation = participation.length > 0

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button onClick={() => navigate('/official/cycles')} className="btn-ghost mb-3 -ml-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <p className="page-section-label">Program Cycle</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">{cycle.cycle_name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {fmtDate(cycle.start_date)} to {fmtDate(cycle.end_date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-primary-100 text-primary-700">{cycle.slots} slots</span>
          <span className="badge bg-slate-100 text-ink-600">max {cycle.max_per_household} per household</span>
          <span className={`badge ${hasResults ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {hasResults ? 'Ranked' : 'Not ranked'}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="Applicants" value={applications.length} color="primary" />
            <MetricCard label="Applied" value={applied} color="blue" />
            <MetricCard label="Selected" value={selected} color="emerald" />
            <MetricCard label="Deferred" value={deferred} color="amber" />
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Cycle Actions</h2>
            <p className="mt-0.5 text-xs text-ink-500">Follow the cycle from applicant intake to final participation records.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ActionButton
                title="Mark Applicants"
                text="Add eligible residents who applied for this cycle."
                onClick={() => navigate(`/official/cycles/${id}/mark-applicants`)}
                variant="primary"
              />
              <ActionButton
                title="Run Scoring"
                text="Rank applied applicants and save selected/deferred status."
                onClick={() => navigate(`/official/scoring?cycle=${id}`)}
                variant="dark"
              />
              <ActionButton
                title="Record Participation"
                text="Log work records for selected beneficiaries only."
                onClick={() => navigate(`/official/participation?cycle=${id}`)}
                variant="outline"
              />
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Cycle Flow</h2>
            <div className="mt-4 space-y-3">
              <FlowStep number="1" title="Applicants" text="Mark eligible residents as applied." active={hasApplicants} />
              <FlowStep number="2" title="Scoring" text="Run ranking to choose beneficiaries." active={hasResults} />
              <FlowStep number="3" title="Participation" text="Record actual TUPAD work completion." active={hasParticipation} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Cycle Settings</h2>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Start Date" value={fmtDate(cycle.start_date)} />
              <SummaryRow label="End Date" value={fmtDate(cycle.end_date)} />
              <SummaryRow label="Created By" value={cycle.created_by_name || 'Official'} />
            </div>
          </div>
        </aside>
      </div>

      <DataTable
        title="Applications"
        count={applications.length}
        emptyText='No applicants marked yet. Use "Mark Applicants" to add residents.'
        columns={['Beneficiary', 'Status', 'Rank', 'Score', 'Applied By', 'Date']}
      >
        {applications.map((a) => (
          <tr key={a.id} className="transition-colors hover:bg-slate-50/70">
            <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-ink-900">{a.beneficiary_name}</td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center">
              <span className={`badge ${STATUS_BADGE[a.status] ?? 'bg-slate-100 text-ink-600'}`}>
                {statusLabel(a.status)}
              </span>
            </td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-600">{a.rank_position ?? '--'}</td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-600">{fmtScore(a.computed_score)}</td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-500">{a.applied_by_name}</td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-400">{fmtDate(a.application_date)}</td>
          </tr>
        ))}
      </DataTable>

      <DataTable
        title="Participation Records"
        count={participation.length}
        emptyText="No participation records yet for this cycle."
        columns={['Beneficiary', 'Project', 'Days', 'Period', 'Recorded By']}
      >
        {participation.map((r) => (
          <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
            <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-ink-900">{r.beneficiary_name}</td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-ink-600">{r.project_name}</td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center text-ink-600">{r.days_worked}</td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-500">
              {fmtDate(r.participation_start)} to {fmtDate(r.participation_end)}
            </td>
            <td className="border-b border-slate-100 px-4 py-3.5 text-center text-ink-500">{r.recorded_by_name}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}

function MetricCard({ label, value, color }) {
  const colors = {
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}

function ActionButton({ title, text, onClick, variant }) {
  const styles = {
    primary: 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700',
    dark: 'border-ink-800 bg-ink-800 text-white hover:bg-ink-900',
    outline: 'border-slate-300 bg-white text-ink-700 hover:bg-slate-50',
  }
  return (
    <button onClick={onClick} className={`rounded-lg border px-4 py-3 text-left transition active:scale-[0.99] ${styles[variant]}`}>
      <span className="block text-sm font-bold">{title}</span>
      <span className={`mt-1 block text-xs leading-5 ${variant === 'outline' ? 'text-ink-500' : 'text-white/80'}`}>{text}</span>
    </button>
  )
}

function FlowStep({ number, title, text, active }) {
  return (
    <div className="flex gap-3">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-ink-500'
      }`}>
        {number}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-500">{text}</span>
      </span>
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

function DataTable({ title, count, emptyText, columns, children }) {
  const hasRows = count > 0
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-ink-900">
          {title}
          <span className="ml-2 text-xs font-normal text-ink-400">({count})</span>
        </h2>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                {columns.map((h, i) => (
                  <th key={h} className={`border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 ${i === 0 || h === 'Project' ? 'text-left' : 'text-center'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasRows ? children : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-ink-400">{emptyText}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
