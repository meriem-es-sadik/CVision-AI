import { LoaderCircle, ScanSearch } from 'lucide-react'

import { Logo } from '@/components/common/Logo'

export function AuthLoadingScreen({ label = 'Checking your session…' }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <Logo />

      <div className="flex flex-col items-center gap-3 text-center">
        <LoaderCircle
          className="text-brand-600 dark:text-brand-300 size-7 animate-spin"
          aria-hidden="true"
        />
        <p role="status" aria-live="polite" className="text-muted-foreground text-sm">
          {label}
        </p>
      </div>

      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <ScanSearch className="size-3.5" aria-hidden="true" />
        CVision AI
      </p>
    </div>
  )
}

export default AuthLoadingScreen
