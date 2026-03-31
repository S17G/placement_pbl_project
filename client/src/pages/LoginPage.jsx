import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import http from '../api/http'

function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()

    if (!email || !password) {
      toast.error('Please enter both email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await http.post('/v1/auth/login', {
        email,
        password,
      })

      const loggedInUser = response.data?.data?.user
      const accessToken = response.data?.data?.token
      const role = loggedInUser?.role || 'student'

      if (accessToken) {
        sessionStorage.setItem('pmAccessToken', accessToken)
      }
      sessionStorage.setItem('pmRole', role)
      sessionStorage.setItem('pmAuth', 'true')
      sessionStorage.setItem(
        'pmCurrentUser',
        JSON.stringify({
          name: loggedInUser?.fullName || 'Student User',
          year: loggedInUser?.year || 'Year not set',
          branch: loggedInUser?.branch || 'Branch not set',
          email: loggedInUser?.email || email,
        }),
      )

      toast.success(response.data?.message || 'Login successful')
      navigate(role === 'admin' ? '/admin' : '/discussion')
    } catch (error) {
      const message = error?.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg animate-fade-up lg:grid-cols-2">
        <aside className="bg-linear-to-br from-slate-900 via-slate-800 to-emerald-700 p-7 text-white sm:p-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-300" />
            PlaceMate
          </p>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
            Welcome Back,
            <br />
            Future Achiever
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-100 sm:text-base">
            Login to explore placement updates, peer discussions, and your
            personalized preparation journey.
          </p>
        </aside>

        <div className="p-6 animate-fade-up-delay sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900">Student Login</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use your registered email and password.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">College Email</span>
              <input
                type="email"
                name="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
                placeholder="name@college.edu"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                type="password"
                name="password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
                placeholder="Enter your password"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="size-4 rounded border-slate-300 text-emerald-600" />
                Remember me
              </label>
              <button type="button" className="font-semibold text-emerald-700 hover:text-emerald-800">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Logging in...' : 'Login to PlaceMate'}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            New student?{' '}
            <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
