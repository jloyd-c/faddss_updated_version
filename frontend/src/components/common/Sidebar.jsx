import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const OFFICIAL_LINKS = [
  { to: '/official/dashboard', label: 'Dashboard' },
  { to: '/official/beneficiaries', label: 'Beneficiaries' },
  { to: '/official/cycles', label: 'Program Cycles' },
  { to: '/official/scoring', label: 'Scoring & Ranking' },
  { to: '/official/participation', label: 'Participation' },
  { to: '/official/audit', label: 'Audit Trail' },
]

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'User Management' },
  { to: '/admin/criteria', label: 'Criteria' },
]

const RESIDENT_LINKS = [
  { to: '/resident/profile', label: 'My Profile' },
  { to: '/resident/score', label: 'My Score' },
  { to: '/resident/history', label: 'Participation History' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const links =
    user?.role === 'admin'
      ? ADMIN_LINKS
      : user?.role === 'official'
      ? OFFICIAL_LINKS
      : RESIDENT_LINKS

  return (
    <aside className="w-56 min-h-screen bg-gray-800 text-gray-200 flex flex-col py-6 shrink-0">
      <nav className="flex flex-col gap-1 px-3">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-4 py-2 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
