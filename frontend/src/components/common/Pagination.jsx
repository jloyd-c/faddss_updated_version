export default function Pagination({ meta, page, onPageChange, label = 'records', pageSize = 20 }) {
  if (!meta || !meta.count || meta.count <= 0) return null

  const totalPages = Math.max(1, Math.ceil(meta.count / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(meta.count, page * pageSize)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-500">
        Showing{' '}
        <span className="font-semibold text-ink-700">{start}–{end}</span>
        {' '}of{' '}
        <span className="font-semibold text-ink-700">{meta.count}</span>{' '}
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!meta.previous}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-primary-50 hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>
        <span className="rounded-md bg-white px-3 py-1.5 font-mono text-[11px] text-ink-500 ring-1 ring-slate-200">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={!meta.next}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-primary-50 hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
