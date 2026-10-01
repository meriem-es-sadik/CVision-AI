import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }) {
  const { resolvedTheme, toggleTheme, theme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'border-border bg-muted/70 focus-visible:ring-ring/60 relative inline-flex h-9 w-[4.25rem] shrink-0 items-center rounded-full border p-1 transition-colors duration-300 hover:bg-accent focus-visible:ring-[3px] focus-visible:outline-none',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'bg-background shadow-sm ring-border/60 absolute top-1 left-1 flex size-7 items-center justify-center rounded-full ring-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isDark ? 'translate-x-8' : 'translate-x-0',
        )}
      >
        {isDark ? (
          <Moon className="text-brand-600 size-3.5" />
        ) : (
          <Sun className="text-amber-500 size-3.5" />
        )}
      </span>
      <span className="sr-only">
        {theme === 'system'
          ? 'Theme follows your system setting. Activate to switch theme.'
          : `Switch to ${isDark ? 'light' : 'dark'} theme`}
      </span>
    </button>
  )
}

export default ThemeToggle
