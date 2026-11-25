import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { mainNav } from '../../config/site'
import { useContent } from '../../hooks/useContent'
import { track } from '../../services/analytics'
import { cn } from '../../utils/cn'
import { Artwork } from '../ui/Artwork'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'

/** Routes whose top-of-page hero is light (header uses dark text before scrolling). */
const LIGHT_TOP = ['/privacy-policy', '/terms-and-conditions', '/404', '/contact']

const EASE = [0.16, 1, 0.3, 1] as const

export function Header() {
  const { pathname } = useLocation()
  const { services } = useContent()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mega, setMega] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [active, setActive] = useState(0)
  const lastY = useRef(0)
  const closeTimer = useRef<number>(0)

  const knownRoute = /^\/(|about|services(\/[\w-]+)?|destinations(\/[\w-]+)?|packages(\/[\w-]+)?)$/.test(pathname)
  const lightTop = LIGHT_TOP.includes(pathname) || !knownRoute
  const solid = scrolled || mega
  const dark = !solid && !lightTop // white text over dark/cinematic hero

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      setHidden(y > 400 && y > lastY.current + 4)
      if (y < lastY.current - 4) setHidden(false)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobile(false)
    setMega(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.style.overflow = mobile ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobile(false)
        setMega(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobile])

  const openMega = () => {
    window.clearTimeout(closeTimer.current)
    setMega(true)
  }
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setMega(false), 160)
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-transform duration-700 ease-[var(--ease-expo)]',
          hidden && !mega && !mobile ? '-translate-y-[120%]' : 'translate-y-0',
        )}
      >
        <div className="container-x pt-3 sm:pt-4">
          <div
            onMouseLeave={scheduleClose}
            className={cn(
              'relative rounded-[1.4rem] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500',
              solid ? 'glass shadow-[0_10px_40px_-12px_rgba(7,29,54,0.18)]' : 'border border-transparent',
            )}
          >
            <div className="flex h-16 items-center justify-between gap-4 pl-4 pr-2 sm:pl-5">
              <Link to="/" aria-label="Skyhigh — home" className="shrink-0">
                <Logo tone={dark ? 'white' : 'color'} />
              </Link>

              <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
                {mainNav.map((item) =>
                  'mega' in item && item.mega ? (
                    <div key={item.to} onMouseEnter={openMega} className="relative">
                      <button
                        type="button"
                        aria-expanded={mega}
                        aria-controls="mega-menu"
                        onClick={() => setMega((m) => !m)}
                        className={cn(
                          'flex h-10 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors',
                          dark ? 'text-white hover:bg-white/10' : 'text-navy hover:bg-navy/5',
                          pathname.startsWith('/services') && (dark ? 'bg-white/10' : 'bg-navy/5'),
                        )}
                      >
                        {item.label}
                        <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', mega && 'rotate-180')} />
                      </button>
                    </div>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onMouseEnter={scheduleClose}
                      className={({ isActive }) =>
                        cn(
                          'flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors',
                          dark ? 'text-white hover:bg-white/10' : 'text-navy hover:bg-navy/5',
                          isActive && (dark ? 'bg-white/10' : 'bg-navy/5'),
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ),
                )}
              </nav>

              <div className="flex items-center gap-2">
                <span className="hidden sm:block">
                  <Button to="/contact#plan" size="md" onClick={() => track('cta_click', { cta: 'nav_plan_journey' })}>
                    Plan your journey
                  </Button>
                </span>
                <button
                  type="button"
                  className={cn('grid h-11 w-11 place-items-center rounded-full lg:hidden', dark ? 'text-white hover:bg-white/10' : 'text-navy hover:bg-navy/5')}
                  aria-label="Open menu"
                  aria-expanded={mobile}
                  aria-controls="mobile-menu"
                  onClick={() => setMobile(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mega menu */}
            <AnimatePresence>
              {mega && (
                <motion.div
                  id="mega-menu"
                  onMouseEnter={openMega}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="hidden overflow-hidden lg:block"
                >
                  <div className="grid grid-cols-12 gap-6 border-t border-navy/10 p-5">
                    <ul className="col-span-8 grid grid-cols-2 gap-1">
                      {services.map((s, i) => (
                        <li key={s.slug}>
                          <Link
                            to={`/services/${s.slug}`}
                            onMouseEnter={() => setActive(i)}
                            onFocus={() => setActive(i)}
                            onClick={() => track('service_select', { service: s.slug, from: 'mega_menu' })}
                            className={cn('group flex gap-4 rounded-2xl p-4 transition-colors', active === i ? 'bg-navy/[0.05]' : 'hover:bg-navy/[0.03]')}
                          >
                            <span className="label-mono pt-1 text-muted">{s.index}</span>
                            <span className="flex-1">
                              <span className="flex items-center gap-2 font-display text-lg font-medium leading-tight text-navy">
                                {s.title}
                                <ArrowUpRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                              </span>
                              <span className="mt-1 block text-sm text-muted">{s.kicker}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="col-span-4 flex flex-col">
                      <div className="relative flex-1 overflow-hidden rounded-2xl">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.div
                            key={active}
                            className="absolute inset-0"
                            initial={{ clipPath: 'inset(0 0 0 100%)' }}
                            animate={{ clipPath: 'inset(0 0 0 0%)' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, ease: EASE }}
                          >
                            <Artwork art={services[active].art} seed={services[active].slug} decorative />
                          </motion.div>
                        </AnimatePresence>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-midnight/70 to-transparent p-4 text-white">
                          <p className="text-sm leading-snug">{services[active].summary}</p>
                        </div>
                      </div>
                      <Link to="/services" className="label-mono mt-3 flex items-center justify-between rounded-xl px-1 py-2 text-navy hover:text-orange">
                        All services <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[75] flex flex-col overflow-y-auto bg-navy text-white"
            initial={{ clipPath: 'circle(0% at calc(100% - 2.5rem) 2.5rem)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 2.5rem) 2.5rem)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 2.5rem) 2.5rem)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="container-x flex h-[5.25rem] shrink-0 items-center justify-between pt-3">
              <Link to="/" aria-label="Skyhigh — home" className="pl-4">
                <Logo tone="white" compact />
              </Link>
              <button type="button" aria-label="Close menu" className="mr-2 grid h-11 w-11 place-items-center rounded-full bg-white/10" onClick={() => setMobile(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav aria-label="Mobile" className="container-x flex flex-1 flex-col justify-center py-8">
              <ul>
                {[{ label: 'Home', to: '/' }, ...mainNav].map((item, i) => (
                  <motion.li
                    key={item.to}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease: EASE }}
                    className="border-b border-white/10"
                  >
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) => cn('flex items-baseline justify-between py-4 font-display text-[clamp(2rem,9vw,3.25rem)] font-medium leading-none tracking-tight', isActive && 'text-orange')}
                    >
                      {item.label}
                      <span className="label-mono text-white/40">0{i + 1}</span>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8">
                <p className="label-mono text-white/50">Services</p>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/80">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <Link to={`/services/${s.slug}`} className="hover:text-white">
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button to="/contact#plan" size="lg" className="mt-8 w-full">
                  Plan your journey
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
