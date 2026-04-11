function PlacementReadinessPage() {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-up sm:p-10">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Placement Readiness Check
      </h1>

      <p className="mt-4 text-base text-slate-700 sm:text-lg">
        Check your placement readiness.
      </p>

      <button
        type="button"
        onClick={() => {
          window.open('https://placement-mini-project.vercel.app/', '_blank', 'noopener,noreferrer')
        }}
        className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Check Readiness
      </button>

      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        This is AI prediction which may be false. Just for reference we have given
        this option to check readiness.
      </p>
    </section>
  )
}

export default PlacementReadinessPage
