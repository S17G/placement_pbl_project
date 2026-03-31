function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-cyan-600 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">
          Campus Placement Platform
        </p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          PlaceMate Student Hub
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">
          Track opportunities, collaborate with peers, and prepare smarter with
          real placement insights.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Companies Visited', '42'],
          ['Open Discussions', '128'],
          ['FAQ Entries', '76'],
          ['Shared Resumes', '53'],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DashboardPage
