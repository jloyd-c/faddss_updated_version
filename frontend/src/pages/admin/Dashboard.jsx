import { Link } from 'react-router-dom'

const CONTROLS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: 'User Management',
    description: 'Create official accounts, link resident accounts to beneficiary profiles, and deactivate access as needed.',
    href: '/admin/users',
    cta: 'Manage users',
    badge: 'Role-based',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
    title: 'Scoring Criteria',
    description: 'Tune active criteria, weights, cost/benefit types, and linked profile fields used in automatic indicator sync.',
    href: '/admin/criteria',
    cta: 'Configure criteria',
    badge: 'Configurable',
    badgeColor: 'bg-primary-100 text-primary-700',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: 'System Integrity',
    description: 'The database enforces insert-only audit logs, profile-change records, and participation records for full accountability.',
    href: '/official/audit',
    cta: 'View audit trail',
    badge: 'Traceable',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-900 to-primary-800 p-8 text-white shadow-lift">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary-200">
            System Administration
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-primary-100/75">
            Configure users, scoring model, and governance controls for the FADDSS TUPAD selection process at Barangay Batobalani.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/admin/users" className="btn-secondary text-ink-900 bg-white hover:bg-primary-50 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            Manage Users
          </Link>
          <Link to="/admin/criteria" className="btn-secondary text-ink-900 bg-white hover:bg-primary-50 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="20" y1="21" x2="20" y2="16" />
              <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Configure Criteria
          </Link>
        </div>
      </div>

      {/* Control panels */}
      <div className="grid gap-5 md:grid-cols-3">
        {CONTROLS.map((ctrl) => (
          <div key={ctrl.title} className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:shadow-lift hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                {ctrl.icon}
              </div>
              <span className={`badge ${ctrl.badgeColor}`}>
                {ctrl.badge}
              </span>
            </div>
            <h2 className="text-base font-semibold text-ink-900">{ctrl.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-ink-500">{ctrl.description}</p>
            <Link
              to={ctrl.href}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group-hover:gap-2"
            >
              {ctrl.cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      {/* System info strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-4">System Architecture</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Database tables', value: '7', note: 'Users, Beneficiaries, Criteria, Indicators, Cycles, Applications, Audit' },
            { label: 'Scoring method', value: 'WSM', note: 'Weighted Sum Model with COST/BENEFIT normalization' },
            { label: 'Data protection', value: 'Insert-only', note: 'Participation records and audit logs are append-only' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1 rounded-lg bg-ink-50 p-4">
              <p className="text-xs text-ink-500">{item.label}</p>
              <p className="text-xl font-bold text-primary-600">{item.value}</p>
              <p className="text-xs leading-5 text-ink-400">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
