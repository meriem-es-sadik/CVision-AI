import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * A single detected skill rendered as a badge.
 *
 * `category` only changes the visual treatment so technical skills, soft skills,
 * languages and tools stay visually distinguishable inside a dense list.
 */
export function SkillBadge({ skill, category = 'technical', className, interactive = false }) {
  const label = typeof skill === 'string' ? skill.trim() : ''
  if (!label) return null

  return (
    <Badge
      variant={category === 'technical' ? 'brand' : 'secondary'}
      className={cn(
        'max-w-full',
        category === 'soft' && 'border-transparent bg-secondary text-secondary-foreground',
        category === 'languages' &&
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        category === 'tools' && 'border-border bg-background/70 text-foreground',
        interactive && 'transition-colors hover:border-brand-300 dark:hover:border-brand-700',
        className,
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
    </Badge>
  )
}

export default SkillBadge
