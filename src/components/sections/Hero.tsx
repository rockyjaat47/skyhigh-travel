import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, sceneState, ScrollTrigger, useGSAP } from '../../animations/gsap'
import { useContent } from '../../hooks/useContent'
import { detectWebGL, useInView, useIsMobile, useReducedMotion } from '../../hooks/useMedia'
import { track } from '../../services/analytics'
import { Artwork } from '../ui/Artwork'
import { Button } from '../ui/Button'
import { WebGLBoundary } from '../three/WebGLBoundary'

const HeroScene = lazy(() => import('../three/HeroScene'))

const EASE = [0.16, 1, 0.3, 1] as const

function StaticSky({ image }: { image?: string }) {
  return (
    <div className="absolute inset-0">
      <Artwork art={{ scene: 'sky', tone: 'golden', image, alt: '' }} seed="hero-static" decorative priority />
    </div>
  )
}

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const inView = useInView(section, '0px')
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const [webgl] = useState(detectWebGL)
  const { home } = useContent()
  const fallback = <StaticSky image={home.heroImage} />

  // pointer parallax (desktop) → shared scene state
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      sceneState.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      sceneState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (s) => (sceneState.heroProgress = s.progress),
      })
      if (!reduced) {
        gsap.to(content.current, {
          yPercent: -18,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top top', end: '45% top', scrub: true },
        })
      }
      return () => {
        st.kill()
        sceneState.heroProgress = 0
      }
    },
    { scope: section, dependencies: [reduced] },
  )

  return (
    <section ref={section} aria-label="Introduction" className="relative h-[135svh] bg-midnight text-white">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* 3D scene / fallback */}
        <div className="absolute inset-0">
          {webgl ? (
            <WebGLBoundary fallback={fallback}>
              <Suspense fallback={fallback}>
                <HeroScene active={inView} mobile={mobile} reduced={reduced} />
              </Suspense>
            </WebGLBoundary>
          ) : (
            fallback
          )}
        </div>

        {/* legibility gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,28,0.45)_0%,rgba(8,15,28,0)_28%,rgba(8,15,28,0)_55%,rgba(8,15,28,0.42)_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-[linear-gradient(90deg,rgba(8,15,28,0.35),transparent)]" />

        <div ref={content} className="container-x relative flex h-full flex-col justify-end pb-[max(2.5rem,6svh)] pt-28">
          <motion.p
            className="label-mono flex items-center gap-3 text-white/80"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1, ease: EASE }}
          >
            <span className="h-1.5 w-1.5 bg-orange" aria-hidden="true" />
            {home.heroEyebrow}
          </motion.p>

          <h1 className="mt-5 font-display text-display-xl font-medium tracking-[-0.045em]">
            {home.heroTitle.map((line, i) => (
              <span key={i} className="split-line">
                <motion.span
                  className="split-inner"
                  initial={reduced ? false : { y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: 1.05 + i * 0.12, duration: 1.4, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <motion.p
              className="max-w-md text-base leading-relaxed text-white/85 sm:text-lg"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.45, duration: 1.1, ease: EASE }}
            >
              {home.heroText}
            </motion.p>
            <motion.div
              className="flex flex-col gap-3 sm:flex-row"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 1.1, ease: EASE }}
            >
              <Button to="/services" size="lg" onClick={() => track('cta_click', { cta: 'hero_explore_services' })}>
                {home.heroPrimaryCta}
              </Button>
              <Button to="/contact#plan" size="lg" variant="outline-light" onClick={() => track('cta_click', { cta: 'hero_plan_journey' })}>
                {home.heroSecondaryCta}
              </Button>
            </motion.div>
          </div>

          <motion.div
            className="mt-10 hidden items-center justify-between border-t border-white/15 pt-5 md:flex"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 1 }}
          >
            <p className="label-mono text-white/60">
              <span className="text-white">01</span> — Takeoff
            </p>
            <p className="label-mono flex items-center gap-2 text-white/60">
              Scroll to explore <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
            </p>
            <p className="label-mono text-white/60">Est. 2026 · Uttar Pradesh, India</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
