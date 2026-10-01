import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Reveal } from '@/components/magicui/Reveal'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="relative py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <Reveal y={28}>
          <div className="border-border/80 bg-card/70 relative overflow-hidden rounded-3xl border px-6 py-14 text-center shadow-[0_40px_90px_-60px_rgba(15,23,42,0.6)] backdrop-blur-xl sm:px-12 sm:py-16">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <div className="from-brand-600/14 via-brand-500/8 absolute inset-0 bg-gradient-to-br to-transparent dark:from-brand-600/25" />
              <div className="bg-dot-pattern absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,#000,transparent)]" />
              <div className="bg-brand-500/20 absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl" />
            </div>

            <span className="border-brand-200/80 bg-background/70 dark:border-brand-500/30 dark:bg-brand-500/10 text-brand-700 dark:text-brand-200 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="size-3.5" />
              Free to start
            </span>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Ready to improve your CV?
            </h2>

            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              Upload your resume and discover how AI can help you make it stronger.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="brand" size="xl" className="w-full sm:w-auto">
                <Link to="/upload">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-6 text-xs">
              No credit card required · Your CV stays private
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default CtaSection
