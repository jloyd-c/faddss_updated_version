import { useState, useEffect, Fragment } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { cyclesApi } from '../../api/cycles'
import { scoringApi } from '../../api/scoring'
import { Skeleton } from '../../components/common/Skeleton'

const STATUS_STYLE = {
  selected: { badge: 'bg-emerald-100 text-emerald-700', row: 'bg-emerald-50/40', rank: 'bg-emerald-500 text-white' },
  deferred: { badge: 'bg-amber-100 text-amber-700', row: '', rank: 'bg-slate-200 text-ink-600' },
  applied: { badge: 'bg-blue-100 text-blue-700', row: '', rank: 'bg-slate-200 text-ink-600' },
}

function statusLabel(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'
}

function formatScore(score) {
  return score != null ? Number(score).toFixed(4) : '--'
}

export default function ScoringRanking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [cycleId, setCycleId] = useState(searchParams.get('cycle') || '')
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [applications, setApplications] = useState([])
  const [rankings, setRankings] = useState(null)
  const [running, setRunning] = useState(false)
  const [cyclesLoading, setCyclesLoading] = useState(true)
  const [appsLoading, setAppsLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    cyclesApi.list()
      .then((data) => setCycles(data.results ?? data))
      .catch(() => setError('Failed to load cycles.'))
      .finally(() => setCyclesLoading(false))
  }, [])

  useEffect(() => {
    if (!cycleId) {
      setSelectedCycle(null)
      setApplications([])
      setRankings(null)
      return
    }

    setRankings(null)
    setExpandedId(null)
    setAppsLoading(true)
    setError('')
    const found = cycles.find((c) => String(c.id) === String(cycleId))
    setSelectedCycle(found ?? null)
    cyclesApi.listApplications(cycleId)
      .then((data) => setApplications(data.results ?? data))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setAppsLoading(false))
  }, [cycleId, cycles])

  const appliedCount = applications.filter((a) => a.status === 'applied').length
  const selectedCount = applications.filter((a) => a.status === 'selected').length
  const deferredCount = applications.filter((a) => a.status === 'deferred').length
  const slots = selectedCycle?.slots ?? 0
  const totalApplications = applications.length
  const hasSavedResults = selectedCount > 0 || deferredCount > 0
  const canRun = Boolean(cycleId && appliedCount > 0 && !running)
  const displayRows = rankings ?? applications.map((app) => ({
    beneficiary_id: app.beneficiary,
    beneficiary_name: app.beneficiary_name,
    status: app.status,
    rank: app.rank_position,
    total_score: app.computed_score,
    breakdown: [],
    has_participated: false,
    deferred_by_household: false,
  }))
  const hasResultsTable = Boolean(cycleId && displayRows.length > 0 && (rankings || hasSavedResults))

  const handleRun = async () => {
    if (!cycleId) return
    setRunning(true)
    setError('')
    setRankings(null)
    setExpandedId(null)
    try {
      const result = await scoringApi.rank(cycleId)
      setRankings(result.rankings)
      const appData = await cyclesApi.listApplications(cycleId)
      setApplications(appData.results ?? appData)
    } catch {
      setError('Scoring failed. Check applicant indicator data and active criteria setup.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-section-label">Barangay Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Scoring & Ranking</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Rank cycle applicants using active criteria, apply household limits, and save selected or deferred results.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${cycleId ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-ink-500'}`}>
            {cycleId ? 'Cycle selected' : 'Choose cycle'}
          </span>
          <span className={`badge ${appliedCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-ink-500'}`}>
            {appliedCount} applied
          </span>
          <span className={`badge ${hasSavedResults ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-ink-500'}`}>
            {hasSavedResults ? 'Results saved' : 'Not ranked'}
          </span>
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="space-y-5">
          <div className="card">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-ink-900">Cycle Setup</h2>
              <p className="mt-0.5 text-xs text-ink-500">Select the TUPAD cycle you want to evaluate.</p>
            </div>
            <div className="p-5">
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Program Cycle</label>
              {cyclesLoading ? (
                <Skeleton className="h-10 w-full max-w-lg" />
              ) : (
                <select
                  value={cycleId}
                  onChange={(e) => setCycleId(e.target.value)}
                  className="form-input max-w-lg"
                >
                  <option value="">Choose a cycle...</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{c.cycle_name}</option>
                  ))}
                </select>
              )}
              {selectedCycle && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="badge bg-primary-100 text-primary-700">{selectedCycle.start_date} to {selectedCycle.end_date}</span>
                  <span className="badge bg-blue-100 text-blue-700">{selectedCycle.slots} slots</span>
                  <span className="badge bg-slate-100 text-ink-600">max {selectedCycle.max_per_household} per household</span>
                </div>
              )}
            </div>
          </div>

          {cycleId && (
            <div className="card">
              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-ink-900">Ranking Action</h2>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Ranking processes only applicants currently marked as Applied.
                    </p>
                  </div>
                  <button
                    onClick={handleRun}
                    disabled={!canRun}
                    className="btn-primary justify-center"
                  >
                    {running ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                          <path d="M21 12a9 9 0 00-9-9" />
                        </svg>
                        Computing...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Run Scoring
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5">
                {appsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard label="Applied" value={appliedCount} color="blue" />
                    <MetricCard label="Selected" value={selectedCount} color="emerald" />
                    <MetricCard label="Deferred" value={deferredCount} color="amber" />
                  </div>
                )}

                {!appsLoading && totalApplications === 0 && (
                  <div className="alert-warning mt-4">
                    <span className="text-sm">
                      No applicants are marked for this cycle yet.
                      <button
                        onClick={() => navigate(`/official/cycles/${cycleId}/mark-applicants`)}
                        className="ml-1 font-semibold underline hover:text-amber-800"
                      >
                        Mark applicants first.
                      </button>
                    </span>
                  </div>
                )}

                {!appsLoading && appliedCount > 0 && appliedCount <= slots && (
                  <div className="alert-info mt-4">
                    <span className="text-sm">
                      Applied applicants are within the available slots, so running scoring will automatically select all applied applicants.
                    </span>
                  </div>
                )}

                {!appsLoading && hasSavedResults && appliedCount === 0 && (
                  <div className="alert-success mt-4">
                    <span className="text-sm">
                      This cycle already has saved ranking results. Continue to participation recording when work completion is ready.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Flow</h2>
            <div className="mt-4 space-y-3">
              <FlowStep number="1" title="Mark Applicants" text="Eligible residents are added to the cycle as Applied." active={totalApplications > 0} />
              <FlowStep number="2" title="Run Scoring" text="The system computes scores using active criteria." active={hasSavedResults || Boolean(rankings)} />
              <FlowStep number="3" title="Record Participation" text="Only Selected applicants can be recorded after work." active={selectedCount > 0} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold text-ink-900">Selection Rules</h2>
            <div className="mt-4 space-y-3 text-sm text-ink-600">
              <RuleItem text="Non-prior participants are prioritized before prior participants." />
              <RuleItem text="Scores are computed from active criteria and weights." />
              <RuleItem text="Household limit is applied before final slot selection." />
              <RuleItem text="Top ranked applicants within slots become Selected." />
            </div>
            {cycleId && (
              <button
                onClick={() => navigate(`/official/cycles/${cycleId}`)}
                className="btn-secondary mt-5 w-full justify-center"
              >
                View Cycle Details
              </button>
            )}
          </div>
        </aside>
      </div>

      {hasResultsTable && (
        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">Ranking Results</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                {displayRows.length} applicant{displayRows.length === 1 ? '' : 's'} in this cycle, {slots} available slot{slots === 1 ? '' : 's'}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-emerald-100 text-emerald-700">Selected</span>
              <span className="badge bg-amber-100 text-amber-700">Deferred</span>
              <span className="badge bg-blue-100 text-blue-700">Applied</span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr>
                    {['Rank', 'Name', 'Score', 'Status', 'Note', 'Breakdown'].map((h, i) => (
                      <th key={h} className={`border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 ${i === 0 || i >= 2 ? 'text-center' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const style = STATUS_STYLE[row.status] ?? STATUS_STYLE.applied
                    const isExpanded = expandedId === row.beneficiary_id
                    const canExpand = row.breakdown?.length > 0
                    return (
                      <Fragment key={row.application_id ?? row.beneficiary_id}>
                        <tr className={`transition-colors hover:bg-slate-50/70 ${style.row}`}>
                          <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                            {row.rank != null ? (
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${style.rank}`}>
                                {row.rank}
                              </span>
                            ) : (
                              <span className="text-ink-300">--</span>
                            )}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-ink-900">
                            {row.beneficiary_name ?? `ID ${row.beneficiary_id}`}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-700">
                            {formatScore(row.total_score)}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                            <span className={`badge ${style.badge}`}>{statusLabel(row.status)}</span>
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3.5 text-center text-xs text-ink-400">
                            {row.deferred_by_household ? 'Household cap' : row.has_participated ? 'Prior participant' : '--'}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                            {canExpand ? (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : row.beneficiary_id)}
                                className="text-xs font-semibold text-primary-600 transition hover:text-primary-800"
                              >
                                {isExpanded ? 'Hide' : 'Details'}
                              </button>
                            ) : (
                              <span className="text-xs text-ink-300">--</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && canExpand && (
                          <tr>
                            <td colSpan={6} className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Score Breakdown - {row.beneficiary_name}</p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-ink-400">
                                    <th className="pb-1.5 text-left font-semibold">Criterion</th>
                                    <th className="pb-1.5 text-center font-semibold">Weight</th>
                                    <th className="pb-1.5 text-center font-semibold">Value</th>
                                    <th className="pb-1.5 text-center font-semibold">Normalized</th>
                                    <th className="pb-1.5 text-right font-semibold">Contribution</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.breakdown.map((bd) => (
                                    <tr key={bd.criterion_id} className="border-b border-slate-100 last:border-0">
                                      <td className="py-1.5 text-ink-700">{bd.criterion_name}</td>
                                      <td className="py-1.5 text-center font-mono text-ink-600">{Number(bd.weight).toFixed(4)}</td>
                                      <td className="py-1.5 text-center text-ink-600">{bd.raw_value}</td>
                                      <td className="py-1.5 text-center font-mono text-ink-600">{Number(bd.normalized).toFixed(4)}</td>
                                      <td className="py-1.5 text-right font-mono font-semibold text-ink-900">{Number(bd.contribution).toFixed(4)}</td>
                                    </tr>
                                  ))}
                                  <tr className="border-t-2 border-slate-300 font-bold text-ink-900">
                                    <td colSpan={4} className="pt-2">Total Score</td>
                                    <td className="pt-2 text-right font-mono">{formatScore(row.total_score)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function MetricCard({ label, value, color }) {
  const colors = {
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

function RuleItem({ text }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
      <span className="text-xs leading-5 text-ink-600">{text}</span>
    </div>
  )
}
