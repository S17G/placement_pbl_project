import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import http from '../api/http'

function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget

    const formData = new FormData(event.currentTarget)
    const requiredFields = [
      'fullName',
      'prn',
      'email',
      'branch',
      'year',
      'cgpa',
      'skills',
      'password',
    ]

    const hasMissingField = requiredFields.some(
      (fieldName) => !String(formData.get(fieldName) || '').trim(),
    )

    if (hasMissingField) {
      toast.error('Please fill all required fields before registering.')
      return
    }

    if (!formData.get('confirmDetails')) {
      toast.error('Please confirm your details to continue.')
      return
    }

    const fullName = String(formData.get('fullName') || '').trim()
    const prn = String(formData.get('prn') || '').trim()
    const year = String(formData.get('year') || '').trim()
    const branch = String(formData.get('branch') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const cgpa = String(formData.get('cgpa') || '').trim()
    const skills = String(formData.get('skills') || '').trim()
    const password = String(formData.get('password') || '').trim()

    setIsSubmitting(true)

    try {
      await http.post('/v1/auth/register-request', {
        fullName,
        prn,
        year,
        branch,
        email,
        cgpa,
        skills,
        password,
      })

      formElement.reset()
      toast.success('Registration request sent to admin. Please login after 24 hours for approval update.', {
        duration: 4500,
      })
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to submit registration request.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg animate-fade-up lg:grid-cols-[1.05fr_1.35fr]">
        <aside className="bg-linear-to-b from-cyan-700 via-teal-700 to-emerald-700 p-7 text-white sm:p-10">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Build Your
            <br />
            Student Profile
          </h1>
          <p className="mt-4 text-sm text-emerald-50 sm:text-base">
            Register once with your complete details to unlock discussions,
            FAQs, resume references, and placement dashboard insights.
          </p>

          <div className="mt-7 space-y-2 text-sm text-emerald-50">
            <p>Mandatory PRN based registration</p>
            <p>Profile details for better recommendations</p>
            <p>Easy access to placement resources</p>
          </div>

          <p className="mt-8 text-sm text-emerald-100">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white underline decoration-white/60 underline-offset-4">
              Login here
            </Link>
          </p>
        </aside>

        <div className="p-6 animate-fade-up-delay sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900">Student Registration</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill all required fields carefully. PRN is mandatory.
          </p>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Full Name</span>
              <input
                name="fullName"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Enter your full name"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">PRN Number</span>
              <input
                name="prn"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                placeholder="PRN"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">College Email</span>
              <input
                type="email"
                name="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                placeholder="name@college.edu"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Branch</span>
              <input
                name="branch"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Computer / IT / E&TC"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Year of Study</span>
              <select name="year" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2">
                <option>FE</option>
                <option>SE</option>
                <option>TE</option>
                <option>BE</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">CGPA</span>
              <input
                name="cgpa"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                placeholder="e.g. 8.21"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Skills</span>
              <input
                name="skills"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Java, DSA, React, SQL"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                type="password"
                name="password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Create a strong password"
              />
            </label>

            <label className="sm:col-span-2 inline-flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="confirmDetails"
                className="mt-0.5 size-4 rounded border-slate-300 text-emerald-600"
              />
              I confirm that all details are correct and belong to me.
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:col-span-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
