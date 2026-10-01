import { cn } from '@/lib/utils'
import { getScoreBandMeta } from '@/lib/analysisUtils'
import { Progress } from '@/components/ui/progress'

/**
 * Compact 0-100 score tile used across the analysis dashboard, history list and
 * section breakdowns.
 *
 * The number is always a real stored value; the band underneath is a label only
 * and never alters the score.
 */
export function ScoreCard({
  label,
  score,
  hint,
  suffix = '/100',
  className,
  showBand = true,
  showBar = true,
  barClassName,
}) {
  const numeric = typeof score === 'number' && Number.isFinite(score) ? score : 0
  const band = getScoreBandMeta(numeric)

  return (
    <div
      className={cn(
        'border-border/80 bg-card flex flex-col rounded-xl border p-4',
        className,
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {numeric}
        {suffix && <span className="text-muted-foreground text-sm font-medium">{suffix}</span>}
      </p>

      {showBand && (
        <p
          className={cn(
            'mt-1 text-xs font-medium',
            band.tone === 'success' && 'text-emerald-600 dark:text-emerald-300',
            band.tone === 'brand' && 'text-brand-700 dark:text-brand-300',
            band.tone === 'warning' && 'text-amber-600 dark:text-amber-300',
            band.tone === 'destructive' && 'text-destructive',
          )}
        >
          {band.label}
        </p>
      )}

      {showBar && (
        <Progress
          value={numeric}
          className="mt-3"
          indicatorClassName={barClassName}
          aria-label={`${label}: ${numeric} out of 100`}
        />
      )}

      {hint && <p className="text-muted-foreground mt-2.5 text-xs leading-relaxed">{hint}</p>}
    </div>
  )
}

export default ScoreCard
