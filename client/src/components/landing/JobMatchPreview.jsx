import { Building2, Check, MapPin, Search, Sparkles, TrendingUp, X } from 'lucide-react'

import { ScoreRing } from '@/components/common/ScoreRing'
import { SectionHeading } from '@/components/magicui/Reveal'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const MATCH_BREAKDOWN = [
  { label: 'Skills match', value: 92, note: '11 of 12 required skills' },
  { label: 'Experience match', value: 85, note: '2 yrs 4 mos of relevance' },
  { label: 'Education match', value: 80, note: 'Degree requirement met' },
]

const MATCHED_KEYWORDS = ['React', 'TypeScript', 'REST APIs', 'Agile', 'CI/CD', 'Node.js']

const MISSING_KEYWORDS = ['Next.js', 'GraphQL', 'Design systems']

export function JobMatchPreview() {
  return (
    <section className="bg-muted/30 scroll-mt-24 border-y py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Job matcher"
          title="Know which jobs you actually fit"
          description="Paste a job description and get a transparent match score broken down by skills, experience, and education — plus the exact keywords you are missing."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <div className="border-border/80 bg-card/80 overflow-hidden rounded-3xl border shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:col-span-7">
            <div className="border-border/70 flex flex-wrap items-center gap-3 border-b px-5 py-4 sm:px-6">
              <span className="from-brand-500 to-brand-400 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white shadow-sm">
                NL
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">Frontend Developer</h3>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                  <Building2 className="size-3" />
                  Nimbus Labs
                  <span aria-hidden="true">·</span>
                  <MapPin className="size-3" />
                  Remote · Berlin
                </p>
              </div>
              <Badge variant="brand" className="ml-auto">
                <Sparkles className="size-3" />
                Mock preview
              </Badge>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing value={87} size={140} strokeWidth={10} suffix="%" label="Match" />
                  <Badge variant="success" className="mt-1">
                    <TrendingUp className="size-3" />
                    Strong match
                  </Badge>
                </div>

                <div className="w-full flex-1 space-y-4">
                  {MATCH_BREAKDOWN.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
                        <span className="text-foreground font-medium">{item.label}</span>
                        <span className="text-foreground font-semibold tabular-nums">{item.value}%</span>
                      </div>
                      <Progress value={item.value} />
                      <p className="text-muted-foreground mt-1.5 text-[11px]">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="border-border/70 bg-background/60 rounded-2xl border p-4">
                  <p className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
                    <Check className="size-3" />
                    Keywords matched
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {MATCHED_KEYWORDS.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="success"
                        className="px-2 py-0.5 text-[11px] font-normal"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-border/70 bg-background/60 rounded-2xl border p-4">
                  <p className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
                    <X className="size-3" />
                    Keywords missing
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {MISSING_KEYWORDS.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="warning"
                        className="px-2 py-0.5 text-[11px] font-normal"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="border-brand-200/70 dark:border-brand-500/25 dark:bg-brand-500/8 h-full rounded-3xl border bg-gradient-to-br p-6 sm:p-7">
              <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-11 items-center justify-center rounded-xl">
                <Search className="size-5" />
              </span>

              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                Turn every job description into a plan
              </h3>
              <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed text-pretty">
                CVision AI compares your CV against a role and highlights the gap — then tells you
                exactly which skills and keywords to add before you apply.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Transparent scoring, no black box',
                  'Skills, experience and education breakdown',
                  'Keyword gap analysis for every posting',
                  'Match history so you can track progress',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="size-3" />
                    </span>
                    <span className="text-muted-foreground text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default JobMatchPreview
