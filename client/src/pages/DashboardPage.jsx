import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('pmCurrentUser') || 'null') || {}
    } catch {
      return {}
    }
  }, [])

  const quickActions = [
    {
      label: 'Join the Discussion',
      description: 'Read and post placement questions from peers.',
      to: '/discussion',
      accent: 'from-cyan-600 to-sky-500',
    },
    {
      label: 'Browse FAQs',
      description: 'Search answers to interview and placement doubts.',
      to: '/faq',
      accent: 'from-emerald-600 to-cyan-500',
    },
    {
      label: 'Resume Library',
      description: 'View and upload shared successful resumes.',
      to: '/resumes',
      accent: 'from-violet-600 to-fuchsia-500',
    },
    {
      label: 'Placement Records',
      description: 'Review recent company visits and eligibility details.',
      to: '/placements',
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Readiness Check',
      description: 'Access the placement readiness evaluation tool.',
      to: '/readiness',
      accent: 'from-slate-900 to-slate-700',
    },
  ]

  const stats = [
    { label: 'Companies Visited', value: '42' },
    { label: 'Open Discussions', value: '128' },
    { label: 'FAQ Entries', value: '76' },
    { label: 'Shared Resumes', value: '53' },
  ]

  return (
    <section className="space-y-6 animate-fade-up">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-700 to-emerald-600 p-8 text-white shadow-lg sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-100">
          Placement Dashboard
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome back, {currentUser.name || 'Placement Aspirant'}</h1>
            <p className="mt-3 text-sm leading-6 text-cyan-100 sm:text-base">
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
        {stats.map((item) => (
          <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
          <p className="mt-2 text-sm text-slate-500">Jump directly into the most useful sections for your preparation.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${action.accent} px-4 py-4 text-left text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:shadow-lg`}
              >
                <span className="block text-base">{action.label}</span>
                <span className="mt-2 block text-xs font-normal text-white/80">{action.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Your Placement Focus</h2>
          <p className="mt-2 text-sm text-slate-500">Use the dashboard to track your progress across discussions, FAQs, resumes, placements, and readiness checks.</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">Discussion activity</p>
              <p className="mt-1 text-sm text-slate-600">Post your placement questions and review answers from peers.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">Resume library</p>
              <p className="mt-1 text-sm text-slate-600">Compare sample resumes and keep your own resume ready.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">Placement readiness</p>
              <p className="mt-1 text-sm text-slate-600">Run the readiness tool before every major recruitment cycle.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
