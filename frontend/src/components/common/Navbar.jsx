import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS = {
  admin: 'Administrator',
  official: 'Barangay Official',
  resident: 'Resident',
}

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.full_name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') ?? 'U'

  return (
    <nav className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-primary-800 bg-primary-900 px-5 text-white shadow-soft">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition hover:bg-white/20 lg:hidden"
          aria-label="Open navigation"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-primary-100">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <span className="block text-[13px] font-bold leading-tight tracking-wide">FADDSS</span>
            <span className="block text-[10px] leading-tight text-primary-200/70">Brgy. Batobalani - TUPAD DSS</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden flex-col items-end text-right sm:flex">
          <span className="text-[13px] font-semibold leading-tight">{user?.full_name}</span>
          <span className="text-[10px] leading-tight text-primary-200/70">{ROLE_LABELS[user?.role] ?? user?.role}</span>
        </div>
        <div
          title={user?.full_name}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold ring-2 ring-white/20"
        >
          {initials}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold transition hover:bg-white/20 active:scale-95"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
