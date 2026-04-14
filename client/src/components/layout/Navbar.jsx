import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import http from '../../api/http'

const TAB_SEEN_AT_KEY = 'pmStudentTabSeenAt'
const STUDENT_BADGE_TABS = [
  { key: 'discussion', to: '/discussion', endpoint: '/v1/discussion', dateField: 'postedAt' },
  { key: 'faq', to: '/faq', endpoint: '/v1/faq', dateField: 'postedAt' },
  { key: 'resumes', to: '/resumes', endpoint: '/v1/resumes', dateField: 'postedAt' },
  { key: 'internships', to: '/internships', endpoint: '/v1/internships', dateField: 'createdAt' },
  { key: 'placements', to: '/placements', endpoint: '/v1/placements', dateField: 'createdAt' },
]

function parseSeenMap() {
  try {
    const raw = localStorage.getItem(TAB_SEEN_AT_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistSeenMap(seenMap) {
  localStorage.setItem(TAB_SEEN_AT_KEY, JSON.stringify(seenMap))
}

function Navbar({ isSidebarOpen, onCloseSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [tabBadges, setTabBadges] = useState({})
  const hasInitializedBadges = useRef(false)
  const latestBadges = useRef({})
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

  const markTabAsSeen = useCallback((tabKey) => {
    const seenMap = parseSeenMap()
    seenMap[tabKey] = new Date().toISOString()
    persistSeenMap(seenMap)
    setTabBadges((previous) => {
      const next = { ...previous, [tabKey]: 0 }
      latestBadges.current = next
      return next
    })
  }, [])

  const refreshStudentTabBadges = useCallback(async () => {
    if (!isAuthenticated || role !== 'student') {
      return
    }

    const seenMap = parseSeenMap()
    let shouldPersistSeenMap = false

    try {
      const responses = await Promise.all(
        STUDENT_BADGE_TABS.map((tab) => http.get(tab.endpoint).catch(() => null)),
      )

      const nextBadges = {}

      STUDENT_BADGE_TABS.forEach((tab, index) => {
        if (!seenMap[tab.key]) {
          seenMap[tab.key] = new Date().toISOString()
          shouldPersistSeenMap = true
        }

        const seenAt = new Date(seenMap[tab.key]).getTime()
        const items = responses[index]?.data?.data || []

        const newItemsCount = items.filter((item) => {
          const itemTime = new Date(item?.[tab.dateField] || 0).getTime()
          return itemTime > seenAt
        }).length

        nextBadges[tab.key] = newItemsCount
      })

      if (shouldPersistSeenMap) {
        persistSeenMap(seenMap)
      }

      if (hasInitializedBadges.current) {
        STUDENT_BADGE_TABS.forEach((tab) => {
          const previousCount = latestBadges.current[tab.key] || 0
          const nextCount = nextBadges[tab.key] || 0

          if (nextCount > previousCount) {
            const delta = nextCount - previousCount
            const noun = delta === 1 ? 'entry' : 'entries'
            toast(`${delta} new ${tab.key === 'faq' ? 'FAQ' : tab.key} ${noun}`)
          }
        })
      }

      hasInitializedBadges.current = true
      latestBadges.current = nextBadges
      setTabBadges(nextBadges)
    } catch {
      // Keep existing badges when refresh fails.
    }
  }, [isAuthenticated, role])

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      return
    }

    void refreshStudentTabBadges()

    const intervalId = window.setInterval(() => {
      void refreshStudentTabBadges()
    }, 15000)

    const handleFocus = () => {
      void refreshStudentTabBadges()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isAuthenticated, role, refreshStudentTabBadges])

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      return
    }

    const matchedTab = STUDENT_BADGE_TABS.find((tab) => location.pathname.startsWith(tab.to))
    if (matchedTab) {
      markTabAsSeen(matchedTab.key)
    }
  }, [isAuthenticated, role, location.pathname, markTabAsSeen])

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
        <div className="flex items-center gap-3">
          <NavLink
            to={isAuthenticated ? (role === 'admin' ? '/admin' : '/dashboard') : '/login'}
            className="group flex items-center gap-2"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_6px_rgba(14,116,144,0.14)]" />
            <span className="text-xl font-extrabold brand-title transition group-hover:brightness-110">
              PlaceMate
            </span>
          </NavLink>
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
                { to: '/internships', label: 'Internships' },
                { to: '/placements', label: 'Placements' },
                { to: '/readiness', label: 'Readiness Check' },
              ].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => {
                    const badgeTab = STUDENT_BADGE_TABS.find((tab) => tab.to === link.to)
                    if (badgeTab) {
                      markTabAsSeen(badgeTab.key)
                    }
                    onCloseSidebar()
                  }}
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
                  <span className="flex flex-1 items-center justify-between gap-2">
                    <span>{link.label}</span>
                    {(() => {
                      const badgeTab = STUDENT_BADGE_TABS.find((tab) => tab.to === link.to)
                      const count = badgeTab ? tabBadges[badgeTab.key] || 0 : 0

                      if (!count) {
                        return null
                      }

                      return (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {count}
                        </span>
                      )
                    })()}
                  </span>
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
