import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-primary-900 text-white px-6 py-3 flex items-center justify-between shadow">
      <span className="font-bold text-lg tracking-wide">FADDSS</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="opacity-75">{user?.full_name}</span>
        <span className="px-2 py-0.5 bg-primary-700 rounded-full text-xs uppercase tracking-wider">
          {user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-white text-primary-900 rounded hover:bg-gray-100 font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
