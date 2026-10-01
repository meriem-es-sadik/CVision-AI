import { motion, useReducedMotion } from 'framer-motion'
import { Bot, Sparkles, Target, Upload } from 'lucide-react'

import { SectionHeading } from '@/components/magicui/Reveal'
import { EASE_OUT } from '@/constants/motion'

const STEPS = [
  {
    number: '01',
    title: 'Upload your CV',
    description:
      'Drop in a PDF or paste your resume. CVision AI parses your sections, dates, and formatting in seconds.',
    icon: Upload,
    meta: 'PDF or DOCX · up to 5 MB',
  },
  {
    number: '02',
    title: 'Let AI analyze it',
    description:
      'Our models read every line, score each section, extract your skills, and surface what is costing you interviews.',
    icon: Bot,
    meta: 'Scores, skills & gaps',
  },
  {
    number: '03',
    title: 'Improve and match with jobs',
    description:
      'Apply prioritised recommendations, then see how your updated CV scores against real job descriptions.',
    icon: Target,
    meta: 'Recommendations & matches',
  },
]

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      id="how-it-works"
      className="bg-muted/30 scroll-mt-24 border-y py-20 sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to a stronger CV"
          description="No spreadsheets, no guesswork. Upload, review, improve — in a few minutes."
        />

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div
            aria-hidden="true"
            className="from-brand-300/70 dark:from-brand-700/50 absolute top-7 right-[8%] left-[8%] hidden h-px bg-gradient-to-r md:block"
          />

          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon

              return (
                <motion.li
                  key={step.number}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: index * 0.12, ease: EASE_OUT }}
                  className="group relative flex flex-col items-center text-center md:px-4"
                >
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="bg-brand-500/12 absolute inset-0 scale-125 rounded-full blur-xl transition-opacity duration-300 group-hover:opacity-100 md:opacity-60"
                    />
                    <span className="border-border bg-background text-brand-700 dark:text-brand-300 group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white dark:group-hover:text-white relative flex size-14 items-center justify-center rounded-2xl border bg-gradient-to-br from-brand-100 to-brand-50 shadow-sm transition-all duration-300 dark:from-brand-500/15 dark:to-brand-500/5">
                      <Icon className="size-6" strokeWidth={1.9} />
                    </span>
                  </div>

                  <span className="text-brand-600/70 dark:text-brand-400/60 mt-5 text-xs font-semibold tracking-[0.2em] tabular-nums">
                    {step.number}
                  </span>

                  <h3 className="mt-2 text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-muted-foreground mt-2.5 max-w-xs text-sm leading-relaxed text-pretty">
                    {step.description}
                  </p>

                  <span className="text-muted-foreground bg-background/70 mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium">
                    <Sparkles className="text-brand-600 dark:text-brand-300 size-3" />
                    {step.meta}
                  </span>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
