import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import faddssLogo from '../../assets/faddss-logo.svg'
import faddssLogoLight from '../../assets/faddss-logo-light.svg'

const FEATURES = [
  {
    title: 'Household-first profiling',
    text: 'Encode households, families, and resident profile members in the proper structure.',
    icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-8h6v8" />,
  },
  {
    title: 'Transparent weighted scoring',
    text: 'Configurable criteria and normalization support evidence-based selection.',
    icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  },
  {
    title: 'Accountability records',
    text: 'Audit logs, profile changes, and participation records support transparency.',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const username = form.username.trim()
    if (!username || !form.password) {
      setError('Username and password are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await login(username, form.password)
      if (user.role === 'admin') navigate('/admin/dashboard')
      else if (user.role === 'official') navigate('/official/dashboard')
      else navigate('/resident/profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please check your username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="flex min-h-screen">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary-900 p-12 text-white lg:flex lg:w-1/2 xl:w-[55%]">
          <div>
            <Link to="/">
              <img src={faddssLogoLight} alt="FADDSS" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-civic-300">Fair Aid Distribution DSS</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Secure barangay decisions,<br />
                <span className="text-primary-200">built on verified data.</span>
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-primary-100/85">
                FADDSS supports transparent TUPAD applicant selection with household records, weighted scoring, audit trails, and resident access in one secure system.
              </p>
            </div>

            <div className="space-y-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="shrink-0 text-civic-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      {feature.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-primary-100/70">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-primary-200/55">TUPAD - DOLE Region V - Camarines Norte</p>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[410px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <img src={faddssLogo} alt="FADDSS" className="h-14 w-auto" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lift">
              <div className="mb-7">
                <p className="page-section-label">Secure Access</p>
                <h2 className="mt-1 text-2xl font-bold text-ink-900">Sign in to your account</h2>
                <p className="mt-1 text-sm text-ink-500">Use your barangay-issued username and password.</p>
              </div>

              {error && (
                <div className="alert-error mb-5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="form-input"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="form-input pr-20"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-1 right-1 rounded-md px-3 text-xs font-semibold text-primary-800 transition hover:bg-primary-50"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-[15px]">
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                        <path d="M21 12a9 9 0 00-9-9" />
                      </svg>
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                <Link to="/" className="font-semibold text-primary-800 hover:text-primary-900">Back to public page</Link>
                <span className="text-ink-400">Barangay issued accounts only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

