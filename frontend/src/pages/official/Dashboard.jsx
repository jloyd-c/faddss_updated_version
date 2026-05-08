import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { beneficiariesApi, householdsApi } from '../../api/beneficiaries'
import { cyclesApi } from '../../api/cycles'
import { criteriaApi } from '../../api/criteria'
import { auditApi } from '../../api/audit'
import { Skeleton, SkeletonCards } from '../../components/common/Skeleton'

const QUICK_LINKS = [
  { label: 'New Beneficiary', href: '/official/beneficiaries/new' },
  { label: 'Households', href: '/official/households' },
  { label: 'Program Cycles', href: '/official/cycles' },
  { label: 'Scoring', href: '/official/scoring' },
  { label: 'Participation', href: '/official/participation' },
  { label: 'Audit Trail', href: '/official/audit' },
]

const FLOW_STEPS = [
  { label: 'Create Household', href: '/official/households' },
  { label: 'Add Families', href: '/official/households' },
  { label: 'Encode Beneficiaries', href: '/official/beneficiaries/new' },
  { label: 'Create Cycle', href: '/official/cycles' },
  { label: 'Mark Applicants', href: '/official/cycles' },
  { label: 'Run Scoring', href: '/official/scoring' },
  { label: 'Record Participation', href: '/official/participation' },
]

function countFrom(data) {
  if (!data) return 0
  if (typeof data.count === 'number') return data.count
  return (data.results ?? data).length ?? 0
}

function rowsFrom(data) {
  return data?.results ?? data ?? []
}

function fmtDate(date) {
  return date ? new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'
}

export default function OfficialDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState({
    households: 0,
    beneficiaries: 0,
    eligible: 0,
    cycles: 0,
    participation: 0,
    criteria: 0,
    audits: 0,
  })
  const [recentCycles, setRecentCycles] = useState([])
  const [cycleStats, setCycleStats] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [
          householdData,
          beneficiaryData,
          eligibleData,
          cycleData,
          participationData,
          criteriaData,
          auditData,
        ] = await Promise.all([
          householdsApi.list({ page_size: 1 }),
          beneficiariesApi.list({ page_size: 1 }),
          beneficiariesApi.list({ page_size: 1, eligible: 'true' }),
          cyclesApi.list({ page_size: 5 }),
          cyclesApi.listParticipation({ page_size: 1 }),
          criteriaApi.list({ page_size: 100 }),
          auditApi.list({ page_size: 1 }),
        ])

        const cycles = rowsFrom(cycleData)
        setRecentCycles(cycles)
        setSummary({
          households: countFrom(householdData),
          beneficiaries: countFrom(beneficiaryData),
          eligible: countFrom(eligibleData),
          cycles: countFrom(cycleData),
          participation: countFrom(participationData),
          criteria: rowsFrom(criteriaData).filter((c) => c.is_active).length,
          audits: countFrom(auditData),
        })

        if (cycles.length > 0) {
          const current = cycles[0]
          const [appsData, partData] = await Promise.all([
            cyclesApi.listApplications(current.id),
            cyclesApi.listParticipation({ cycle: current.id, page_size: 1 }),
          ])
          const apps = rowsFrom(appsData)
          setCycleStats({
            cycle: current,
            applied: apps.filter((a) => a.status === 'applied').length,
            selected: apps.filter((a) => a.status === 'selected').length,
            deferred: apps.filter((a) => a.status === 'deferred').length,
            participation: countFrom(partData),
          })
        } else {
          setCycleStats(null)
        }
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const completion = useMemo(() => {
    const checks = [
      summary.households > 0,
      summary.beneficiaries > 0,
      summary.eligible > 0,
      summary.cycles > 0,
      Boolean(cycleStats && (cycleStats.applied + cycleStats.selected + cycleStats.deferred) > 0),
      Boolean(cycleStats && (cycleStats.selected + cycleStats.deferred) > 0),
      summary.participation > 0,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [summary, cycleStats])

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-section-label">Barangay Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Official Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Live overview of household profiling, TUPAD eligibility, cycle selection, participation, and audit activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.slice(0, 4).map((link) => (
            <Link key={link.href} to={link.href} className="btn-secondary px-3 py-1.5 text-xs">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCards count={4} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Households" value={summary.households} note="encoded dwellings" color="primary" />
          <MetricCard label="Beneficiaries" value={summary.beneficiaries} note={`${summary.eligible} TUPAD eligible`} color="blue" />
          <MetricCard label="Program Cycles" value={summary.cycles} note="selection windows" color="emerald" />
          <MetricCard label="Participation" value={summary.participation} note="insert-only records" color="amber" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="space-y-5">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-ink-900">Current Cycle Snapshot</h2>
              <p className="mt-0.5 text-xs text-ink-500">Based on the latest created program cycle.</p>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : cycleStats ? (
              <div className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-ink-900">{cycleStats.cycle.cycle_name}</h3>
                    <p className="mt-1 text-sm text-ink-500">
                      {fmtDate(cycleStats.cycle.start_date)} to {fmtDate(cycleStats.cycle.end_date)}
                    </p>
                  </div>
                  <Link to={`/official/cycles/${cycleStats.cycle.id}`} className="btn-secondary justify-center">
                    Open Cycle
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <MiniStat label="Applied" value={cycleStats.applied} tone="blue" />
                  <MiniStat label="Selected" value={cycleStats.selected} tone="emerald" />
                  <MiniStat label="Deferred" value={cycleStats.deferred} tone="amber" />
                  <MiniStat label="Recorded" value={cycleStats.participation} tone="slate" />
                </div>
              </div>
            ) : (
              <EmptyPanel title="No cycle yet" text="Create a program cycle to begin applicant selection." action={{ label: 'Create Cycle', href: '/official/cycles' }} />
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-ink-900">Recent Program Cycles</h2>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentCycles.length === 0 ? (
              <EmptyPanel title="No cycles found" text="Program cycles will appear here after creation." />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCycles.map((cycle) => (
                  <Link key={cycle.id} to={`/official/cycles/${cycle.id}`} className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{cycle.cycle_name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{fmtDate(cycle.start_date)} to {fmtDate(cycle.end_date)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <span className="badge bg-primary-100 text-primary-700">{cycle.slots} slots</span>
                      <span className="badge bg-slate-100 text-ink-600">{cycle.max_per_household} per HH</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Workflow Progress</h2>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink-500">System readiness</span>
                <span className="font-bold text-primary-700">{completion}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary-600" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {FLOW_STEPS.map((step, index) => (
                <Link key={step.label} to={step.href} className="flex gap-3 rounded-lg p-2 transition hover:bg-slate-50">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{step.label}</span>
                    <span className="text-xs text-ink-400">Open module</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">System Health</h2>
            <div className="mt-4 space-y-3">
              <HealthRow label="Active Criteria" value={summary.criteria} />
              <HealthRow label="Audit Logs" value={summary.audits} />
              <HealthRow label="Eligible Beneficiaries" value={summary.eligible} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function MetricCard({ label, value, note, color }) {
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
      <p className="mt-1 text-xs opacity-80">{note}</p>
    </div>
  )
}

function MiniStat({ label, value, tone }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-ink-600',
  }
  return (
    <div className={`rounded-lg px-4 py-3 text-center ${colors[tone]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}

function HealthRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <span className="text-sm font-semibold text-ink-600">{label}</span>
      <span className="badge bg-primary-100 text-primary-700">{value}</span>
    </div>
  )
}

function EmptyPanel({ title, text, action }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold text-ink-600">{title}</p>
      <p className="mt-1 text-xs text-ink-400">{text}</p>
      {action && <Link to={action.href} className="btn-primary mt-4 justify-center">{action.label}</Link>}
    </div>
  )
}
