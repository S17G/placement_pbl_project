import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import http from '../../api/http'

function Navbar({ isSidebarOpen, onCloseSidebar }) {
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
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-300 lg:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseSidebar}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } rounded-tr-3xl rounded-br-3xl`}
      >
        <div className="flex items-center justify-between gap-3">
          <NavLink
            to={isAuthenticated ? (role === 'admin' ? '/admin' : '/dashboard') : '/login'}
            className="group flex items-center gap-2"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_6px_rgba(14,116,144,0.14)]" />
            <span className="text-xl font-extrabold brand-title transition group-hover:brightness-110">
              PlaceMate
            </span>
          </NavLink>

          <button
            type="button"
            onClick={onCloseSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <div className="mt-8 space-y-6">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200 text-sm font-bold text-slate-700">
                  {initials}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{currentUser?.name || 'Student User'}</p>
                  <p className="text-xs text-slate-500">{currentUser?.year || 'Year not set'} • {currentUser?.branch || 'Branch not set'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `rounded-3xl border px-4 py-3 text-sm font-semibold ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `rounded-3xl border px-4 py-3 text-sm font-semibold ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                Register
              </NavLink>
            </div>
          )}

          {isAuthenticated && role === 'student' && (
            <nav className="space-y-2">
              {[
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/discussion', label: 'Discussion' },
                { to: '/faq', label: 'FAQ' },
                { to: '/resumes', label: 'Resume Library' },
                { to: '/applications', label: 'Applications' },
                { to: '/roadmaps', label: 'Roadmaps' },
                { to: '/placements', label: 'Placements' },
                { to: '/readiness', label: 'Readiness Check' },
              ].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onCloseSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`
                  }
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    •
                  </span>
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}

          {isAuthenticated && role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={onCloseSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`
              }
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                •
              </span>
              Admin Dashboard
            </NavLink>
          )}
        </div>
      </aside>
    </>
  )
}

export default Navbar
