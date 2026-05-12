import { useState, useEffect } from 'react'
import { cyclesApi } from '../../api/cycles'
import { reportsApi, downloadBlob } from '../../api/reports'

function Icon({ children, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const REPORTS = [
  {
    id: 'cycle-ranking',
    label: 'Cycle Ranking',
    description: 'Ranked applicants with scores and status per program cycle.',
    filename: (cycle) => `cycle_ranking_${cycle?.cycle_name?.replace(/\s+/g, '_') ?? 'report'}.xlsx`,
    needsCycle: true,
    cycleRequired: true,
    icon: (
      <Icon>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </Icon>
    ),
  },
  {
    id: 'beneficiary-masterlist',
    label: 'Beneficiary Masterlist',
    description: 'All active beneficiaries with demographics, sectors, and eligibility.',
    filename: () => 'beneficiary_masterlist.xlsx',
    icon: (
      <Icon>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </Icon>
    ),
  },
  {
    id: 'participation-history',
    label: 'Participation History',
    description: 'Days worked and project records per beneficiary across cycles.',
    filename: () => 'participation_history.xlsx',
    needsCycle: true,
    cycleRequired: false,
    icon: (
      <Icon>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </Icon>
    ),
  },
  {
    id: 'audit-trail',
    label: 'Audit Trail',
    description: 'System activity log filtered by date range.',
    filename: () => 'audit_trail.xlsx',
    needsDates: true,
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </Icon>
    ),
  },
  {
    id: 'household',
    label: 'Household Report',
    description: 'All households with families and members across three Excel sheets.',
    filename: () => 'household_report.xlsx',
    icon: (
      <Icon>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </Icon>
    ),
  },
]

export default function ReportsPage() {
  const [selected, setSelected] = useState(null)
  const [cycles, setCycles] = useState([])
  const [filters, setFilters] = useState({ cycle_id: '', start_date: '', end_date: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cyclesApi.list({ page_size: 100 })
      .then(data => setCycles(data.results ?? data))
      .catch(() => {})
  }, [])

  const handleSelect = (report) => {
    setSelected(report)
    setError('')
    setFilters({ cycle_id: '', start_date: '', end_date: '' })
  }

  const handleDownload = async () => {
    setError('')
    if (selected.cycleRequired && !filters.cycle_id) {
      setError('Please select a program cycle.')
      return
    }
    setLoading(true)
    try {
      let data
      const params = {}
      if (filters.cycle_id) params.cycle_id = filters.cycle_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date

      if (selected.id === 'cycle-ranking') {
        data = await reportsApi.cycleRanking(filters.cycle_id)
      } else if (selected.id === 'beneficiary-masterlist') {
        data = await reportsApi.beneficiaryMasterlist()
      } else if (selected.id === 'participation-history') {
        data = await reportsApi.participationHistory(params)
      } else if (selected.id === 'audit-trail') {
        data = await reportsApi.auditTrail(params)
      } else if (selected.id === 'household') {
        data = await reportsApi.household()
      }

      const selectedCycle = cycles.find(c => String(c.id) === String(filters.cycle_id))
      downloadBlob(data, selected.filename(selectedCycle))
    } catch {
      setError('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Reports</h1>
        <p className="mt-0.5 text-sm text-ink-500">Generate and download Excel reports.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(report => (
          <button
            key={report.id}
            onClick={() => handleSelect(report)}
            className={`group rounded-xl border p-4 text-left transition-all ${
              selected?.id === report.id
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm'
            }`}
          >
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              selected?.id === report.id
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-ink-500 group-hover:bg-primary-100 group-hover:text-primary-600'
            }`}>
              {report.icon}
            </div>
            <p className={`text-sm font-semibold ${selected?.id === report.id ? 'text-primary-700' : 'text-ink-800'}`}>
              {report.label}
            </p>
            <p className="mt-0.5 text-xs text-ink-500 leading-relaxed">{report.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink-900">{selected.label}</h2>

          <div className="flex flex-wrap gap-3">
            {selected.needsCycle && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-ink-600">
                  Program Cycle{selected.cycleRequired && <span className="ml-0.5 text-red-500">*</span>}
                  {!selected.cycleRequired && <span className="ml-1 text-ink-400">(optional)</span>}
                </label>
                <select
                  value={filters.cycle_id}
                  onChange={e => setFilters(f => ({ ...f, cycle_id: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">— All Cycles —</option>
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>{c.cycle_name}</option>
                  ))}
                </select>
              </div>
            )}

            {selected.needsDates && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink-600">
                    Start Date <span className="text-ink-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink-600">
                    End Date <span className="text-ink-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

          <div className="mt-4">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              {loading ? 'Generating…' : 'Download Excel'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
