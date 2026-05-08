export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonText({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonTableRows({ rows = 5, cols = 5 }) {
  const colWidths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-1/2', 'w-2/5']
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }, (_, j) => (
            <td key={j} className="border-b border-slate-100 px-4 py-3.5">
              <div className={`skeleton h-4 ${j === 0 ? 'w-3/4' : colWidths[j % colWidths.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function SkeletonCards({ count = 3, className = '' }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`rounded-xl border border-slate-200 bg-white p-5 space-y-3 ${className}`}>
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-8 w-16" />
          <div className="skeleton h-3 w-28" />
        </div>
      ))}
    </>
  )
}

export function SkeletonForm({ fields = 6 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-4 w-40" />
        </div>
      ))}
    </div>
  )
}
