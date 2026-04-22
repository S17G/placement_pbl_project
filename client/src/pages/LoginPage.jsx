import { useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import http from '../api/http'

function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('student')
  const navigate = useNavigate()

  const clearAuthState = () => {
    sessionStorage.removeItem('pmAuth')
    sessionStorage.removeItem('pmRole')
    sessionStorage.removeItem('pmCurrentUser')
    sessionStorage.removeItem('pmAccessToken')
  }

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
      const expectedRole = activeTab

      if (role !== expectedRole) {
        clearAuthState()
        try {
          await http.post('/v1/auth/logout')
        } catch {
          // Ignore cleanup errors.
        }

        toast.error(
          role === 'admin'
            ? 'This account is admin. Please use Admin Login tab.'
            : 'This account is student. Please use Student Login tab.',
        )
        return
      }

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
      navigate(role === 'admin' ? '/admin' : '/dashboard')
    } catch (error) {
      const message = error?.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[36px_20px_36px_20px] border border-orange-300/20 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))] text-slate-100 shadow-[0_32px_90px_-35px_rgba(251,146,60,0.4)] animate-fade-up">
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-orange-500/12 blur-3xl" />
        <span className="absolute -right-14 bottom-0 h-72 w-72 rounded-full bg-amber-500/12 blur-3xl" />
        <span className="floating-orb animate-float-y left-[12%] top-[20%] h-6 w-6 bg-orange-300/35" />
        <span className="floating-orb animate-float-x right-[10%] top-[34%] h-5 w-5 bg-amber-300/30" />
        <span className="floating-orb animate-float-y left-[24%] bottom-[18%] h-4 w-4 bg-orange-200/25" />
        <span className="floating-orb animate-float-x right-[22%] top-[12%] h-4 w-4 bg-amber-200/25" />
      </div>

      <div className="relative p-6 animate-fade-up-delay sm:p-10">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-orange-300/25 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-300/60 hover:text-orange-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="rounded-2xl border border-orange-300/18 bg-slate-900/70 p-1.5">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  activeTab === 'student'
                    ? 'border-orange-200/70 bg-orange-400 text-slate-950 shadow-[0_0_0_1px_rgba(251,146,60,0.35)]'
                    : 'border-orange-400/15 text-slate-300 hover:border-orange-300/40 hover:bg-slate-800'
                }`}
              >
                <UserRound className="h-4 w-4" />
                Student Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  activeTab === 'admin'
                    ? 'border-amber-200/70 bg-amber-300 text-slate-950 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]'
                    : 'border-amber-400/15 text-slate-300 hover:border-amber-300/40 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Login
              </button>
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-bold text-white">
            {activeTab === 'admin' ? 'Admin Login' : 'Student Login'}
          </h2>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Email</span>
              <input
                type="email"
                name="email"
                className="w-full rounded-xl border border-orange-400/20 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-orange-400 transition placeholder:text-slate-500 focus:border-orange-300 focus:ring-2"
                placeholder={activeTab === 'admin' ? 'admin@college.edu' : 'name@college.edu'}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Password</span>
              <input
                type="password"
                name="password"
                className="w-full rounded-xl border border-amber-400/20 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-amber-400 transition placeholder:text-slate-500 focus:border-amber-300 focus:ring-2"
                placeholder="Enter your password"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-orange-200/30 bg-[linear-gradient(135deg,#fb923c,#f59e0b,#fdba74)] px-4 py-3 font-semibold text-slate-950 transition hover:border-orange-100/60 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? 'Logging in...'
                : activeTab === 'admin'
                  ? 'Login as Admin'
                  : 'Login as Student'}
            </button>
              <div className="text-center text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">
                  Register here
                </Link>
              </div>
          </form>
      </div>
    </section>
  )
}

export default LoginPage
