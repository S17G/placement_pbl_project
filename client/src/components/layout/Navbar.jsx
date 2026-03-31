import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import http from '../../api/http'

function Navbar() {
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const isAuthenticated = sessionStorage.getItem('pmAuth') === 'true'
  const role = sessionStorage.getItem('pmRole') || 'student'
  let currentUser = null
  try {
    currentUser = JSON.parse(sessionStorage.getItem('pmCurrentUser') || 'null')
  } catch {
    currentUser = null
  }
  const userName = String(currentUser?.name || 'User')
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('') || 'U'

  const handleLogout = async () => {
    try {
      await http.post('/v1/auth/logout')
    } catch {
      // Ignore logout API failures and clear client state anyway.
    }

    sessionStorage.removeItem('pmAuth')
    sessionStorage.removeItem('pmRole')
    sessionStorage.removeItem('pmCurrentUser')
    sessionStorage.removeItem('pmAccessToken')
    setIsProfileOpen(false)
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <NavLink
            to={isAuthenticated ? (role === 'admin' ? '/admin' : '/discussion') : '/login'}
            className="group flex items-center gap-2"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_6px_rgba(14,116,144,0.14)]" />
            <span className="text-xl font-extrabold brand-title transition group-hover:brightness-110">
              PlaceMate
            </span>
          </NavLink>

        {isAuthenticated ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((previous) => !previous)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
              aria-label="Open profile menu"
            >
              {initials}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <p className="px-2 pb-2 text-xs font-semibold text-slate-500">{userName}</p>

                {role === 'student' && (
                  <>
                    <NavLink
                      to="/faq?mine=true"
                      onClick={() => setIsProfileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      My FAQs
                    </NavLink>
                    <NavLink
                      to="/discussion?mine=true"
                      onClick={() => setIsProfileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      My Discussions
                    </NavLink>
                    <NavLink
                      to="/resumes?mine=true"
                      onClick={() => setIsProfileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      My Resume Library
                    </NavLink>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `rounded-full border px-4 py-2 text-sm font-semibold ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 text-slate-700'
                }`
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 text-slate-700'
                }`
              }
            >
              Register
            </NavLink>
          </div>
        )}
        </div>

        {isAuthenticated && role === 'student' && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <NavLink
              to="/discussion"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-slate-300 text-slate-700'
                }`
              }
            >
              Discussion
            </NavLink>
            <NavLink
              to="/faq"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-slate-300 text-slate-700'
                }`
              }
            >
              FAQ
            </NavLink>
            <NavLink
              to="/resumes"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-slate-300 text-slate-700'
                }`
              }
            >
              Resume Library
            </NavLink>
            <NavLink
              to="/placements"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-slate-300 text-slate-700'
                }`
              }
            >
              Placements
            </NavLink>
            <NavLink
              to="/readiness"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-slate-300 text-slate-700'
                }`
              }
            >
              Readiness Check
            </NavLink>
          </div>
        )}

        {isAuthenticated && role === 'admin' && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-slate-300 text-slate-700'
                }`
              }
            >
              Admin Dashboard
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
