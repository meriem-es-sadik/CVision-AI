import { motion, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  as: Component = 'div',
  once = true,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion()

  const MotionComponent = motion[Component] ?? motion.div

  if (prefersReducedMotion) {
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    )
  }

  return (
    <MotionComponent
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px 0px -80px 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}

export function Stagger({ children, className, gap = 0.08, ...props }) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px 0px -80px 0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: gap } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({ eyebrow, title, description, align = 'center', className, children }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'mx-auto max-w-2xl items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <Reveal
          as="span"
          className="border-brand-200/80 bg-brand-50/80 dark:border-brand-500/25 dark:bg-brand-500/10 text-brand-700 dark:text-brand-200 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase"
        >
          {eyebrow}
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.6rem] lg:leading-[1.12]">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className="text-muted-foreground text-base leading-relaxed text-pretty sm:text-lg">
            {description}
          </p>
        </Reveal>
      )}
      {children}
    </div>
  )
}

export default Reveal
