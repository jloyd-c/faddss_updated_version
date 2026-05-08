import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const FEATURES = [
  {
    title: 'Household Profiling',
    text: 'Encode household records, family groups, and resident profiles in the correct barangay structure.',
    icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-8h6v8" />,
  },
  {
    title: 'Family & Beneficiaries',
    text: 'Maintain beneficiary records, eligibility, sector membership, and TUPAD socio-economic indicators.',
    icon: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
  },
  {
    title: 'Weighted Ranking',
    text: 'Generate transparent TUPAD rankings using active criteria, weights, household limits, and priority rules.',
    icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  },
  {
    title: 'Audit & Security',
    text: 'Support accountability through audit logs, profile-change history, and insert-only participation records.',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
  },
]

const PROCESS = [
  { step: '01', title: 'Household Registration', desc: 'Encode household records with unique codes and barangay addresses.' },
  { step: '02', title: 'Beneficiary Encoding', desc: 'Add family members with socio-economic profiles and TUPAD eligibility indicators.' },
  { step: '03', title: 'Criteria Configuration', desc: 'Set up COST/BENEFIT scoring criteria with weights and field mappings.' },
  { step: '04', title: 'Application Period', desc: 'Open a program cycle, set slot and household caps, mark qualifying applicants.' },
  { step: '05', title: 'Weighted Ranking', desc: 'Run the scoring engine to rank applicants using normalized WSM.' },
  { step: '06', title: 'Participation Recording', desc: 'Confirm beneficiaries with insert-only, audit-logged participation entries.' },
]

const STATS = [
  {
    label: 'Scoring Method', value: 'WSM',
    icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  },
  {
    label: 'Role Tiers', value: '3 Levels',
    icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
  },
  {
    label: 'Audit Records', value: 'Insert-Only',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
  },
  {
    label: 'Resident Access', value: 'Read Portal',
    icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  },
]

const TRUST_TAGS = ['DOLE TUPAD Compliant', 'Role-Based Access', 'Audit-Logged Actions', 'WSM Scoring Engine']

const PANEL_STEPS = [
  { label: 'Household',     desc: 'Register household records' },
  { label: 'Family',        desc: 'Encode family members' },
  { label: 'Beneficiaries', desc: 'Complete eligibility profiles' },
  { label: 'Indicators',    desc: 'Enter socio-economic data' },
  { label: 'Ranking',       desc: 'Compute weighted scores' },
  { label: 'Participation', desc: 'Record confirmed beneficiaries' },
]

function useScrollReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.disconnect() } },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function useStaggerReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-staggered'); obs.disconnect() } },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

export default function Landing() {
  const featuresHeaderRef = useScrollReveal()
  const featuresCardsRef  = useStaggerReveal()
  const processHeaderRef  = useScrollReveal()
  const processCardsRef   = useStaggerReveal()

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-100 bg-primary-900 text-xs font-bold text-white shadow-sm">
              BB
            </div>
            <div>
              <p className="text-sm font-bold text-ink-900">Barangay Batobalani FADDSS</p>
              <p className="text-xs text-ink-500">Fair Aid Distribution Decision Support System</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-600 md:flex">
            <a href="#features" className="transition-colors hover:text-primary-900">Features</a>
            <a href="#process"  className="transition-colors hover:text-primary-900">Process</a>
            <Link to="/login" className="btn-primary">Portal Login</Link>
          </nav>
          <Link to="/login" className="btn-primary md:hidden">Login</Link>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute inset-0 landing-dot-grid opacity-40" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-primary-50 opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-60 w-60 rounded-full bg-civic-50 opacity-60 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:px-8 lg:py-12">
            {/* Left */}
            <div>
              <span className="badge bg-civic-100 text-civic-700 animate-slide-up">
                Barangay Batobalani · TUPAD Transparency
              </span>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-ink-900 lg:text-5xl animate-slide-up-d1">
                Fair TUPAD Selection for Barangay Batobalani
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-ink-600 animate-slide-up-d2">
                FADDSS helps barangay officials manage household profiling, applicant marking, weighted ranking, audit logs, and resident transparency through one secure decision-support system.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row animate-slide-up-d3">
                <Link to="/login" className="btn-primary justify-center px-5 py-2.5">Official Portal</Link>
                <Link to="/login" className="btn-secondary justify-center px-5 py-2.5">Resident Portal</Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 animate-slide-up-d4">
                {TRUST_TAGS.map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emeraldGov-600">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — slide-up entrance then gentle float */}
            <div className="hero-card-enter">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-lift">
                {/* Snapshot grid */}
                <div className="rounded-xl bg-primary-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-200">System Snapshot</p>
                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-emeraldGov-100 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Snapshot label="Data-driven" value="WSM" />
                    <Snapshot label="Records"     value="Audited" />
                    <Snapshot label="Access"      value="Role-based" />
                    <Snapshot label="Portal"      value="Resident" />
                  </div>
                </div>
                {/* Process steps list */}
                <div className="mt-3 grid gap-1.5">
                  {PANEL_STEPS.map((item, i) => (
                    <div
                      key={item.label}
                      className="panel-step flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-all duration-200 hover:border-primary-200 hover:shadow-card"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-900">{i + 1}</span>
                      <div>
                        <p className="text-[13px] font-semibold leading-none text-ink-700">{item.label}</p>
                        <p className="mt-0.5 text-[10px] text-ink-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats stripe ── */}
        <section className="border-b border-slate-200 bg-primary-900">
          <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {STATS.map((stat, i) => (
                <div key={stat.label} className={`flex items-center gap-3 ${i > 0 ? 'md:border-l md:border-white/10 md:pl-4' : ''}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-primary-200">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      {stat.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-400">{stat.label}</p>
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-9 lg:px-8">
          <div ref={featuresHeaderRef} className="mb-5 reveal-section">
            <p className="page-section-label">Core Modules</p>
            <h2 className="mt-1 text-xl font-bold text-ink-900 lg:text-2xl">Built for fairness, transparency, and accountability</h2>
            <p className="mt-1.5 max-w-lg text-sm text-ink-500">Each module supports a stage of the TUPAD selection process — from encoding to participation recording.</p>
          </div>
          <div ref={featuresCardsRef} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 stagger-container">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="stagger-child feature-card-accent overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-card hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lift group cursor-default"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-900 transition-colors duration-200 group-hover:bg-primary-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-ink-900">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-ink-500">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Process ── */}
        <section id="process" className="border-t border-slate-200 bg-white px-5 py-9 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div ref={processHeaderRef} className="mb-6 reveal-section">
              <p className="page-section-label">How It Works</p>
              <h2 className="mt-1 text-xl font-bold text-ink-900 lg:text-2xl">The TUPAD selection workflow, step by step</h2>
              <p className="mt-1.5 text-sm text-ink-500">From household registration to participation — a structured, audited six-step process.</p>
            </div>
            <div ref={processCardsRef} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 stagger-container">
              {PROCESS.map((item) => (
                <div
                  key={item.step}
                  className="stagger-child rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lift"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-900 text-sm font-bold text-white">{item.step}</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <h3 className="text-sm font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-ink-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-slate-200 bg-primary-900 px-5 py-9 text-white lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-300">Get Started</p>
            <h2 className="mt-2 text-xl font-bold lg:text-2xl">Access the FADDSS Portal</h2>
            <p className="mt-3 text-sm leading-6 text-primary-100/75">
              Barangay-issued accounts provide access to official and administrative functions. Residents may view their profile and TUPAD participation history.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-primary-900 shadow-sm transition-all hover:bg-primary-50 active:scale-[0.98]"
              >
                Official Portal
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98]"
              >
                Resident Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-900 text-[9px] font-bold text-white">BB</div>
            <span>Barangay Batobalani · Paracale, Camarines Norte</span>
          </div>
          <span className="text-xs text-ink-400">FADDSS — DOLE TUPAD Region V · Capstone Research System</span>
        </div>
      </footer>
    </div>
  )
}

function Snapshot({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-2.5 transition-colors hover:bg-white/15">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-200">{label}</p>
      <p className="mt-0.5 text-base font-bold text-white">{value}</p>
    </div>
  )
}
