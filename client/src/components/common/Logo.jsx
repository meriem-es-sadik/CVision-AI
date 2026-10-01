import { Link } from 'react-router-dom'
import { ScanSearch } from 'lucide-react'

import { cn } from '@/lib/utils'

export function LogoMark({ className }) {
  return (
    <span
      className={cn(
        'from-brand-600 to-brand-400 shadow-[0_6px_18px_-8px_var(--brand-600)] relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
        className,
      )}
    >
      <ScanSearch className="size-[18px] text-white" strokeWidth={2.2} />
    </span>
  )
}

export function Logo({ className, to = '/', showWordmark = true }) {
  return (
    <Link
      to={to}
      className={cn(
        'group focus-visible:ring-ring/60 flex items-center gap-2.5 rounded-xl focus-visible:ring-[3px] focus-visible:outline-none',
        className,
      )}
      aria-label="CVision AI home"
    >
      <LogoMark className="transition-transform duration-300 group-hover:scale-105" />
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight">
          CVision
          <span className="text-brand-700 dark:text-brand-300"> AI</span>
        </span>
      )}
    </Link>
  )
}

export default Logo
