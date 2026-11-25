import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasTracking } from '../../config/env'
import { useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import { getConsent, setConsent } from '../../services/analytics'
import { LogoMark } from './Logo'

/** Thin scroll-progress line at the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })
  return <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-orange" style={{ scaleX }} />
}

/** Desktop-only cursor follower that grows over interactive elements. */
export function Cursor() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fine || reduced) return
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, hover = false
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      const t = e.target as HTMLElement | null
      hover = !!t?.closest('a,button,[role="button"],input,select,textarea,label,[data-cursor]')
    }
    const loop = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${hover ? 1.8 : 1})`
        ring.current.style.opacity = hover ? '0.5' : '0.9'
      }
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [fine, reduced])

  if (!fine || reduced) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] mix-blend-difference">
      <div ref={dot} className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-white" />
      <div ref={ring} className="absolute -left-4 -top-4 h-8 w-8 rounded-full border border-white transition-[opacity] duration-300" />
    </div>
  )
}

/**
 * Branded intro: short, skippable and never blocks content (pointer-events
 * pass through; it lifts as soon as fonts are ready, max ~1.6s).
 */
export function Loader() {
  const [show, setShow] = useState(() => !sessionStorage.getItem('skyhigh-intro'))
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!show) return
    sessionStorage.setItem('skyhigh-intro', '1')
    const min = new Promise((r) => setTimeout(r, reduced ? 0 : 900))
    const max = new Promise((r) => setTimeout(r, 1600))
    Promise.race([Promise.all([document.fonts.ready, min]), max]).then(() => setShow(false))
  }, [show, reduced])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-navy"
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div initial={{ y: 40, opacity: 0, rotate: -12 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <LogoMark tone="white" className="h-16 w-16" />
            </motion.div>
            <div className="h-px w-40 overflow-hidden bg-white/15">
              <motion.div className="h-full origin-left bg-orange" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }} />
            </div>
            <p className="label-mono text-white/60">Taking you higher</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Cookie consent — only rendered when a tracking integration is configured. */
export function ConsentBanner() {
  const [open, setOpen] = useState(() => hasTracking && getConsent() === 'unset')
  if (!hasTracking) return null
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Cookie preferences"
          className="glass fixed bottom-4 left-4 right-4 z-[65] max-w-md rounded-2xl p-5 text-sm shadow-2xl shadow-navy/10 sm:left-auto"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
        >
          <p className="font-display text-base font-medium">Your privacy, your choice</p>
          <p className="mt-1.5 text-muted">
            We use optional analytics cookies to understand how the site is used. Nothing is tracked unless you accept.{' '}
            <Link to="/privacy-policy" className="underline underline-offset-2">
              Privacy policy
            </Link>
          </p>
          <div className="mt-4 flex gap-2">
            <button className="h-10 flex-1 rounded-full bg-navy px-4 font-semibold text-white" onClick={() => { setConsent('granted'); setOpen(false) }}>
              Accept analytics
            </button>
            <button className="h-10 flex-1 rounded-full border border-navy/20 px-4 font-semibold" onClick={() => { setConsent('denied'); setOpen(false) }}>
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
