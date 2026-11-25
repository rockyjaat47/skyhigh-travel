import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { detectWebGL, useInView, useIsMobile, useReducedMotion } from '../../hooks/useMedia'
import { useContent } from '../../hooks/useContent'
import type { GlobeMarker } from '../three/GlobeScene'
import { WebGLBoundary } from '../three/WebGLBoundary'
import { Reveal, SectionLabel, SplitHeading } from '../ui/Motion'

const GlobeScene = lazy(() => import('../three/GlobeScene'))

const HUBS: GlobeMarker[] = [
  { id: 'hub-lucknow', label: 'Lucknow', sub: 'Uttar Pradesh · Home base', lat: 26.85, lon: 80.95, hub: true },
  { id: 'hub-delhi', label: 'New Delhi', sub: 'Gateway', lat: 28.61, lon: 77.21, hub: true },
  { id: 'hub-mumbai', label: 'Mumbai', sub: 'Gateway', lat: 19.08, lon: 72.88, hub: true },
]

function StaticGlobe() {
  return (
    <div className="grid h-full place-items-center">
      <div className="relative aspect-square w-[70%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#1b4a7d,#071d36_70%)] shadow-[0_0_120px_20px_rgba(0,159,227,0.25)]">
        <div className="dot-grid absolute inset-0 rounded-full text-sky opacity-60" />
      </div>
    </div>
  )
}

/** Scene 03 — Connect. */
export function GlobeSection() {
  const { destinations } = useContent()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const [webgl] = useState(detectWebGL)
  const navigate = useNavigate()
  const [seen, setSeen] = useState(false)
  // mount the WebGL globe the first time it nears the viewport, then keep it
  if (inView && !seen) setSeen(true)

  const { markers, routes } = useMemo(() => {
    const dm: GlobeMarker[] = destinations.map((d) => ({ id: d.slug, label: d.name, sub: `${d.country} · Illustrative`, lat: d.coordinates[0], lon: d.coordinates[1] }))
    const routes: [string, string][] = destinations.map((d, i) => [HUBS[i % 3].id, d.slug])
    return { markers: [...HUBS, ...dm], routes }
  }, [destinations])

  return (
    <section aria-labelledby="globe-title" className="relative overflow-hidden bg-midnight text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_50%,rgba(0,159,227,0.18),transparent_70%)]" />
      <div className="container-x relative grid min-h-[100svh] items-center gap-6 py-24 lg:grid-cols-12">
        <div className="relative z-10 lg:col-span-5">
          <SectionLabel index="03" light>
            Connect
          </SectionLabel>
          <SplitHeading lines={['One network.', 'Every direction.']} className="mt-6 text-display-lg" />
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-md text-lg text-white/75">
              Connecting people, places and opportunities. Drag the globe to explore the destinations we plan for — tap a marker to open it.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <dl className="mt-12 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              <div className="bg-midnight p-5">
                <dt className="label-mono text-white/50">Gateways</dt>
                <dd className="mt-2 flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-orange" /> Indian hubs
                </dd>
              </div>
              <div className="bg-midnight p-5">
                <dt className="label-mono text-white/50">Destinations</dt>
                <dd className="mt-2 flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-white" /> Showcase places
                </dd>
              </div>
            </dl>
            <p className="label-mono mt-4 text-white/40">Routes are illustrative and do not represent operated services.</p>
          </Reveal>
        </div>
        <div ref={ref} className="relative -mx-[var(--gutter)] aspect-square lg:col-span-7 lg:mx-0 lg:aspect-auto lg:h-[min(52rem,92svh)]">
          {webgl ? (
            <WebGLBoundary fallback={<StaticGlobe />}>
              <Suspense fallback={<StaticGlobe />}>
                {seen ? (
                  <GlobeScene
                    active={inView}
                    mobile={mobile}
                    reduced={reduced}
                    markers={markers}
                    routes={routes}
                    onSelect={(id) => !id.startsWith('hub-') && navigate(`/destinations/${id}`)}
                  />
                ) : (
                  <StaticGlobe />
                )}
              </Suspense>
            </WebGLBoundary>
          ) : (
            <StaticGlobe />
          )}
        </div>
      </div>
    </section>
  )
}
