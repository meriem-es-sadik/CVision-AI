import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, LogIn, LogOut, Menu, UserPlus } from 'lucide-react'

import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { AUTH_HOME, LOGIN_PATH, REGISTER_PATH } from '@/context/auth-context'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/#features' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Job Matcher', to: '/jobs' },
]

const AUTH_LINKS = [
  { label: 'Dashboard', to: AUTH_HOME },
  { label: 'Upload CV', to: '/upload' },
  { label: 'History', to: '/history' },
]

function scrollToHash(hash) {
  const element = document.querySelector(hash)
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()

  const links = isAuthenticated ? [...NAV_LINKS, ...AUTH_LINKS] : NAV_LINKS

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = useCallback(
    (event, to) => {
      const targetHash = to.includes('#') ? to.slice(to.indexOf('#')) : null

      if (!targetHash) return

      event.preventDefault()
      setOpen(false)

      if (pathname === '/') {
        scrollToHash(targetHash)
        window.history.replaceState(null, '', targetHash)
      } else {
        navigate(`/${targetHash}`)
      }
    },
    [navigate, pathname],
  )

  const handleLogout = useCallback(async () => {
    setSigningOut(true)
    setOpen(false)
    try {
      await logout()
      navigate(LOGIN_PATH, { replace: true })
    } finally {
      setSigningOut(false)
    }
  }, [logout, navigate])

  const isActive = (to) => {
    if (to === '/') return pathname === '/'
    if (to.startsWith('/#')) return false
    return pathname.startsWith(to)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
        scrolled
          ? 'border-border/80 bg-background/80 shadow-[0_1px_24px_-18px_rgba(15,23,42,0.45)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={(event) => handleNav(event, link.to)}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={cn(
                  'focus-visible:ring-ring/60 relative rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
                  isActive(link.to)
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="bg-brand-500 absolute inset-x-4 -bottom-px h-0.5 rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />

            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to={AUTH_HOME}>
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={handleLogout}
                  disabled={signingOut}
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to={LOGIN_PATH}>
                    <LogIn className="size-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild variant="brand" size="sm" className="hidden sm:inline-flex">
                  <Link to={REGISTER_PATH}>
                    Get Started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}

            <Sheet key={pathname} open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] max-w-sm p-0">
                <SheetHeader className="border-b">
                  <SheetTitle className="flex items-center gap-2.5">
                    <Logo />
                  </SheetTitle>
                  <SheetDescription className="sr-only">Navigate CVision AI</SheetDescription>
                </SheetHeader>

                <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
                  {links.map((link) => (
                    <SheetClose key={link.label} asChild>
                      <Link
                        to={link.to}
                        onClick={(event) => handleNav(event, link.to)}
                        className={cn(
                          'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/60 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
                          isActive(link.to) ? 'text-brand-700 dark:text-brand-300' : 'text-muted-foreground',
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="mt-auto flex flex-col gap-3 border-t p-4">
                  <div className="flex items-center justify-between rounded-xl border px-4 py-2.5">
                    <span className="text-muted-foreground text-sm">Appearance</span>
                    <ThemeToggle />
                  </div>

                  {isAuthenticated ? (
                    <>
                      <Button asChild variant="brand" size="lg">
                        <Link to="/upload">
                          Upload CV
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleLogout}
                        disabled={signingOut}
                      >
                        <LogOut className="size-4" />
                        {signingOut ? 'Signing out…' : 'Logout'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" size="lg">
                        <Link to={LOGIN_PATH}>
                          <LogIn className="size-4" />
                          Login
                        </Link>
                      </Button>
                      <Button asChild variant="brand" size="lg">
                        <Link to={REGISTER_PATH}>
                          <UserPlus className="size-4" />
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
