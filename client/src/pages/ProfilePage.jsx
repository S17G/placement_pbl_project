function ProfilePage() {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
      <p className="text-sm text-slate-500">Manage academic details, skills, and your latest resume.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Name" />
        <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="PRN" />
        <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Branch" />
        <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="CGPA" />
        <textarea className="sm:col-span-2 min-h-28 rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Skills, projects, achievements" />
        <input className="sm:col-span-2" type="file" accept="application/pdf" />
      </div>

      <button type="button" className="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white">
        Save Profile
      </button>
    </section>
  )
}

export default ProfilePage
