import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './Navbar'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isStudentView =
    sessionStorage.getItem('pmAuth') === 'true' && sessionStorage.getItem('pmRole') === 'student'

  return (
    <div className="app-shell-dark relative min-h-screen overflow-x-clip bg-app text-slate-100">
      {isStudentView && (
        <>
          <span className="floating-orb animate-float-y left-[6%] top-[14%] h-20 w-20 bg-cyan-500/18" />
          <span className="floating-orb animate-float-x right-[8%] top-[28%] h-16 w-16 bg-emerald-500/18" />
          <span className="floating-orb animate-float-y bottom-[18%] left-[12%] h-14 w-14 bg-sky-500/16" />
          <span className="floating-orb animate-float-x bottom-[8%] right-[16%] h-24 w-24 bg-teal-500/14" />
        </>
      )}

      <div className="mx-auto min-h-screen w-full max-w-7xl gap-6 px-4 py-8 sm:px-6">
        <Navbar isSidebarOpen={isSidebarOpen} onCloseSidebar={() => setIsSidebarOpen(false)} />
        <main className={`relative z-10 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-0'}`}>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((previous) => !previous)}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-sm transition hover:scale-[1.03] hover:border-cyan-400 hover:bg-slate-800 active:scale-95"
            >
              <span className="relative h-5 w-5">
                <span
                  className={`absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-slate-100 transition-all duration-300 ${
                    isSidebarOpen ? 'translate-y-2 rotate-45 bg-cyan-300' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 top-2 block h-0.5 w-5 rounded-full bg-slate-100 transition-all duration-300 ${
                    isSidebarOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-slate-100 transition-all duration-300 ${
                    isSidebarOpen ? '-translate-y-2 -rotate-45 bg-cyan-300' : ''
                  }`}
                />
              </span>
            </button>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
