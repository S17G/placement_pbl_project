import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './Navbar'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isStudentView =
    sessionStorage.getItem('pmAuth') === 'true' && sessionStorage.getItem('pmRole') === 'student'

  return (
    <div className="relative min-h-screen overflow-x-clip bg-app text-slate-900">
      {isStudentView && (
        <>
          <span className="floating-orb animate-float-y left-[6%] top-[14%] h-20 w-20 bg-cyan-200/35" />
          <span className="floating-orb animate-float-x right-[8%] top-[28%] h-16 w-16 bg-emerald-200/40" />
          <span className="floating-orb animate-float-y bottom-[18%] left-[12%] h-14 w-14 bg-sky-300/30" />
          <span className="floating-orb animate-float-x bottom-[8%] right-[16%] h-24 w-24 bg-teal-200/28" />
        </>
      )}

      <div className="mx-auto min-h-screen w-full max-w-7xl gap-6 px-4 py-8 sm:px-6">
        <Navbar isSidebarOpen={isSidebarOpen} onCloseSidebar={() => setIsSidebarOpen(false)} />
        <main className={`relative z-10 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-0'}`}>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((previous) => !previous)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-slate-900" />
              {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            </button>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
