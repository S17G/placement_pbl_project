import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import http from '../api/http'

function InternshipDashboardPage() {
  const [internshipRecords, setInternshipRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchInternships = async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true)
    }

    try {
      const response = await http.get('/v1/internships', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      setInternshipRecords(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch internship records.')
    } finally {
      if (showLoader) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void fetchInternships(true)

    const handleFocus = () => {
      void fetchInternships(false)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Internship Information Dashboard</h1>
        <p className="text-sm text-slate-400">Admin-managed internship opportunities and details.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/75 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Package</th>
              <th className="px-4 py-3 font-semibold">Eligibility</th>
              <th className="px-4 py-3 font-semibold">Process</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-slate-700">
                <td className="px-4 py-3 text-slate-400" colSpan={5}>
                  Loading internship records...
                </td>
              </tr>
            ) : internshipRecords.length === 0 ? (
              <tr className="border-t border-slate-700">
                <td className="px-4 py-3 text-slate-400" colSpan={5}>
                  No internship records available.
                </td>
              </tr>
            ) : (
              internshipRecords.map((record) => (
                <tr key={record._id || record.id} className="border-t border-slate-700 text-slate-200">
                  <td className="px-4 py-3">{record.company}</td>
                  <td className="px-4 py-3">{record.role}</td>
                  <td className="px-4 py-3">{record.package}</td>
                  <td className="px-4 py-3">{record.eligibility}</td>
                  <td className="px-4 py-3">{record.process}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default InternshipDashboardPage