function PlacementReadinessPage() {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900/75 p-6 shadow-sm animate-fade-up sm:p-10">
      <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
        Placement Readiness Check
      </h1>

      <p className="mt-4 text-base text-slate-300 sm:text-lg">
        Check your placement readiness.
      </p>

      <button
        type="button"
        onClick={() => {
          window.open('https://placement-mini-project.vercel.app/', '_blank', 'noopener,noreferrer')
        }}
        className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Check Readiness
      </button>

      <p className="mt-6 rounded-xl border border-amber-700/50 bg-amber-900/35 px-4 py-3 text-sm text-amber-200">
        This is AI prediction which may be false. Just for reference we have given
        this option to check readiness.
      </p>
    </section>
  )
}

export default PlacementReadinessPage
