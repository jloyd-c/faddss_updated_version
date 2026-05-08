import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cyclesApi } from '../../api/cycles'
import { beneficiariesApi } from '../../api/beneficiaries'
import Pagination from '../../components/common/Pagination'

export default function MarkApplicants() {
  const { id } = useParams()   // cycle id from route /official/cycles/:id/mark-applicants
  const navigate = useNavigate()

  const [cycle, setCycle] = useState(null)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [ineligibleMatches, setIneligibleMatches] = useState([])
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [marking, setMarking] = useState(null)  // beneficiary id currently being marked
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const loadAll = async (nextPage = page) => {
    try {
      const searchQuery = search.trim()
      const beneficiaryParams = {
        eligible: 'true',
        page: nextPage,
        ...(searchQuery ? { search: searchQuery } : {}),
      }
      const [cycleData, benData, appData, allMatchData] = await Promise.all([
        cyclesApi.get(id),
        beneficiariesApi.list(beneficiaryParams),
        cyclesApi.listApplications(id),
        searchQuery ? beneficiariesApi.list({ search: searchQuery, page_size: 20 }) : Promise.resolve({ results: [] }),
      ])
      const allMatches = allMatchData.results ?? allMatchData
      setCycle(cycleData)
      setBeneficiaries(benData.results ?? benData)
      setIneligibleMatches(searchQuery ? allMatches.filter((b) => !b.is_tupad_eligible) : [])
      setMeta(benData.results ? benData : null)
      setPage(nextPage)
      setApplications(appData.results ?? appData)
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll(1) }, [id])
  useEffect(() => {
    const timer = setTimeout(() => loadAll(1), 250)
    return () => clearTimeout(timer)
  }, [search])

  const markedIds = new Set(applications.map((a) => a.beneficiary))
  const isRanked = applications.some((a) => a.status === 'selected' || a.status === 'deferred')

  const filtered = beneficiaries

  const handleMark = async (beneficiaryId) => {
    if (markedIds.has(beneficiaryId) || isRanked) return   // already marked or locked
    setMarking(beneficiaryId)
    setError('')
    try {
      await cyclesApi.markApplicant(id, beneficiaryId)
      // Refresh applications list
      const appData = await cyclesApi.listApplications(id)
      setApplications(appData.results ?? appData)
    } catch (err) {
      const detail = err.response?.data
      if (detail?.detail) {
        setError(detail.detail)
      } else if (detail?.non_field_errors) {
        setError(`${detail.non_field_errors[0]} This beneficiary is already marked for this cycle.`)
      } else {
        setError('Failed to mark applicant. They may already be marked for this cycle.')
      }
    } finally {
      setMarking(null)
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-8">Loading…</div>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/official/cycles/${id}`)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mark Applicants</h1>
          {cycle && (
            <p className="text-sm text-gray-500 mt-0.5">
              {cycle.cycle_name} · {applications.length} marked so far
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {isRanked && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Applicant marking is locked for this cycle.</p>
          <p className="mt-0.5 text-xs leading-5">
            Ranking has already been generated, so adding new applicants is disabled to keep selected/deferred results consistent.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400">
                No eligible beneficiaries found. Check if the beneficiary is 18+ and not marked as child.
              </p>
              {ineligibleMatches.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 text-left">
                  <p className="border-b border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">
                    Found in beneficiary records, but not eligible for TUPAD application:
                  </p>
                  {ineligibleMatches.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-amber-900">{b.full_name}</p>
                        <p className="text-xs text-amber-700">Age {b.age}, role: {b.role}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Not eligible
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            filtered.map((b) => {
              const isMarked = markedIds.has(b.id)
              const isLoading = marking === b.id
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${isMarked ? 'bg-green-50' : ''}`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.full_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.address}</p>
                  </div>
                  {isMarked || isRanked ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {isMarked ? 'Applied' : 'Locked'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMark(b.id)}
                      disabled={isLoading || isRanked}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Marking…' : 'Mark Applied'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          {applications.length} marked for this cycle. Showing page {page} of eligible residents.
        </div>
        <Pagination meta={meta} page={page} onPageChange={loadAll} label="eligible residents" />
      </div>
    </div>
  )
}
