import { FileText, GraduationCap, Lightbulb, ListChecks, Sparkles, Tags, Workflow } from 'lucide-react'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

import { ScoreRing } from '@/components/common/ScoreRing'
import { SectionHeading } from '@/components/magicui/Reveal'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const SECTIONS = [
  { key: 'skills', label: 'Skills', icon: Tags, value: 88, note: '18 detected' },
  { key: 'experience', label: 'Experience', icon: Workflow, value: 84, note: '3 roles' },
  { key: 'education', label: 'Education', icon: GraduationCap, value: 76, note: '1 gap found' },
  { key: 'projects', label: 'Projects', icon: ListChecks, value: 80, note: '2 detected' },
]

const RADAR_DATA = [
  { name: 'Skills', value: 88 },
  { name: 'Experience', value: 84 },
  { name: 'Education', value: 76 },
  { name: 'Projects', value: 80 },
  { name: 'Impact', value: 72 },
  { name: 'Clarity', value: 86 },
]

const SKILL_TAGS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'PostgreSQL',
  'AWS',
  'Docker',
  'GraphQL',
]

const SUGGESTIONS = [
  {
    id: 1,
    title: 'Add measurable impact to your bullets',
    detail: 'Quantify 3 achievements in your last role, for example “cut page load by 40%”.',
    priority: 'High impact',
    variant: 'warning',
  },
  {
    id: 2,
    title: 'Move your tech stack into a skills section',
    detail: 'Scanners look for keywords before the first page break.',
    priority: 'Quick win',
    variant: 'success',
  },
  {
    id: 3,
    title: 'Tailor the summary to the target role',
    detail: 'Mirror the exact terms from the job description you are applying to.',
    priority: 'Medium',
    variant: 'brand',
  },
]

export function ScorePreview() {
  return (
    <section className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="bg-brand-400/10 pointer-events-none absolute top-1/3 left-1/4 -z-10 size-[30rem] rounded-full blur-3xl"
      />

      <div className="container-page">
        <SectionHeading
          eyebrow="Analysis preview"
          title="See exactly how your CV is scored"
          description="A single report that breaks your CV into clear sections, shows where points are lost, and tells you what to fix first."
        />

        <div className="border-border/80 bg-card/80 mt-14 overflow-hidden rounded-3xl border shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <div className="bg-muted/40 border-border/70 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-9 items-center justify-center rounded-xl">
                <FileText className="size-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold">CV Analysis Report</p>
                <p className="text-muted-foreground text-xs">frontend_developer_cv.pdf · 2 pages</p>
              </div>
            </div>

            <Badge variant="brand">
              <Sparkles className="size-3" />
              Mock preview
            </Badge>
          </div>

          <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-4">
              <div className="border-border/70 bg-background/60 flex flex-col items-center gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center lg:flex-col">
                <ScoreRing value={82} size={148} strokeWidth={11} suffix="/100" label="Overall" />

                <div className="w-full text-center sm:text-left lg:text-center">
                  <p className="text-foreground text-sm font-semibold">Strong CV</p>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed text-pretty">
                    Above 80% of analysed CVs. Focus on impact metrics and keyword coverage to reach
                    the top 10%.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {SECTIONS.map((section) => {
                  const Icon = section.icon

                  return (
                    <div key={section.key}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-foreground inline-flex items-center gap-1.5 font-medium">
                          <Icon className="text-brand-600 dark:text-brand-300 size-3.5" />
                          {section.label}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {section.value}% · {section.note}
                        </span>
                      </div>
                      <Progress value={section.value} />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="border-border/70 bg-background/60 h-full rounded-2xl border p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">Section balance</h3>
                  <span className="text-muted-foreground text-xs">out of 100</span>
                </div>

                <div className="mt-2 h-[248px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={RADAR_DATA} outerRadius="70%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis
                        dataKey="name"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="var(--brand-500)"
                        strokeWidth={2}
                        fill="var(--brand-500)"
                        fillOpacity={0.22}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border-border/70 bg-background/60 mt-4 rounded-xl border p-3.5">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                    Detected skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SKILL_TAGS.map((skill) => (
                      <Badge key={skill} variant="outline" className="px-2 py-0.5 text-[11px] font-normal">
                        {skill}
                      </Badge>
                    ))}
                    <Badge variant="muted" className="px-2 py-0.5 text-[11px] font-normal">
                      +16
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="border-border/70 bg-background/60 h-full rounded-2xl border p-5">
                <div className="flex items-center justify-between">
                  <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb className="text-brand-600 dark:text-brand-300 size-4" />
                    Suggestions
                  </h3>
                  <Badge variant="muted">3 open</Badge>
                </div>

                <ul className="mt-4 space-y-3">
                  {SUGGESTIONS.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="border-border/70 bg-background/70 hover:border-brand-300 dark:hover:border-brand-700 rounded-xl border p-3.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] leading-snug font-medium text-pretty">
                          {suggestion.title}
                        </p>
                        <Badge variant={suggestion.variant} className="shrink-0 text-[10px]">
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed text-pretty">
                        {suggestion.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          This is an interface preview. Scores and suggestions are illustrative and not connected to
          any analysis service yet.
        </p>
      </div>
    </section>
  )
}

export default ScorePreview
