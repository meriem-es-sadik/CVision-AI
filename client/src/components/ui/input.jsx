import { cn } from '@/lib/utils'

function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input bg-background/70 placeholder:text-muted-foreground/80 file:text-foreground flex h-11 w-full min-w-0 rounded-xl border px-3.5 py-2 text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:outline-none',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
