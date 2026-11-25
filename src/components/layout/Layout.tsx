import Lenis from 'lenis'
import { motion } from 'framer-motion'
import { Suspense, useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../../animations/gsap'
import { useReducedMotion } from '../../hooks/useMedia'
import { trackPageView } from '../../services/analytics'
import { ConsentBanner, Cursor, Loader, ScrollProgress } from '../ui/Chrome'
import { Footer } from './Footer'
import { Header } from './Header'

let lenis: Lenis | null = null
export const getLenis = () => lenis

function useSmoothScroll() {
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced) return
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.4 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenis = null
    }
  }, [reduced])
}

function useRouteEffects() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        // wait a frame for lazy content to mount
        requestAnimationFrame(() => {
          if (lenis) lenis.scrollTo(el, { offset: -90, immediate: true })
          else el.scrollIntoView()
        })
        return
      }
    }
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  useEffect(() => {
    trackPageView(pathname)
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => window.clearTimeout(id)
  }, [pathname])
}

function PageFallback() {
  return (
    <div className="grid min-h-[70vh] place-items-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-muted">
        <span className="h-2 w-2 animate-ping rounded-full bg-orange" />
        <span className="label-mono">Loading</span>
      </div>
    </div>
  )
}

export function Layout() {
  const location = useLocation()
  useSmoothScroll()
  useRouteEffects()

  return (
    <>
      <Loader />
      <ScrollProgress />
      <Cursor />
      <Header />
      <motion.main
        id="main"
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </motion.main>
      <Footer />
      <ConsentBanner />
    </>
  )
}
