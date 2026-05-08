import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/* ── SVG icon primitives ─────────────────────────────────────────────── */
function Icon({ children, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ICONS = {
  dashboard: <Icon><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>,
  users: <Icon><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></Icon>,
  criteria: <Icon><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></Icon>,
  household: <Icon><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></Icon>,
  beneficiary: <Icon><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>,
  cycles: <Icon><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>,
  scoring: <Icon><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Icon>,
  participation: <Icon><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" ry="2" /><path d="M9 12l2 2 4-4" /></Icon>,
  audit: <Icon><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>,
  profile: <Icon><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>,
  score: <Icon><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>,
  history: <Icon><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>,
}

const OFFICIAL_LINKS = [
  { to: '/official/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { to: '/official/households', label: 'Households', icon: ICONS.household },
  { to: '/official/beneficiaries', label: 'Beneficiaries', icon: ICONS.beneficiary },
  { to: '/official/cycles', label: 'Program Cycles', icon: ICONS.cycles },
  { to: '/official/scoring', label: 'Scoring & Ranking', icon: ICONS.scoring },
  { to: '/official/participation', label: 'Participation', icon: ICONS.participation },
  { to: '/official/audit', label: 'Audit Trail', icon: ICONS.audit },
]

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { to: '/admin/users', label: 'User Management', icon: ICONS.users },
  { to: '/admin/criteria', label: 'Scoring Criteria', icon: ICONS.criteria },
]

const RESIDENT_LINKS = [
  { to: '/resident/profile', label: 'My Profile', icon: ICONS.profile },
  { to: '/resident/score', label: 'My Score', icon: ICONS.score },
  { to: '/resident/history', label: 'Participation History', icon: ICONS.history },
]

const PORTAL_LABEL = {
  admin: 'Administration',
  official: 'Barangay Operations',
  resident: 'Resident Portal',
}

export default function Sidebar({ open = false, onClose }) {
  const { user } = useAuth()
  const links =
    user?.role === 'admin' ? ADMIN_LINKS
    : user?.role === 'official' ? OFFICIAL_LINKS
    : RESIDENT_LINKS

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`
          ${open ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80
          bg-white px-3 py-5 shadow-lift transition-transform duration-300
          lg:static lg:z-auto lg:flex lg:min-h-screen lg:translate-x-0 lg:bg-white/90 lg:shadow-none lg:backdrop-blur-sm
        `}
      >
        {/* Portal label */}
        <div className="mb-5 flex items-center justify-between px-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-500">
              {PORTAL_LABEL[user?.role] ?? 'Portal'}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-ink-600">
              Brgy. Batobalani · TUPAD DSS
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-slate-100 hover:text-ink-700 lg:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-slate-100 hover:text-ink-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-ink-400 group-hover:text-primary-600'}`}>
                    {icon}
                  </span>
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">FADDSS v1.0</p>
          <p className="mt-0.5 text-xs text-ink-500">Fair Aid Distribution · Decision Support System</p>
        </div>
      </aside>
    </>
  )
}
