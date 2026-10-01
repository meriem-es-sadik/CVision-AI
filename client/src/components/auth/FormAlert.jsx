import { CircleAlert, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

export function FormAlert({ tone = 'error', title, message, className }) {
  const isError = tone === 'error'
  const Icon = isError ? CircleAlert : Info

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm',
        isError
          ? 'border-destructive/30 bg-destructive/8 text-destructive'
          : 'border-brand-200/70 bg-brand-50/70 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {message && <p className={cn('leading-relaxed', title && 'mt-0.5 opacity-90')}>{message}</p>}
      </div>
    </div>
  )
}

export default FormAlert
