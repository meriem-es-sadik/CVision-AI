import { Suspense, lazy } from 'react'

import { CtaSection } from '@/components/landing/CtaSection'
import { Features } from '@/components/landing/Features'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

const ScorePreview = lazy(() =>
  import('@/components/landing/ScorePreview').then((module) => ({ default: module.ScorePreview })),
)

const JobMatchPreview = lazy(() =>
  import('@/components/landing/JobMatchPreview').then((module) => ({
    default: module.JobMatchPreview,
  })),
)

function SectionFallback({ heightClassName }) {
  return (
    <div className={heightClassName} aria-hidden="true">
      <div className="container-page h-full py-20">
        <div className="border-border/60 bg-card/40 h-full w-full animate-pulse rounded-3xl border" />
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="bg-background focus:ring-ring sr-only z-[60] rounded-lg border px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:ring-[3px]"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />

        <Suspense fallback={<SectionFallback heightClassName="min-h-[36rem]" />}>
          <ScorePreview />
        </Suspense>

        <Suspense fallback={<SectionFallback heightClassName="min-h-[32rem]" />}>
          <JobMatchPreview />
        </Suspense>

        <CtaSection />
      </main>

      <Footer />
    </div>
  )
}

export default Landing
