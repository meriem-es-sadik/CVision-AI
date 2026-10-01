import { Link } from 'react-router-dom'
import { BadgeCheck, PlayCircle, Sparkles, Target, Zap } from 'lucide-react'

import { DashboardMockup } from '@/components/landing/DashboardMockup'
import { Button } from '@/components/ui/button'

const VALUE_POINTS = [
  { icon: Sparkles, label: 'AI-powered analysis' },
  { icon: Target, label: 'Smart job matching' },
  { icon: BadgeCheck, label: 'Actionable recommendations' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid-pattern absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,#000_35%,transparent_100%)]" />
        <div className="from-brand-200/45 dark:from-brand-600/18 absolute -top-40 left-1/2 h-[34rem] w-[64rem] -translate-x-1/2 rounded-full bg-gradient-to-b to-transparent blur-3xl" />
        <div className="bg-brand-400/12 absolute -top-24 -left-32 size-[28rem] rounded-full blur-3xl" />
        <div className="bg-brand-500/10 absolute top-32 -right-40 size-[26rem] rounded-full blur-3xl" />
      </div>

      <div className="container-page">
        <div className="grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-12 lg:gap-10 lg:py-24">
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="border-brand-200/80 bg-background/70 dark:border-brand-500/30 dark:bg-brand-500/10 text-brand-700 dark:text-brand-200 animate-fade-in inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
              <span className="bg-brand-500 relative flex size-1.5">
                <span className="bg-brand-400 animate-pulse-ring absolute inset-0 rounded-full" />
                <span className="bg-brand-600 relative size-1.5 rounded-full" />
              </span>
              AI CV Analyzer &amp; Smart Job Matcher
            </div>

            <h1
              id="hero-heading"
              className="animate-fade-up mt-6 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]"
              style={{ animationDelay: '60ms' }}
            >
              Build a CV that <span className="text-gradient-brand">gets noticed.</span>
            </h1>

            <p
              className="text-muted-foreground animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg"
              style={{ animationDelay: '140ms' }}
            >
              AI-powered CV analysis and smart job matching to help you understand your resume,
              improve it, and find better job matches.
            </p>

            <div
              className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: '220ms' }}
            >
              <Button asChild variant="brand" size="xl" className="w-full sm:w-auto">
                <Link to="/upload">
                  <Zap className="size-4" />
                  Analyze My CV
                </Link>
              </Button>

              <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                <a href="#how-it-works">
                  <PlayCircle className="size-4" />
                  See How It Works
                </a>
              </Button>
            </div>

            <ul
              className="animate-fade-up mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-3"
              style={{ animationDelay: '300ms' }}
            >
              {VALUE_POINTS.map(({ icon: Icon, label }) => (
                <li key={label} className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-6 items-center justify-center rounded-full">
                    <Icon className="size-3.5" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 xl:col-span-7">
            <div className="animate-fade-up lg:pl-6" style={{ animationDelay: '200ms' }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
