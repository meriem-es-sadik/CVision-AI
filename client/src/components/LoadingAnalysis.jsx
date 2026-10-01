import { useEffect, useState } from 'react'
import { BrainCircuit, FileSearch, ListChecks, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Stages shown while the analysis request is in flight.
 *
 * These are honest UX messages about work the request is doing - they are not a
 * progress percentage and never claim the provider has finished. No AI output is
 * rendered while waiting.
 */
const STAGES = [
  { icon: FileSearch, label: 'Reading extracted CV', body: 'Sending the stored text to the AI reviewer.' },
  { icon: BrainCircuit, label: 'Evaluating sections', body: 'Scoring each section of your CV.' },
  { icon: ListChecks, label: 'Preparing recommendations', body: 'Turning findings into actionable steps.' },
]

/** How long each stage is shown before moving on. */
const STAGE_INTERVAL_MS = 4000

export function LoadingAnalysis({ className, message }) {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, STAGES.length - 1))
    }, STAGE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [])

  const activeStage = STAGES[stageIndex]
  const StageIcon = activeStage.icon

  return (
    <div
      className={cn('border-border/80 bg-card rounded-2xl border p-6 sm:p-8', className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 relative flex size-14 items-center justify-center rounded-2xl">
          <span className="border-brand-500/40 absolute inset-0 animate-pulse-ring rounded-2xl" />
          <StageIcon className="size-6" aria-hidden="true" />
        </span>

        <h2 className="mt-5 text-lg font-semibold tracking-tight">
          {message ?? 'Analysing your CV with AI'}
        </h2>

        <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
          This usually takes under a minute. You can keep this tab open - nothing is saved until the
          analysis succeeds.
        </p>

        <ol className="mt-7 w-full max-w-md space-y-2.5 text-left">
          {STAGES.map((stage, index) => {
            const Icon = stage.icon
            const state = index < stageIndex ? 'done' : index === stageIndex ? 'active' : 'todo'

            return (
              <li
                key={stage.label}
                className={cn(
                  'flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors',
                  state === 'active' && 'border-brand-200/80 bg-brand-50/60 dark:border-brand-500/30 dark:bg-brand-500/10',
                  state === 'done' && 'border-border/70 bg-muted/25',
                  state === 'todo' && 'border-border/50',
                )}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <Icon
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    state === 'active'
                      ? 'text-brand-700 dark:text-brand-300 animate-pulse'
                      : state === 'done'
                        ? 'text-emerald-600 dark:text-emerald-300'
                        : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      state === 'todo' && 'text-muted-foreground',
                    )}
                  >
                    {stage.label}
                  </p>
                  {state === 'active' && (
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {stage.body}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <p className="text-muted-foreground mt-6 flex items-center justify-center gap-1.5 text-center text-xs">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Scored by the CVision AI reviewer
      </p>
    </div>
  )
}

export default LoadingAnalysis
