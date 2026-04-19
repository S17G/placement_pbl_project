import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import http from '../api/http'

function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    prn: '',
    branch: '',
    year: '',
    cgpa: '',
    skills: '',
    achievements: '',
    resume: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const response = await http.get('/v1/profile')
        const user = response.data.data
        setFormData({
          fullName: user.fullName || '',
          prn: user.prn || '',
          branch: user.branch || '',
          year: user.year || '',
          cgpa: user.cgpa || '',
          skills: user.skills ? user.skills.join(', ') : '',
          achievements: user.achievements || '',
          resume: null, // File input can't be pre-filled
        })
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, resume: e.target.files[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const data = new FormData()
      data.append('fullName', formData.fullName)
      data.append('prn', formData.prn)
      data.append('branch', formData.branch)
      data.append('year', formData.year)
      data.append('cgpa', formData.cgpa)
      data.append('skills', formData.skills.split(',').map(s => s.trim()))
      data.append('achievements', formData.achievements)
      if (formData.resume) {
        data.append('resume', formData.resume)
      }

      await http.put('/v1/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-5 rounded-3xl border border-orange-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(20,10,3,0.92))] p-6 shadow-lg shadow-orange-950/20 sm:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded mb-4"></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-800 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5 rounded-3xl border border-orange-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(20,10,3,0.92))] p-6 shadow-lg shadow-orange-950/20 sm:p-8">
      <h1 className="text-2xl font-bold text-white">Student Profile</h1>
      <p className="text-sm text-slate-500">Manage academic details, skills, and your latest resume.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Full Name</span>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-100 outline-none ring-orange-500 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
              placeholder="Enter your full name"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">PRN</span>
            <input
              name="prn"
              value={formData.prn}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-100 outline-none ring-orange-500 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
              placeholder="Enter your PRN"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Branch</span>
            <input
              name="branch"
              value={formData.branch}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-100 outline-none ring-orange-500 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
              placeholder="e.g., Computer Engineering"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Year</span>
            <input
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-100 outline-none ring-orange-500 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
              placeholder="e.g., TE"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">CGPA</span>
            <input
              name="cgpa"
              type="number"
              step="0.01"
              value={formData.cgpa}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-100 outline-none ring-orange-500 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
              placeholder="e.g., 8.5"
            />
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-200">Skills</span>
            <input
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-100 outline-none ring-orange-500 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
              placeholder="e.g., JavaScript, React, Node.js (comma separated)"
            />
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-200">Achievements</span>
            <textarea
              name="achievements"
              value={formData.achievements}
              onChange={handleInputChange}
              className="min-h-28 w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-100 outline-none ring-orange-500 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
              placeholder="Describe your projects, achievements, etc."
            />
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-200">Resume PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full rounded-xl border border-orange-300/20 bg-slate-950/70 px-4 py-2.5 text-slate-300 outline-none ring-orange-500 transition file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:bg-orange-400 file:text-slate-950 hover:file:bg-orange-300"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl border border-orange-200/20 bg-[linear-gradient(135deg,#fb923c,#f59e0b,#fdba74)] px-5 py-2.5 font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </section>
  )
}

export default ProfilePage
