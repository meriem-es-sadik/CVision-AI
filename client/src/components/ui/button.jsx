import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        brand:
          'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-[0_8px_24px_-10px_var(--brand-600)] hover:from-brand-500 hover:to-brand-400 hover:shadow-[0_12px_30px_-10px_var(--brand-500)]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/30',
        outline:
          'border border-border bg-background/70 text-foreground shadow-xs hover:border-brand-300 hover:bg-accent hover:text-accent-foreground dark:hover:border-brand-700',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/70',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-brand-700 underline-offset-4 hover:underline dark:text-brand-300',
      },
      size: {
        default: 'h-10 px-5 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 px-4 text-[13px] has-[>svg]:px-3',
        lg: 'h-12 px-7 text-base has-[>svg]:px-6',
        xl: 'h-13 px-8 text-base has-[>svg]:px-7',
        icon: 'size-10',
        'icon-sm': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
