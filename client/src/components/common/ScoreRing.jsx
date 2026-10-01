import { useId } from 'react'

import { cn } from '@/lib/utils'

export function ScoreRing({
  value,
  size = 132,
  strokeWidth = 10,
  suffix = '',
  label,
  className,
  trackClassName,
  showGlow = true,
}) {
  const gradientId = useId()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? 'Score'}: ${clamped}${suffix}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-500)" />
            <stop offset="55%" stopColor="var(--brand-400)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 330)" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-muted', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>

      {showGlow && (
        <span
          aria-hidden="true"
          className="bg-brand-500/18 absolute inset-1/4 rounded-full blur-2xl"
        />
      )}

      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-foreground text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {clamped}
          {suffix && <span className="text-muted-foreground text-base font-medium">{suffix}</span>}
        </span>
        {label && (
          <span className="text-muted-foreground mt-0.5 text-xs font-medium tracking-wide uppercase">
            {label}
          </span>
        )}
      </span>
    </div>
  )
}

export default ScoreRing
