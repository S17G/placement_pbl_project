import { ArrowRight, GraduationCap, LogIn, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/24 blur-3xl" />
        <div className="absolute right-[-80px] top-[18%] h-80 w-80 rounded-full bg-amber-500/18 blur-3xl" />
        <div className="absolute bottom-[-90px] left-[-90px] h-80 w-80 rounded-full bg-orange-300/14 blur-3xl" />
        <div className="absolute left-[18%] top-[36%] h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-[18%] bottom-[24%] h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />
        <span className="floating-orb animate-float-y left-[9%] top-[22%] h-7 w-7 bg-orange-300/35" />
        <span className="floating-orb animate-float-x right-[14%] top-[28%] h-5 w-5 bg-amber-300/35" />
        <span className="floating-orb animate-float-y right-[22%] bottom-[18%] h-9 w-9 bg-orange-200/28" />
        <span className="floating-orb animate-float-x left-[16%] bottom-[14%] h-6 w-6 bg-orange-400/30" />
        <span className="floating-orb animate-float-y left-[28%] top-[8%] h-4 w-4 bg-orange-200/28" />
        <span className="floating-orb animate-float-x right-[30%] top-[12%] h-8 w-8 bg-amber-300/25" />
        <span className="floating-orb animate-float-y left-[38%] bottom-[9%] h-5 w-5 bg-orange-300/30" />
        <span className="floating-orb animate-float-x right-[8%] bottom-[22%] h-7 w-7 bg-amber-200/28" />
        <span className="floating-orb animate-float-y left-[52%] top-[16%] h-3 w-3 bg-orange-100/40" />
        <span className="floating-orb animate-float-x right-[42%] top-[42%] h-4 w-4 bg-amber-200/25" />
        <span className="floating-orb animate-float-y left-[12%] bottom-[28%] h-4 w-4 bg-orange-200/28" />
        <span className="floating-orb animate-float-x right-[22%] top-[56%] h-6 w-6 bg-orange-300/18" />
        <span className="floating-orb animate-float-y left-[70%] bottom-[12%] h-5 w-5 bg-amber-100/28" />
        <span className="floating-orb animate-float-x left-[8%] top-[56%] h-10 w-10 bg-orange-400/12" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <div className="inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-300/30">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200/90">PlaceMate</p>
            <p className="text-xs text-slate-400">Campus Placement Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-2xl border border-orange-300/30 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:-translate-y-0.5 hover:border-orange-200/70 hover:bg-orange-300/20"
          >
            <LogIn className="h-4 w-4" />
            Login
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-16 pt-12 sm:px-8 lg:pt-20">
        <section className="grid gap-8 rounded-[54px_24px_48px_28px] border border-orange-300/18 bg-[linear-gradient(160deg,rgba(15,23,42,0.88),rgba(2,6,23,0.86))] p-7 shadow-[0_30px_90px_-32px_rgba(251,146,60,0.28)] backdrop-blur-md sm:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              One place to plan,
              <br />
              practice, and crack placements.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              PlaceMate helps students track opportunities, build preparation roadmaps,
              manage applications, and collaborate through discussions. Stay updated,
              stay focused, and step into interviews with confidence.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-orange-300"
              >
                <LogIn className="h-4 w-4" />
                Go to Login
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="h-64 w-64 rounded-full border border-orange-300/30 bg-orange-500/8 backdrop-blur-sm" />
            <div className="absolute h-40 w-40 rounded-full border border-amber-300/30 bg-amber-500/10" />
            <div className="absolute h-24 w-24 rounded-full border border-orange-300/35 bg-orange-400/20" />
            <div className="absolute left-[8%] top-[16%] max-w-[14rem] rounded-[26px_10px_24px_12px] border border-orange-800/60 bg-orange-950/45 px-3 py-2 text-xs font-semibold text-orange-100">
              Daily Focus: DSA + Aptitude + Resume
            </div>
            <div className="absolute bottom-[18%] right-[6%] max-w-[15rem] rounded-[24px_14px_24px_10px] border border-amber-800/60 bg-amber-950/45 px-3 py-2 text-xs font-semibold text-amber-100">
              Smart Tracking: placements and internships in one place
            </div>
            <div className="absolute right-[2%] top-[10%] rounded-full border border-orange-300/35 bg-orange-300/22 px-3 py-1 text-xs font-semibold text-orange-100">
              Community + FAQ
            </div>
          </div>
        </section>

        <section
          id="about"
          className="rounded-[52px_18px_48px_24px] border border-orange-300/18 bg-slate-900/45 p-7 transition duration-500 hover:-translate-y-0.5 hover:border-orange-300/45 sm:p-10"
        >
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">About Us</h2>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
            We built PlaceMate to simplify placement preparation for students and coordination for admins.
            From live opportunity updates to readiness insights and profile resources, the goal is simple:
            help every student prepare with clarity and consistency.
          </p>
        </section>

        <section
          className="rounded-[22px_48px_24px_52px] border border-amber-300/20 bg-slate-900/45 p-7 transition duration-500 hover:-translate-y-0.5 hover:border-amber-300/45 sm:p-10"
        >
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Contact</h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">Reach out to placement administration for support:</p>
          <a
            href="mailto:admin.placemate@gmail.com"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-300/20"
          >
            <Mail className="h-4 w-4" />
            admin.placemate@gmail.com
          </a>
        </section>
      </main>
    </div>
  )
}

export default HomePage
