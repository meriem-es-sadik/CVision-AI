import { Link } from 'react-router-dom'
import { ArrowLeft, ScanSearch, ShieldCheck, Sparkles, Target } from 'lucide-react'

import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'

const TRUST_POINTS = [
  {
    icon: ScanSearch,
    title: 'Section-by-section CV scoring',
    body: 'See exactly which parts of your CV are holding recruiters back.',
  },
  {
    icon: Target,
    title: 'Job matching against real roles',
    body: 'Match your skills to the jobs that genuinely fit your experience.',
  },
  {
    icon: ShieldCheck,
    title: 'Your CV stays yours',
    body: 'Documents are used for analysis only and are never shared.',
  },
]

export function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid-pattern absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_30%,transparent_100%)]" />
        <div className="from-brand-200/45 dark:from-brand-600/18 absolute -top-48 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-b to-transparent blur-3xl" />
        <div className="bg-brand-400/12 absolute top-40 -left-40 size-[26rem] rounded-full blur-3xl" />
        <div className="bg-brand-500/10 -right-40 bottom-0 size-[24rem] rounded-full blur-3xl" />
      </div>

      <header className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/60 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to site</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </div>
      </header>

      <main className="container-page flex flex-1 items-center justify-center py-10 sm:py-14">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <section className="hidden lg:block" aria-hidden="true">
            <span className="border-brand-200/80 bg-background/70 dark:border-brand-500/30 dark:bg-brand-500/10 text-brand-700 dark:text-brand-200 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
              <Sparkles className="size-3.5" />
              AI CV Analyzer &amp; Smart Job Matcher
            </span>

            <h2 className="text-gradient-brand mt-6 text-3xl leading-[1.15] font-semibold tracking-tight text-balance xl:text-4xl">
              Everything your CV needs to get noticed.
            </h2>

            <ul className="mt-9 space-y-6">
              {TRUST_POINTS.map(({ icon: Icon, title: pointTitle, body }) => (
                <li key={pointTitle} className="flex gap-4">
                  <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{pointTitle}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="w-full">
            <div className="border-border/80 bg-card/75 rounded-3xl border p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-8">
              <p className="text-brand-700 dark:text-brand-300 text-xs font-medium tracking-[0.18em] uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {title}
              </h1>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed text-pretty">
                {description}
              </p>

              <div className="mt-7">{children}</div>

              {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
