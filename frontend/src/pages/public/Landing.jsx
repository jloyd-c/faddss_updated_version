import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import barangayHallImage from '../../assets/barangay-hall.jpg'
import faddssLogo from '../../assets/faddss-logo.svg'

const FEATURES = [
  {
    title: 'Household Profiling',
    text: 'Encode household records, family groups, and resident profiles in the correct barangay structure.',
    icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-8h6v8" />,
  },
  {
    title: 'Family & Resident Profiles',
    text: 'Maintain resident profile records, eligibility, sector membership, and TUPAD socio-economic indicators.',
    icon: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
  },
  {
    title: 'Weighted Ranking',
    text: 'Generate transparent TUPAD rankings using active criteria, percentage weights, household limits, and priority rules.',
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
  { step: '02', title: 'Resident Profile Encoding', desc: 'Add family members with socio-economic profiles and TUPAD eligibility indicators.' },
  { step: '03', title: 'Criteria Configuration', desc: 'Set up COST/BENEFIT scoring criteria with percentage weights and field mappings.' },
  { step: '04', title: 'Application Period', desc: 'Open a program cycle, set slot and household caps, mark qualifying applicants.' },
  { step: '05', title: 'Weighted Ranking', desc: 'Run the scoring engine to rank applicants using normalized WSM.' },
  { step: '06', title: 'Participation Recording', desc: 'Confirm Resident Profiles with insert-only, audit-logged participation entries.' },
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
  { label: 'Household', desc: 'Register household records' },
  { label: 'Family', desc: 'Encode family members' },
  { label: 'Resident Profiles', desc: 'Complete eligibility profiles' },
  { label: 'Indicators', desc: 'Enter socio-economic data' },
  { label: 'Ranking', desc: 'Compute weighted scores' },
  { label: 'Participation', desc: 'Record confirmed Resident Profiles' },
]

const STEP_STATES = ['done', 'done', 'active', 'pending', 'pending', 'pending']

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
  const featuresCardsRef = useStaggerReveal()
  const processHeaderRef = useScrollReveal()
  const processCardsRef = useStaggerReveal()

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <img src={faddssLogo} alt="FADDSS — Barangay Batobalani" className="h-12 w-auto" />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-600 md:flex">
            <a href="#features" className="transition-colors hover:text-primary-900">Features</a>
            <a href="#process" className="transition-colors hover:text-primary-900">Process</a>
            <Link to="/login" className="btn-primary">Portal Login</Link>
          </nav>
          <Link to="/login" className="btn-primary md:hidden">Login</Link>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="landing-sample-hero border-b border-slate-200">
          {/* Background image */}
          <img
            src={barangayHallImage}
            aria-hidden="true"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[center_40%] opacity-[0.4] saturate-[0.9]"
          />
          {/* Gradient: opaque-white on left → transparent right so image shows through on card side */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/80 via-white/36 to-white/0" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-5 lg:grid-cols-2 lg:gap-14 lg:px-8">

            {/* ── LEFT: Text ── */}
            <div className="relative z-10">
              <span className="landing-fade-up landing-delay-1 inline-flex items-center rounded-full border border-civic-300 bg-civic-100 px-3 py-1 text-[11px] font-semibold tracking-[0.03em] text-civic-700">
                Barangay Batobalani · TUPAD Transparency
              </span>
              <h1 className="landing-fade-up landing-delay-2 mt-4 text-[clamp(1.85rem,3.5vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink-800">
                Fair TUPAD Selection for<br className="hidden sm:block" /> Barangay Batobalani
              </h1>
              <p className="landing-fade-up landing-delay-3 mt-4 max-w-[430px] text-[15px] font-normal leading-7 text-ink-600">
                FADDSS helps barangay officials manage household profiling, applicant marking, weighted ranking, audit logs, and resident transparency through one secure decision-support system.
              </p>
              <div className="landing-fade-up landing-delay-4 mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="btn-primary justify-center px-6 py-2.5 text-[14px]">Official Portal</Link>
                <Link to="/login" className="btn-secondary justify-center border-primary-700 px-6 py-2.5 text-[14px] text-primary-800 hover:bg-primary-900 hover:text-white">Resident Portal</Link>
              </div>
              <div className="landing-fade-up landing-delay-5 mt-6 flex flex-wrap gap-x-4 gap-y-2">
                {TRUST_TAGS.map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Mobile-only: compact stats grid replacing the card */}
              <div className="landing-fade-up landing-delay-5 mt-7 grid grid-cols-2 gap-2.5 lg:hidden">
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2.5 rounded-xl border border-primary-100 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-900 text-primary-100">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {stat.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{stat.label}</p>
                      <p className="text-sm font-bold text-ink-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Snapshot card — desktop only ── */}
            <div className="landing-fade-left relative z-10 hidden lg:flex lg:justify-end">
              <BetterSnapshotCard />
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
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

        {/* ── CORE MODULES ── */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div ref={featuresHeaderRef} className="mb-6 reveal-section">
            <p className="page-section-label">Core Modules</p>
            <h2 className="mt-1 text-xl font-bold text-ink-900 lg:text-2xl">Built for fairness, transparency, and accountability</h2>
            <p className="mt-1.5 max-w-lg text-sm text-ink-500">Each module supports a stage of the TUPAD selection process, from encoding to participation recording.</p>
          </div>
          <div ref={featuresCardsRef} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 stagger-container">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="stagger-child feature-card-accent group cursor-default overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lift"
              >
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900 transition-colors duration-200 group-hover:bg-primary-900 group-hover:text-white">
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

        {/* ── HOW IT WORKS ── */}
        <section id="process" className="border-t border-slate-200 bg-slate-50 px-5 py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div ref={processHeaderRef} className="mb-6 reveal-section">
              <p className="page-section-label">How It Works</p>
              <h2 className="mt-1 text-xl font-bold text-ink-900 lg:text-2xl">The TUPAD selection workflow, step by step</h2>
              <p className="mt-1.5 text-sm text-ink-500">From household registration to participation, a structured and audited six-step process.</p>
            </div>
            <div ref={processCardsRef} className="process-flow-grid grid gap-3 md:grid-cols-2 lg:grid-cols-3 stagger-container">
              {PROCESS.map((item) => (
                <div
                  key={item.step}
                  className="process-flow-card stagger-child group rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-primary-200 hover:shadow-lift"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="process-flow-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-900 text-sm font-bold text-white transition-transform group-hover:rotate-[-3deg]">
                      {item.step}
                    </span>
                    <div className="h-px flex-1 overflow-hidden bg-slate-100">
                      <div className="process-flow-line h-full bg-gradient-to-r from-primary-700 via-primary-400 to-transparent" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-ink-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-slate-200 bg-primary-900 px-5 py-14 text-white lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-300">Get Started</p>
            <h2 className="mt-2 text-xl font-bold lg:text-2xl">Access the FADDSS Portal</h2>
            <p className="mt-3 text-sm leading-6 text-primary-100/75">
              Barangay-issued accounts provide access to official and administrative functions. Residents may view their profile and TUPAD participation history.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-primary-900 shadow-sm transition-all hover:bg-primary-50 active:scale-[0.98]">
                Official Portal
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98]">
                Resident Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <img src={faddssLogo} alt="FADDSS" className="h-9 w-auto opacity-60" />
          <span className="text-xs text-ink-400">DOLE TUPAD Region V · Capstone Research System</span>
        </div>
      </footer>
    </div>
  )
}

/* ── Snapshot card (desktop hero, right column) ── */
function BetterSnapshotCard() {
  return (
    <div className="landing-float w-full max-w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
      <div className="bg-primary-900 px-5 pb-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">System Snapshot</p>
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <BetterStat label="Data-Driven" value="WSM" />
          <BetterStat label="Records" value="Audited" />
          <BetterStat label="Access" value="Role-based" />
          <BetterStat label="Portal" value="Resident" />
        </div>
      </div>

      <div className="bg-white">
        {PANEL_STEPS.map((step, i) => (
          <BetterWorkflowStep key={step.label} num={i + 1} step={step} />
        ))}
      </div>
    </div>
  )
}

function BetterStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/[0.07] px-3.5 py-3 transition-colors hover:bg-white/10">
      <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/45">{label}</p>
      <p className="mt-1 text-[17px] font-bold leading-none text-white">{value}</p>
    </div>
  )
}

function BetterWorkflowStep({ num, step }) {
  return (
    <div className="group flex cursor-default items-center gap-3.5 border-b border-slate-100 px-5 py-3 transition-all last:border-b-0 hover:bg-primary-50 hover:pl-6">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-xs font-bold text-primary-900 transition-colors group-hover:border-primary-900 group-hover:bg-primary-900 group-hover:text-white">
        {num}
      </span>
      <div>
        <p className="text-[13.5px] font-semibold leading-tight text-ink-800">{step.label}</p>
        <p className="mt-0.5 text-[11.5px] leading-tight text-ink-400">{step.desc}</p>
      </div>
    </div>
  )
}

function SnapshotCard() {
  return (
    <div className="landing-float w-full max-w-[340px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20">

      {/* Header + stats — dark gradient */}
      <div className="bg-gradient-to-br from-[#1e3a8a] to-[#0f2255] px-5 pb-4 pt-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/35">FADDSS</p>
            <p className="mt-0.5 text-[15px] font-bold text-white">System Snapshot</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.12] px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Active
          </span>
        </div>

        {/* 4 stat tiles */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Scoring Method" value="WSM" amber />
          <StatTile label="Role Tiers" value="3 Levels" />
          <StatTile label="Audit Records" value="Insert-Only" />
          <StatTile label="Resident Access" value="Read Portal" />
        </div>
      </div>

      {/* Workflow timeline — slightly darker */}
      <div className="bg-[#0c1d4a] px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-amber-400/70">TUPAD Workflow</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute bottom-3 left-[9px] top-3 w-px bg-white/10" />

          {PANEL_STEPS.map((step, i) => (
            <WorkflowStep key={step.label} num={i + 1} step={step} state={STEP_STATES[i]} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, amber = false }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 transition-colors ${
      amber
        ? 'border-amber-400/25 bg-amber-400/[0.12]'
        : 'border-white/10 bg-white/[0.06] hover:bg-white/10'
    }`}>
      <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/40">{label}</p>
      <p className={`mt-1 text-[15px] font-bold leading-none ${amber ? 'text-amber-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function WorkflowStep({ num, step, state }) {
  const cfg = {
    done:    { ring: 'bg-emerald-500 border-emerald-500',   numColor: 'text-white',      label: '✓', text: 'text-white/90', sub: 'text-white/50' },
    active:  { ring: 'bg-amber-400 border-amber-400',       numColor: 'text-amber-900',  label: num, text: 'text-white',    sub: 'text-white/60' },
    pending: { ring: 'bg-transparent border-white/[0.18]',  numColor: 'text-white/30',   label: num, text: 'text-white/35', sub: 'text-white/20' },
  }[state]

  return (
    <div className="relative flex items-start gap-3 py-[7px]">
      <span className={`z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${cfg.ring} ${cfg.numColor}`}>
        {cfg.label}
      </span>
      <div className="min-w-0">
        <p className={`text-[12px] font-semibold leading-tight ${cfg.text}`}>{step.label}</p>
        <p className={`mt-0.5 text-[10px] leading-tight ${cfg.sub}`}>{step.desc}</p>
      </div>
    </div>
  )
}

