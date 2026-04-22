import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import http from '../api/http'

function PlacementDashboardPage() {
  const [placementRecords, setPlacementRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPlacements = async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true)
    }

    try {
      const response = await http.get('/v1/placements', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      setPlacementRecords(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch placement records.')
    } finally {
      if (showLoader) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void fetchPlacements(true)

    const handleFocus = () => {
      void fetchPlacements(false)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Placement Information Dashboard</h1>
        <p className="text-sm text-slate-400">Admin-managed company details and selection insights.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/75 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Company Name</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">CGPA Criteria</th>
              <th className="px-4 py-3 font-semibold">CTC</th>
              <th className="px-4 py-3 font-semibold">Stipend</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 font-semibold">Branch</th>
              <th className="px-4 py-3 font-semibold">Venue</th>
              <th className="px-4 py-3 font-semibold">Skills Required</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-slate-700">
                <td className="px-4 py-3 text-slate-400" colSpan={9}>
                  Loading placement records...
                </td>
              </tr>
            ) : placementRecords.length === 0 ? (
              <tr className="border-t border-slate-700">
                <td className="px-4 py-3 text-slate-400" colSpan={9}>
                  No placement records available.
                </td>
              </tr>
            ) : (
              placementRecords.map((record) => (
                <tr key={record._id || record.id} className="border-t border-slate-700 text-slate-200">
                  <td className="px-4 py-3">{record.company || record.company_name || '-'}</td>
                  <td className="px-4 py-3">{record.date || (record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-')}</td>
                  <td className="px-4 py-3">{record.cgpa_criteria || record.eligibility || '-'}</td>
                  <td className="px-4 py-3">{record.ctc || record.package || '-'}</td>
                  <td className="px-4 py-3">{record.stipend || '-'}</td>
                  <td className="px-4 py-3">{record.activity || record.process || '-'}</td>
                  <td className="px-4 py-3">{record.branch || '-'}</td>
                  <td className="px-4 py-3">{record.venue || '-'}</td>
                  <td className="px-4 py-3">{record.skills_required || record.role || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default PlacementDashboardPage
