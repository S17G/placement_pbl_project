import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import http from '../api/http'

const initialPlacementForm = {
  company: '',
  role: '',
  package: '',
  eligibility: '',
  process: '',
}

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('placements')
  const [placements, setPlacements] = useState([])
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [showPlacementForm, setShowPlacementForm] = useState(false)
  const [editingPlacementId, setEditingPlacementId] = useState(null)
  const [placementForm, setPlacementForm] = useState(initialPlacementForm)

  useEffect(() => {
    void refreshPlacements()
    void refreshRequests()
  }, [])

  const resetPlacementForm = () => {
    setPlacementForm(initialPlacementForm)
    setEditingPlacementId(null)
  }

  const refreshPlacements = async () => {
    try {
      const response = await http.get('/v1/placements')
      setPlacements(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch placement records.')
    }
  }

  const refreshRequests = async () => {
    try {
      const response = await http.get('/v1/admin/registration-requests')
      setRequests(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch registration requests.')
    }
  }

  const refreshUsers = async (searchValue = userSearch) => {
    try {
      const response = await http.get('/v1/admin/users', {
        params: searchValue.trim() ? { search: searchValue.trim() } : undefined,
      })
      setUsers(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch users.')
    }
  }

  const handlePlacementInput = (event) => {
    const { name, value } = event.target
    setPlacementForm((previous) => ({ ...previous, [name]: value }))
  }

  const handlePlacementSubmit = async (event) => {
    event.preventDefault()

    const values = Object.values(placementForm).map((value) => value.trim())
    if (values.some((value) => value.length === 0)) {
      toast.error('Please fill all placement details.')
      return
    }

    try {
      if (editingPlacementId) {
        await http.patch(`/v1/placements/${editingPlacementId}`, placementForm)
        toast.success('Placement record updated.')
      } else {
        await http.post('/v1/placements', placementForm)
        toast.success('Placement record added.')
      }

      await refreshPlacements()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save placement record.')
      return
    }

    resetPlacementForm()
    setShowPlacementForm(false)
  }

  const handlePlacementEdit = (record) => {
    setEditingPlacementId(record._id)
    setPlacementForm({
      company: record.company,
      role: record.role,
      package: record.package,
      eligibility: record.eligibility,
      process: record.process,
    })
    setShowPlacementForm(true)
  }

  const handlePlacementDelete = async (recordId) => {
    try {
      await http.delete(`/v1/placements/${recordId}`)
      toast.success('Placement record deleted.')
      await refreshPlacements()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete placement record.')
    }
  }

  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await http.patch(`/v1/admin/registration-requests/${requestId}/status`, {
        status,
      })

      toast.success(response.data?.message || 'Request status updated.')
      await refreshRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update request status.')
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await http.delete(`/v1/admin/users/${userId}`)
      toast.success('User deleted successfully.')
      await refreshUsers()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete user.')
    }
  }

  return (
    <section className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">TnP Admin Dashboard</h1>
        <p className="text-sm text-slate-500 sm:text-base">
          Manage placement records and student registration requests.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('placements')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            activeTab === 'placements'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 text-slate-700'
          }`}
        >
          Placement Records
        </button>
        <button
          type="button"
          onClick={() => {
            refreshRequests()
            setActiveTab('requests')
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 text-slate-700'
          }`}
        >
          Registration Requests
        </button>
        <button
          type="button"
          onClick={() => {
            refreshUsers()
            setActiveTab('users')
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 text-slate-700'
          }`}
        >
          Manage Users
        </button>
      </div>

      {activeTab === 'placements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-800">Placement Management</p>
              <p className="text-xs text-slate-500">Add, edit, or delete placement records.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showPlacementForm) {
                  resetPlacementForm()
                }
                setShowPlacementForm((previous) => !previous)
              }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              {showPlacementForm ? 'Close Form' : 'Add Record'}
            </button>
          </div>

          {showPlacementForm && (
            <form
              onSubmit={handlePlacementSubmit}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2"
            >
              <input
                name="company"
                value={placementForm.company}
                onChange={handlePlacementInput}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Company"
              />
              <input
                name="role"
                value={placementForm.role}
                onChange={handlePlacementInput}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Role"
              />
              <input
                name="package"
                value={placementForm.package}
                onChange={handlePlacementInput}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Package"
              />
              <input
                name="eligibility"
                value={placementForm.eligibility}
                onChange={handlePlacementInput}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Eligibility"
              />
              <input
                name="process"
                value={placementForm.process}
                onChange={handlePlacementInput}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 sm:col-span-2"
                placeholder="Selection process"
              />

              <div className="sm:col-span-2 flex justify-end gap-2">
                {editingPlacementId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetPlacementForm()
                      setShowPlacementForm(false)
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {editingPlacementId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Package</th>
                  <th className="px-4 py-3 font-semibold">Eligibility</th>
                  <th className="px-4 py-3 font-semibold">Process</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((record) => (
                  <tr key={record._id || record.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{record.company}</td>
                    <td className="px-4 py-3">{record.role}</td>
                    <td className="px-4 py-3">{record.package}</td>
                    <td className="px-4 py-3">{record.eligibility}</td>
                    <td className="px-4 py-3">{record.process}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlacementEdit(record)}
                          className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlacementDelete(record._id)}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
              No registration requests yet.
            </article>
          ) : (
            requests.map((request) => (
              <article
                key={request._id || request.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Full Name: {request.fullName}</p>
                    <p className="text-sm text-slate-700">PRN: {request.prn}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      request.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : request.status === 'declined'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                </div>

                {request.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateRequestStatus(request._id, 'accepted')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRequestStatus(request._id, 'declined')}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void refreshUsers(userSearch)
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="Search by name, email, PRN, branch, or year"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">PRN</th>
                  <th className="px-4 py-3 font-semibold">Branch</th>
                  <th className="px-4 py-3 font-semibold">Year</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td className="px-4 py-3 text-slate-500" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-t border-slate-200">
                      <td className="px-4 py-3">{user.fullName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.prn}</td>
                      <td className="px-4 py-3">{user.branch || '-'}</td>
                      <td className="px-4 py-3">{user.year || '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user._id)}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminDashboardPage
