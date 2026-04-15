import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import http from '../api/http'

const statusStyles = {
  Applied: 'bg-sky-900/40 text-sky-200 border border-sky-700/50',
  Interview: 'bg-amber-900/40 text-amber-200 border border-amber-700/50',
  Rejected: 'bg-rose-900/40 text-rose-200 border border-rose-700/50',
  Selected: 'bg-emerald-900/40 text-emerald-200 border border-emerald-700/50',
}

const emptyForm = {
  companyName: '',
  role: '',
  status: 'Applied',
  dateApplied: '',
  notes: '',
}

function ApplicationTrackerPage() {
  const [applications, setApplications] = useState([])
  const [formValues, setFormValues] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(true)

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('pmCurrentUser') || 'null') || {}
    } catch {
      return {}
    }
  }, [])

  useEffect(() => {
    void fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const response = await http.get('/v1/applications')
      setApplications(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load applications.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormValues(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      ...formValues,
      companyName: formValues.companyName.trim(),
      role: formValues.role.trim(),
      status: formValues.status,
      dateApplied: formValues.dateApplied,
      notes: formValues.notes.trim(),
    }

    if (!payload.companyName || !payload.role || !payload.dateApplied) {
      toast.error('Company, role, and date applied are required.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await http.put(`/v1/applications/${editingId}`, payload)
        toast.success('Application updated successfully.')
      } else {
        await http.post('/v1/applications', payload)
        toast.success('Application added successfully.')
      }
      resetForm()
      void fetchApplications()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save application.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (application) => {
    setEditingId(application._id)
    setFormValues({
      companyName: application.companyName || '',
      role: application.role || '',
      status: application.status || 'Applied',
      dateApplied: String(application.dateApplied || '').slice(0, 10),
      notes: application.notes || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Delete this application?')) {
      return
    }

    try {
      await http.delete(`/v1/applications/${applicationId}`)
      toast.success('Application deleted.')
      void fetchApplications()
      if (editingId === applicationId) {
        resetForm()
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete application.')
    }
  }

  return (
    <section className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
        <p className="text-sm text-slate-500 sm:text-base">
          Track all your applications, update statuses, and keep notes for every opportunity.
        </p>
        <p className="text-sm text-slate-500">
          Logged in as <strong>{currentUser.name || 'Student User'}</strong>.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Applications</h2>
              <p className="mt-1 text-sm text-slate-500">Manage your open applications and progress.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value)
                if (showForm) {
                  resetForm()
                }
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
            >
              {showForm ? 'Hide form' : 'Show form'}
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Applied</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan={5}>
                      Loading applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan={5}>
                      No applications yet. Add one using the form.
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application._id} className="border-t border-slate-200">
                      <td className="px-4 py-4 text-slate-900">{application.companyName}</td>
                      <td className="px-4 py-4 text-slate-900">{application.role}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[application.status] || 'bg-slate-100 text-slate-700'}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{new Date(application.dateApplied).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(application)}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(application._id)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit Application' : 'Add Application'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingId ? 'Update application details or status.' : 'Save a new application to your tracker.'}
              </p>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Company</span>
                <input
                  name="companyName"
                  value={formValues.companyName}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, companyName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
                  placeholder="Company name"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Role</span>
                <input
                  name="role"
                  value={formValues.role}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, role: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
                  placeholder="Job title or internship role"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Status</span>
                  <select
                    name="status"
                    value={formValues.status}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
                  >
                    <option>Applied</option>
                    <option>Interview</option>
                    <option>Rejected</option>
                    <option>Selected</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Date Applied</span>
                  <input
                    type="date"
                    name="dateApplied"
                    value={formValues.dateApplied}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, dateApplied: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  value={formValues.notes}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, notes: event.target.value }))}
                  rows={4}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
                  placeholder="Optional notes about this role or interview steps"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {editingId ? 'Update Application' : 'Add Application'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          )}
        </aside>
      </div>
    </section>
  )
}

export default ApplicationTrackerPage
