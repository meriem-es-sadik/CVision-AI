import { Link } from 'react-router-dom'
import { ShieldCheck, Sparkles } from 'lucide-react'

import { Logo } from '@/components/common/Logo'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Upload CV', to: '/upload' },
      { label: 'Analysis', to: '/analysis' },
      { label: 'History', to: '/history' },
    ],
  },
  {
    title: 'Features',
    links: [
      { label: 'AI CV Analysis', to: '/#features' },
      { label: 'CV Score', to: '/analysis' },
      { label: 'Skill Detection', to: '/analysis' },
      { label: 'Smart Recommendations', to: '/analysis' },
    ],
  },
  {
    title: 'Job Matcher',
    links: [
      { label: 'Match a job', to: '/jobs' },
      { label: 'Match history', to: '/history' },
      { label: 'Improve keywords', to: '/analysis' },
    ],
  },
]

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.29-1.68-1.29-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.25H3V9.75Zm6.5 0h3.83v1.54h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.66 4.8 6.13V21h-4v-5.28c0-1.26-.02-2.88-1.75-2.88-1.76 0-2.03 1.37-2.03 2.79V21h-4V9.75Z" />
    </svg>
  )
}

const SOCIALS = [
  { label: 'GitHub', icon: GithubIcon, href: 'https://github.com' },
  { label: 'LinkedIn', icon: LinkedinIcon, href: 'https://www.linkedin.com' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t bg-muted/25">
      <div className="container-page">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:py-16">
          <div className="lg:col-span-5">
            <Logo />
            <p className="text-muted-foreground mt-5 max-w-sm text-sm leading-relaxed">
              CVision AI analyses your CV, explains exactly what is holding it back, and matches you
              with the roles that fit your real skills.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs">
                <Sparkles className="text-brand-600 dark:text-brand-300 size-3.5" />
                AI-powered analysis
              </span>
              <span className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs">
                <ShieldCheck className="size-3.5" />
                Private by design
              </span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-foreground text-sm font-semibold">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="group text-muted-foreground hover:text-brand-700 dark:hover:text-brand-300 inline-flex items-center gap-1.5 rounded text-sm transition-colors"
                      >
                        <span className="bg-border group-hover:bg-brand-500 mr-0 h-1 w-1 rounded-full transition-colors" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-border/80 flex flex-col-reverse items-center justify-between gap-4 border-t py-6 sm:flex-row">
          <p className="text-muted-foreground text-center text-sm sm:text-left">
            &copy; {year} CVision AI. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {SOCIALS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-muted-foreground hover:text-foreground rounded-full p-1.5 transition-colors"
                aria-label={label}
              >
                <Icon className="size-4" />
              </a>            ))}
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground rounded text-sm transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-muted-foreground hover:text-foreground rounded text-sm transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
