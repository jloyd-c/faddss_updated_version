import { useState, useEffect } from 'react'
import { cyclesApi } from '../../api/cycles'
import { scoringApi } from '../../api/scoring'
import { Skeleton } from '../../components/common/Skeleton'

const STATUS_STYLE = {
  selected: { card: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', title: 'Selected', message: 'You have been selected for this cycle.' },
  deferred: { card: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700', title: 'Deferred', message: 'You were not selected this cycle. Prioritization may favor first-time participants next cycle.' },
  applied: { card: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700', title: 'Applied', message: 'Your application is recorded, but ranking has not been finalized yet.' },
}

function formatScore(value) {
  return value != null ? Number(value).toFixed(4) : '--'
}

export default function MyScore() {
  const [cycles, setCycles] = useState([])
  const [cycleId, setCycleId] = useState('')
  const [scoreData, setScoreData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cyclesLoading, setCyclesLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cyclesApi.list()
      .then((data) => {
        const list = data.results ?? data
        setCycles(list)
        if (list.length > 0) setCycleId(String(list[0].id))
      })
      .catch(() => setError('Failed to load program cycles.'))
      .finally(() => setCyclesLoading(false))
  }, [])

  useEffect(() => {
    if (!cycleId) return
    setLoading(true)
    setError('')
    setScoreData(null)
    scoringApi.myScore(cycleId)
      .then(setScoreData)
      .catch((err) => {
        if (err.response?.status === 400) {
          setError(err.response.data?.detail ?? 'No score data for this cycle.')
        } else {
          setError('Failed to load score data.')
        }
      })
      .finally(() => setLoading(false))
  }, [cycleId])

  const selectedCycle = cycles.find((c) => String(c.id) === cycleId)
  const statusStyle = scoreData?.status ? STATUS_STYLE[scoreData.status] : null

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-section-label">Resident Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">My Score</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            View your application status, rank, score, and scoring breakdown for each program cycle.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Program Cycle</label>
        {cyclesLoading ? (
          <Skeleton className="h-10 w-full max-w-lg" />
        ) : cycles.length === 0 ? (
          <p className="text-sm text-ink-400">No program cycles are available yet.</p>
        ) : (
          <select value={cycleId} onChange={(e) => setCycleId(e.target.value)} className="form-input max-w-lg">
            {cycles.map((c) => <option key={c.id} value={c.id}>{c.cycle_name}</option>)}
          </select>
        )}
      </div>

      {error && !loading && (
        <div className="alert-warning">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          <span>
            <span className="block font-semibold">No visible score for this cycle</span>
            <span className="mt-0.5 block text-xs leading-5">
              {error} This usually means you were not marked as an applicant for the selected cycle yet.
            </span>
          </span>
        </div>
      )}

      {loading && (
        <div className="card p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      )}

      {scoreData && !loading && (
        <>
          {statusStyle && (
            <div className={`rounded-xl border px-5 py-4 ${statusStyle.card}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-base font-bold ${statusStyle.text}`}>{statusStyle.title}</p>
                  <p className={`mt-0.5 text-sm ${statusStyle.text} opacity-80`}>{statusStyle.message}</p>
                </div>
                <span className={`badge ${statusStyle.badge}`}>Status: {scoreData.status}</span>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Rank" value={scoreData.rank != null ? `#${scoreData.rank}` : '--'} />
            <SummaryCard label="Total Score" value={formatScore(scoreData.total_score)} mono />
            <SummaryCard label="Priority" value={scoreData.has_participated ? 'Prior Participant' : 'First-time'} />
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-ink-900">Score Breakdown</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                {selectedCycle?.cycle_name ?? 'Selected cycle'} scoring details
              </p>
            </div>
            {scoreData.breakdown?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr>
                      {['Criterion', 'Weight', 'My Value', 'Normalized', 'Contribution'].map((h, i) => (
                        <th key={h} className={`border-b border-slate-200 bg-slate-50 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 ${i === 0 ? 'text-left' : i === 4 ? 'text-right' : 'text-center'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scoreData.breakdown.map((b) => (
                      <tr key={b.criterion_id} className="transition-colors hover:bg-slate-50/70">
                        <td className="border-b border-slate-100 px-5 py-3 font-medium text-ink-900">{b.criterion_name}</td>
                        <td className="border-b border-slate-100 px-5 py-3 text-center font-mono text-xs text-ink-600">{Number(b.weight).toFixed(4)}</td>
                        <td className="border-b border-slate-100 px-5 py-3 text-center text-ink-600">{b.raw_value}</td>
                        <td className="border-b border-slate-100 px-5 py-3 text-center font-mono text-xs text-ink-600">{Number(b.normalized).toFixed(4)}</td>
                        <td className="border-b border-slate-100 px-5 py-3 text-right font-mono font-semibold text-ink-900">{Number(b.contribution).toFixed(4)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="px-5 py-3 font-bold text-ink-700">Total Score</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-ink-900">{formatScore(scoreData.total_score)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-ink-600">No score breakdown available</p>
                <p className="mt-1 text-xs text-ink-400">This can happen when applicants are automatically selected because slots are enough for all applicants.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, mono }) {
  return (
    <div className="card p-5 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold text-primary-700 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
