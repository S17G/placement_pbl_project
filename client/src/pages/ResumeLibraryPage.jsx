import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import http from '../api/http'

function ResumeLibraryPage() {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadedResumes, setUploadedResumes] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingResumeId, setEditingResumeId] = useState(null)
  const [formValues, setFormValues] = useState({
    name: '',
    year: '',
    company: '',
    placementDate: '',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [searchParams] = useSearchParams()
  const mineOnly = String(searchParams.get('mine') || '') === 'true'

  useEffect(() => {
    void refreshResumes()
  }, [mineOnly])

  const refreshResumes = async () => {
    try {
      const response = await http.get('/v1/resumes', {
        params: mineOnly ? { mine: 'true' } : undefined,
      })
      setUploadedResumes(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch resume library.')
    }
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormValues((previous) => ({ ...previous, [name]: value }))
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      setResumeFile(null)
      return
    }

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload only a PDF resume file.')
      event.target.value = ''
      setResumeFile(null)
      return
    }

    setResumeFile(selectedFile)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const { name, year, company, placementDate } = formValues
    if (!name.trim() || !year.trim() || !company.trim() || !placementDate) {
      toast.error('Please fill all fields before submitting.')
      return
    }

    if (!editingResumeId && !resumeFile) {
      toast.error('Please fill all fields and upload your PDF resume.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingResumeId) {
        await http.patch(`/v1/resumes/${editingResumeId}`, {
          studentName: name.trim(),
          year: year.trim(),
          company: company.trim(),
          placementDate,
        })
      } else {
        const formData = new FormData()
        formData.append('studentName', name.trim())
        formData.append('year', year.trim())
        formData.append('company', company.trim())
        formData.append('placementDate', placementDate)
        formData.append('resume', resumeFile)
        await http.post('/v1/resumes/upload', formData)
      }

      await refreshResumes()
      setFormValues({ name: '', year: '', company: '', placementDate: '' })
      setResumeFile(null)
      setEditingResumeId(null)
      setShowUploadForm(false)
      toast.success(editingResumeId ? 'Resume entry updated successfully.' : 'Resume uploaded successfully and added to the library.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save resume entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (resume) => {
    setEditingResumeId(resume._id)
    setShowUploadForm(true)
    setFormValues({
      name: resume.studentName || '',
      year: resume.year || '',
      company: resume.company || '',
      placementDate: String(resume.placementDate || '').slice(0, 10),
    })
  }

  const handleDelete = async (resumeId) => {
    try {
      await http.delete(`/v1/resumes/${resumeId}`)
      toast.success('Resume entry deleted.')
      await refreshResumes()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete resume entry.')
    }
  }

  return (
    <section className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
        <h1 className="text-2xl font-bold text-slate-900">{mineOnly ? 'My Resume Library' : 'Resume Reference Library'}</h1>
          <p className="text-sm text-slate-500 sm:text-base">
            {mineOnly
              ? 'Manage resumes uploaded by you.'
              : 'Volunteer-shared resumes from placed students (PDF format).'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showUploadForm) {
              setFormValues({ name: '', year: '', company: '', placementDate: '' })
              setResumeFile(null)
              setEditingResumeId(null)
            }
            setShowUploadForm((previous) => !previous)
          }}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {showUploadForm ? 'Close Upload' : editingResumeId ? 'Edit Resume' : 'Upload My Resume'}
        </button>
      </div>

      {showUploadForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-fade-up-delay sm:grid-cols-2 sm:p-5"
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Student Name</span>
            <input
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
              placeholder="Enter your full name"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Year of Engineering</span>
            <input
              name="year"
              value={formValues.year}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
              placeholder="TE / BE"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Placed Company</span>
            <input
              name="company"
              value={formValues.company}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
              placeholder="Company name"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Placement Date</span>
            <input
              type="date"
              name="placementDate"
              value={formValues.placementDate}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition focus:border-cyan-500 focus:ring-2"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Resume PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={Boolean(editingResumeId)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
            <p className="text-xs text-slate-500">
              {editingResumeId
                ? 'PDF file replacement is not required while editing metadata.'
                : 'Only PDF format is allowed.'}
            </p>
          </label>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : editingResumeId ? 'Update Resume Entry' : 'Submit Resume'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 animate-fade-up-delay sm:grid-cols-2">
        {uploadedResumes.length === 0 && (
          <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 sm:col-span-2">
            No resumes uploaded yet. Be the first to contribute.
          </article>
        )}

        {uploadedResumes.map((resume) => (
          <article key={resume._id || resume.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{resume.company} Resume</h2>
            <p className="mt-2 text-sm text-slate-600">Name: {resume.studentName || resume.name}</p>
            <p className="text-sm text-slate-600">Year: {resume.year}</p>
            <p className="text-sm text-slate-600">Company: {resume.company}</p>
            <p className="text-sm text-slate-600">Placement Date: {String(resume.placementDate || '').slice(0, 10)}</p>

            {resume.fileUrl ? (
              <a
                href={resume.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                View PDF
              </a>
            ) : (
              <button
                type="button"
                className="mt-4 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                PDF Not Available
              </button>
            )}

            {resume.isOwner && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(resume)}
                  className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(resume._id)}
                  className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                >
                  Delete
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default ResumeLibraryPage
