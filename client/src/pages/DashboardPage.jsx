import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../api/http'

function DashboardPage() {
  const navigate = useNavigate()
  const [activeZone, setActiveZone] = useState('connect')
  const [activeGraph, setActiveGraph] = useState('trend')
  const [stats, setStats] = useState([
    { label: 'Total Company Entries', value: '0' },
    { label: 'Open Discussions', value: '0' },
    { label: 'FAQ Entries', value: '0' },
    { label: 'Shared Resumes', value: '0' },
  ])
  const [animatedStats, setAnimatedStats] = useState([
    { label: 'Total Company Entries', value: '0' },
    { label: 'Open Discussions', value: '0' },
    { label: 'FAQ Entries', value: '0' },
    { label: 'Shared Resumes', value: '0' },
  ])

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('pmCurrentUser') || 'null') || {}
    } catch {
      return {}
    }
  }, [])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [placementsResponse, internshipsResponse, discussionResponse, faqResponse, resumeResponse] = await Promise.all([
          http.get('/v1/placements'),
          http.get('/v1/internships'),
          http.get('/v1/discussion'),
          http.get('/v1/faq'),
          http.get('/v1/resumes'),
        ])

        const placements = placementsResponse.data?.data || []
        const internships = internshipsResponse.data?.data || []
        const discussions = discussionResponse.data?.data || []
        const faqs = faqResponse.data?.data || []
        const resumes = resumeResponse.data?.data || []

        setStats([
          { label: 'Total Company Entries', value: String(placements.length + internships.length) },
          { label: 'Open Discussions', value: String(discussions.length) },
          { label: 'FAQ Entries', value: String(faqs.length) },
          { label: 'Shared Resumes', value: String(resumes.length) },
        ])
      } catch {
        setStats([
          { label: 'Companies Visited', value: '0' },
          { label: 'Open Discussions', value: '0' },
          { label: 'FAQ Entries', value: '0' },
          { label: 'Shared Resumes', value: '0' },
        ])
      }
    }

    void fetchDashboardStats()

    const refreshTimer = window.setInterval(() => {
      void fetchDashboardStats()
    }, 30000)

    const handleFocus = () => {
      void fetchDashboardStats()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void fetchDashboardStats()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(refreshTimer)
    }
  }, [])

  useEffect(() => {
    const targetValues = stats.map((item) => Number(item.value) || 0)
    const startTime = performance.now()
    const durationMs = 600

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / durationMs, 1)

      setAnimatedStats(
        stats.map((item, index) => ({
          ...item,
          value: String(Math.round(targetValues[index] * progress)),
        })),
      )

      if (progress < 1) {
        window.requestAnimationFrame(animate)
      }
    }

    const frameId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [stats])

  const dashboardZones = {
    connect: {
      title: 'Connect',
      subtitle: 'Strengthen peer network with doubts and collaborative learning.',
      tone: 'from-orange-600 to-amber-500',
      actions: [
        { label: 'Open Discussion', description: 'Post and reply to placement questions.', to: '/discussion' },
        { label: 'Explore FAQs', description: 'Review solved doubts and interview tips.', to: '/faq' },
      ],
    },
    build: {
      title: 'Build',
      subtitle: 'Shape your profile with company intelligence and resume references.',
      tone: 'from-amber-600 to-orange-500',
      actions: [
        { label: 'Resume Library', description: 'Compare and learn from shared resumes.', to: '/resumes' },
        { label: 'Placement Records', description: 'Track eligibility and company process.', to: '/placements' },
      ],
    },
    execute: {
      title: 'Execute',
      subtitle: 'Move from preparation to action with practical readiness steps.',
      tone: 'from-orange-500 to-amber-400',
      actions: [
        { label: 'Readiness Check', description: 'Run your current readiness assessment.', to: '/readiness' },
        { label: 'Application Tracker', description: 'Manage applications and follow-ups.', to: '/applications' },
      ],
    },
  }

  const activeZoneData = dashboardZones[activeZone]
  const zoneCounters = useMemo(
    () => [
      {
        key: 'connect',
        label: 'Connect Score',
        value: Number(stats[1]?.value || 0) + Number(stats[2]?.value || 0),
        helper: 'Discussion + FAQ activity',
      },
      {
        key: 'build',
        label: 'Build Score',
        value: Number(stats[0]?.value || 0) + Number(stats[3]?.value || 0),
        helper: 'Company entries + Resume resources',
      },
      {
        key: 'execute',
        label: 'Execute Score',
        value: Number(stats[0]?.value || 0) + Math.ceil(Number(stats[3]?.value || 0) / 2),
        helper: 'Opportunity + profile readiness',
      },
    ],
    [stats],
  )
  const chartMetrics = useMemo(
    () => [
      { label: 'Entries', value: Number(stats[0]?.value || 0), to: '/placements' },
      { label: 'Discussion', value: Number(stats[1]?.value || 0), to: '/discussion' },
      { label: 'FAQ', value: Number(stats[2]?.value || 0), to: '/faq' },
      { label: 'Resumes', value: Number(stats[3]?.value || 0), to: '/resumes' },
    ],
    [stats],
  )
  const relationMetrics = useMemo(
    () => [
      {
        label: 'Peer Knowledge',
        value: Number(stats[1]?.value || 0) + Number(stats[2]?.value || 0),
        color: 'bg-orange-500',
      },
      {
        label: 'Market Coverage',
        value: Number(stats[0]?.value || 0),
        color: 'bg-amber-500',
      },
      {
        label: 'Profile Strength',
        value: Number(stats[3]?.value || 0),
        color: 'bg-orange-300',
      },
    ],
    [stats],
  )
  const maxRelationValue = Math.max(...relationMetrics.map((metric) => metric.value), 1)
  const maxMetricValue = Math.max(...chartMetrics.map((metric) => metric.value), 1)
  const chartWidth = 520
  const chartHeight = 220
  const padX = 34
  const padY = 24
  const chartPoints = chartMetrics.map((metric, index) => {
    const x = padX + (index * (chartWidth - padX * 2)) / (chartMetrics.length - 1)
    const normalized = metric.value / maxMetricValue
    const y = chartHeight - padY - normalized * (chartHeight - padY * 2)
    return { ...metric, x, y }
  })
  const chartLinePath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')

  return (
    <section className="space-y-6 animate-fade-up">
      <div className="rounded-3xl border border-orange-300/20 bg-gradient-to-r from-slate-950 via-orange-950 to-amber-950 p-8 text-white shadow-[0_30px_90px_-30px_rgba(251,146,60,0.5)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-100">
          Placement Dashboard
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome back, {currentUser.name || 'Placement Aspirant'}</h1>
            <p className="mt-3 text-sm leading-6 text-orange-100 sm:text-base">
              Monitor your preparation, explore community resources, and access the right tools for every placement step.
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-slate-100 shadow-sm backdrop-blur">
            <p className="font-semibold text-white">Next milestone</p>
            <p className="mt-1">Complete one discussion post and upload a resume sample.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {animatedStats.map((item) => (
          <article key={item.label} className="rounded-3xl border border-orange-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.9))] p-6 shadow-lg shadow-orange-950/20">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-orange-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(20,10,3,0.92))] p-6 shadow-lg shadow-orange-950/15">
          <h2 className="text-xl font-semibold text-white">Preparation Control Center</h2>
          <p className="mt-2 text-sm text-slate-500">Switch zones and jump into the right task for your current placement stage.</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { key: 'connect', label: 'Connect' },
              { key: 'build', label: 'Build' },
              { key: 'execute', label: 'Execute' },
            ].map((zone) => (
              <button
                key={zone.key}
                type="button"
                onClick={() => setActiveZone(zone.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeZone === zone.key
                    ? 'border border-orange-200/50 bg-orange-400 text-slate-950 shadow-md'
                    : 'border border-slate-700/70 bg-slate-950/70 text-slate-300 hover:border-orange-300/40 hover:bg-slate-900'
                }`}
              >
                {zone.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {zoneCounters.map((counter) => (
              <button
                key={counter.key}
                type="button"
                onClick={() => setActiveZone(counter.key)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  activeZone === counter.key
                    ? 'border-orange-300/60 bg-orange-400/15 text-orange-50 shadow-md'
                    : 'border-slate-700/70 bg-slate-950/70 hover:border-orange-300/40 hover:bg-slate-900'
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase ${activeZone === counter.key ? 'text-slate-200' : 'text-slate-500'}`}>
                  {counter.label}
                </p>
                <p className="mt-1 text-2xl font-bold">{counter.value}</p>
                <p className={`mt-1 text-[11px] ${activeZone === counter.key ? 'text-slate-200' : 'text-slate-500'}`}>
                  {counter.helper}
                </p>
              </button>
            ))}
          </div>

          <div className={`mt-5 rounded-3xl border border-white/10 bg-gradient-to-r ${activeZoneData.tone} p-5 text-white shadow-md`}>
            <p className="text-lg font-bold">{activeZoneData.title}</p>
            <p className="mt-1 text-sm text-white/85">{activeZoneData.subtitle}</p>
          </div>

          <div className="mt-4 grid gap-3">
            {activeZoneData.actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className="group rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-slate-900"
              >
                <span className="block text-base font-semibold text-white group-hover:text-orange-200">{action.label}</span>
                <span className="mt-1 block text-sm text-slate-600">{action.description}</span>
              </button>
            ))}
          </div>
        </div>

          <div className="rounded-3xl border border-amber-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(20,10,3,0.92))] p-6 shadow-lg shadow-amber-950/15">
            <h2 className="text-xl font-semibold text-white">Activity Graph Snapshot</h2>
          <p className="mt-2 text-sm text-slate-500">A live visual of your platform activity and relationship between learning and opportunity signals.</p>

            <div className="mt-4 inline-flex rounded-full border border-slate-700 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveGraph('trend')}
              className={`rounded-full px-3 py-1 transition ${
                  activeGraph === 'trend' ? 'bg-orange-400 text-slate-950' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Trend Line
            </button>
            <button
              type="button"
              onClick={() => setActiveGraph('relation')}
              className={`rounded-full px-3 py-1 transition ${
                activeGraph === 'relation' ? 'bg-orange-400 text-slate-950' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Relation View
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-700 bg-slate-950/70 p-4">
            {activeGraph === 'trend' ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-56 w-full" role="img" aria-label="Dashboard activity line graph">
                <defs>
                  <linearGradient id="activityLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                <line x1={padX} y1={chartHeight - padY} x2={chartWidth - padX} y2={chartHeight - padY} stroke="#cbd5e1" strokeWidth="1" />

                <path d={chartLinePath} fill="none" stroke="url(#activityLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                {chartPoints.map((point) => (
                  <g key={point.label}>
                    <circle cx={point.x} cy={point.y} r="6" fill="#0f172a" stroke="#fb923c" strokeWidth="3" />
                    <text x={point.x} y={point.y - 12} textAnchor="middle" className="fill-slate-200 text-[11px] font-semibold">
                      {point.value}
                    </text>
                    <text x={point.x} y={chartHeight - 6} textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
                      {point.label}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="space-y-3">
                {relationMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>{metric.label}</span>
                      <span>{metric.value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800">
                      <div
                        className={`h-3 rounded-full ${metric.color} transition-all duration-500`}
                        style={{ width: `${Math.max((metric.value / maxRelationValue) * 100, metric.value ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-xs text-slate-400">
                  Relation View compares knowledge activity, market coverage, and profile strength to highlight balance in preparation.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {chartMetrics.map((metric) => (
              <button
                key={metric.label}
                type="button"
                onClick={() => navigate(metric.to)}
                className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-left transition hover:border-orange-300/40 hover:bg-slate-900"
              >
                <span className="text-sm font-semibold text-slate-200">{metric.label}</span>
                <span className="text-base font-bold text-white">{metric.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
