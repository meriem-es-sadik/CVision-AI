import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PlaceholderPage({
  icon: Icon = Construction,
  eyebrow = 'Coming next',
  title,
  description,
  className,
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="container-page flex flex-1 flex-col justify-center py-20">
        <div
          className={cn(
            'border-border/80 bg-card/70 mx-auto w-full max-w-2xl rounded-3xl border p-8 text-center shadow-[0_40px_90px_-60px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-12',
            className,
          )}
        >
          <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 mx-auto flex size-12 items-center justify-center rounded-2xl">
            <Icon className="size-6" />
          </span>

          <p className="text-brand-700 dark:text-brand-300 mt-6 text-xs font-medium tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-relaxed text-pretty">
            {description}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="brand">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/upload">Analyze my CV</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage
