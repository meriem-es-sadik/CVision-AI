import { BadgeCheck, FileText, Search, Sparkles, TrendingUp, WandSparkles } from 'lucide-react'

import { ScoreRing } from '@/components/common/ScoreRing'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const BREAKDOWN = [
  { label: 'Skills', value: 88 },
  { label: 'Experience', value: 84 },
  { label: 'Education', value: 76 },
  { label: 'Projects', value: 80 },
]

const DETECTED_SKILLS = ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind CSS', 'REST APIs']

const TRAFFIC_LIGHTS = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400']

export function DashboardMockup({ className }) {
  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden="true"
        className="bg-brand-500/25 absolute -inset-8 -z-10 rounded-[3rem] blur-3xl"
      />

      <div className="border-border/80 bg-card/90 relative overflow-hidden rounded-3xl border shadow-[0_40px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="bg-muted/40 border-border/70 flex items-center gap-3 border-b px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {TRAFFIC_LIGHTS.map((color) => (
              <span key={color} className={cn('size-2.5 rounded-full opacity-80', color)} />
            ))}
          </div>

          <div className="bg-background/70 text-muted-foreground mx-auto flex max-w-[62%] items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px]">
            <FileText className="size-3 shrink-0" />
            <span className="truncate">frontend_developer_cv.pdf</span>
          </div>

          <div className="text-muted-foreground hidden items-center gap-2 sm:flex">
            <Search className="size-3.5" />
            <span className="text-[11px] font-medium">Analysed</span>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing value={82} size={126} strokeWidth={9} label="CV Score" />
              <Badge variant="success" className="mt-1">
                <BadgeCheck className="size-3" />
                Strong profile
              </Badge>
            </div>

            <div className="w-full flex-1 space-y-3.5">
              {BREAKDOWN.map((item, index) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground tabular-nums">{item.value}%</span>
                  </div>
                  <Progress value={item.value} style={{ animationDelay: `${index * 90}ms` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/35 border-border/70 rounded-2xl border p-4">
            <div className="text-muted-foreground mb-2.5 flex items-center justify-between text-xs font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="text-brand-600 dark:text-brand-300 size-3.5" />
                Detected skills
              </span>
              <span className="text-brand-700 dark:text-brand-300 font-medium">24 found</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DETECTED_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="bg-background/70 px-2 py-0.5 text-[11px] font-normal"
                >
                  {skill}
                </Badge>
              ))}
              <Badge variant="muted" className="px-2 py-0.5 text-[11px] font-normal">
                +18 more
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-brand-200/70 bg-brand-50/60 p-3.5 dark:border-brand-500/25 dark:bg-brand-500/10">
            <WandSparkles className="text-brand-600 dark:text-brand-300 mt-0.5 size-4 shrink-0" />
            <p className="text-xs leading-relaxed text-brand-900 dark:text-brand-100">
              <span className="font-semibold">AI tip:</span> Add measurable results to your
              experience bullets to raise your impact score.
            </p>
          </div>
        </div>
      </div>

      <div className="border-border/80 bg-card/95 animate-float-slow absolute -top-5 -right-4 hidden w-48 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md sm:block lg:-right-8">
        <div className="flex items-center gap-2">
          <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-8 items-center justify-center rounded-lg">
            <TrendingUp className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-pretty">Score improved</p>
            <p className="text-brand-700 dark:text-brand-300 text-sm font-semibold tabular-nums">
              +18 pts
            </p>
          </div>
        </div>
      </div>

      <div className="border-border/80 bg-card/95 animate-float-slower absolute -bottom-6 -left-4 hidden w-52 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md sm:block lg:-left-10">
        <p className="text-muted-foreground text-[11px] font-medium">Best job match</p>
        <p className="mt-0.5 text-sm font-semibold">Frontend Developer</p>
        <div className="bg-muted mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
          <div className="from-brand-600 to-brand-400 h-full w-[87%] rounded-full bg-gradient-to-r" />
        </div>
        <p className="text-brand-700 dark:text-brand-300 mt-1.5 text-[11px] font-semibold tabular-nums">
          87% match
        </p>
      </div>
    </div>
  )
}

export default DashboardMockup
