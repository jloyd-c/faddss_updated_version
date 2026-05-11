import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { residentProfilesApi } from '../../api/beneficiaries'
import Pagination from '../../components/common/Pagination'
import { SkeletonTableRows } from '../../components/common/Skeleton'

const EMPLOYMENT_LABELS = {
  unemployed: 'Unemployed',
  displaced_terminated: 'Displaced/Terminated',
  underemployed: 'Underemployed',
  self_employed_informal: 'Self-Employed/Informal',
  employed: 'Employed',
}

const EMPLOYMENT_COLOR = {
  unemployed: 'bg-red-100 text-red-700',
  displaced_terminated: 'bg-orange-100 text-orange-700',
  underemployed: 'bg-amber-100 text-amber-700',
  self_employed_informal: 'bg-blue-100 text-blue-700',
  employed: 'bg-emerald-100 text-emerald-700',
}

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function BeneficiaryList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const familyFilter = searchParams.get('family') || ''
  const [residentProfiles, setResidentProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const fetchResidentProfiles = async (query = search, nextPage = page) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: nextPage }
      if (query.trim()) params.search = query.trim()
      if (familyFilter) params.family = familyFilter
      const data = await residentProfilesApi.list(params)
      setResidentProfiles(data.results ?? data)
      setMeta(data.results ? data : null)
      setPage(nextPage)
    } catch {
      setError('Failed to load Resident Profiles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchResidentProfiles(search, 1), search.trim() ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, familyFilter])

  const eligibleOnPage = residentProfiles.filter((b) => b.is_tupad_eligible).length
  const ineligibleOnPage = residentProfiles.length - eligibleOnPage

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-section-label">Barangay Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Resident Profiles</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            {familyFilter
              ? 'Showing members from the selected family group.'
              : 'Manage individual resident profiles, household links, sector membership, and TUPAD eligibility indicators.'}
          </p>
        </div>
        <button onClick={() => navigate('/official/resident-profiles/new')} className="btn-primary shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Resident Profile
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Records Found" value={meta?.count ?? residentProfiles.length} color="primary" />
        <MetricCard label="Eligible On Page" value={eligibleOnPage} color="emerald" />
        <MetricCard label="Not Eligible On Page" value={ineligibleOnPage} color="slate" />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search resident profile by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="btn-secondary justify-center"
            >
              Clear
            </button>
          )}
          {familyFilter && (
            <button
              type="button"
              onClick={() => navigate('/official/resident-profiles')}
              className="btn-secondary justify-center"
            >
              All Families
            </button>
          )}
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr>
                {['Full Name', 'Household', 'Age', 'Employment', 'Eligible', 'Sectors', 'Actions'].map((h, i) => (
                  <th key={h} className={`border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 ${i === 0 || i === 3 || i === 5 ? 'text-left' : 'text-center'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={7} cols={7} />
              ) : residentProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-ink-400">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-ink-300">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                      <p className="text-sm font-semibold text-ink-600">
                        {search ? 'No Resident Profiles match your search' : 'No Resident Profiles yet'}
                      </p>
                      <p className="text-xs text-ink-400">
                        {search ? 'Try a different name or clear the search.' : 'Start by creating a household, then adding Resident Profiles.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                residentProfiles.map((b) => (
                  <tr key={b.id} className="cursor-pointer transition-colors hover:bg-slate-50/70" onClick={() => navigate(`/official/resident-profiles/${b.id}`)}>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                          {initials(b.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">{b.full_name}</p>
                          <p className="text-xs capitalize text-ink-400">{b.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center font-mono text-xs text-ink-500">{b.household_code ?? '--'}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center text-ink-700">{b.age}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <span className={`badge ${EMPLOYMENT_COLOR[b.employment_status] ?? 'bg-slate-100 text-ink-600'}`}>
                        {EMPLOYMENT_LABELS[b.employment_status] ?? b.employment_status ?? '--'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center">
                      {b.is_tupad_eligible ? (
                        <span className="badge bg-emerald-100 text-emerald-700">Eligible</span>
                      ) : (
                        <span className="badge bg-slate-100 text-ink-400">No</span>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {(b.sectors ?? []).length === 0
                          ? <span className="text-xs text-ink-300">--</span>
                          : (b.sectors ?? []).map((s) => (
                              <span key={s} className="badge bg-blue-50 text-blue-600">{s}</span>
                            ))
                        }
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/official/resident-profiles/${b.id}`)}
                        className="text-xs font-semibold text-primary-600 transition hover:text-primary-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} page={page} onPageChange={(next) => fetchResidentProfiles(search, next)} label="Resident Profiles" />
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }) {
  const colors = {
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-200 bg-slate-50 text-ink-600',
  }

  return (
    <div className={`rounded-lg border px-4 py-3 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}



