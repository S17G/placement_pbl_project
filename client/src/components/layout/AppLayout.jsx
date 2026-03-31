import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

function AppLayout() {
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

      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
