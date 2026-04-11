function CommunityFaqPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Community Discussion and FAQ Platform
        </h1>
        <p className="text-sm text-slate-500 sm:text-base">
          Ask questions, share interview experiences, and learn from peer answers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Open Discussion Forum</h2>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
              How was the Cognizant interview round?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Posted by Priya Patil (TE Computer) • 2 comments
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
              Most asked DSA topics for product companies?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Posted by Rohan Kulkarni (BE IT) • 5 comments
            </p>
          </article>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">FAQ and Knowledge Base</h2>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
              What CGPA is usually required for mass recruiters?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Most companies keep a 6.5 to 7.0 cut-off, but always check placement eligibility.
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">Posted by Ananya Joshi (TE ENTC)</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
              Should we focus on aptitude or coding first?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Build a balanced plan. Aptitude helps clear round one while coding helps final selection.
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">Posted by Aditya More (BE Mechanical)</p>
          </article>
        </section>
      </div>
    </section>
  )
}

export default CommunityFaqPage
