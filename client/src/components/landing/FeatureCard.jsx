import { cn } from '@/lib/utils'

export function FeatureCard({ icon: Icon, title, description, className }) {
  return (
    <article
      className={cn(
        'group border-border/80 bg-card/70 relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-300',
        'hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.45)]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="from-brand-500/8 pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="bg-brand-500/10 text-brand-700 dark:text-brand-300 group-hover:from-brand-600 group-hover:to-brand-400 group-hover:text-white dark:group-hover:text-white flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 transition-all duration-300 dark:from-brand-500/15 dark:to-brand-500/5">
        <Icon className="size-5" strokeWidth={2} />
      </div>

      <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">{description}</p>
    </article>
  )
}

export default FeatureCard
