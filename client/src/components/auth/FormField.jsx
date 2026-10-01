import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FormField({
  id,
  label,
  error,
  hint,
  optional = false,
  className,
  children,
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="text-muted-foreground text-xs font-normal">Optional</span>
        )}
      </Label>

      {children}

      {describedBy && (
        <p
          id={describedBy}
          className={cn(
            'text-xs leading-relaxed',
            error ? 'text-destructive font-medium' : 'text-muted-foreground',
          )}
          role={error ? 'alert' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export default FormField
