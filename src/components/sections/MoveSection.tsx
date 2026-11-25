import { ArrowUpRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, useGSAP } from '../../animations/gsap'
import { useReducedMotion } from '../../hooks/useMedia'
import { Artwork } from '../ui/Artwork'
import { LineArt } from '../ui/LineArt'
import { Reveal, SectionLabel, SplitHeading, StatusTag } from '../ui/Motion'

const items = [
  {
    kind: 'coach' as const,
    label: 'Passenger transportation',
    text: 'Airport transfers, outstation trips and event fleets — vehicles matched to the group, drivers briefed on the plan.',
    to: '/services/transportation',
  },
  {
    kind: 'truck' as const,
    label: 'Goods transportation',
    text: 'Parcels, cargo and commercial goods moved point to point with careful handling and clear updates.',
    to: '/services/transportation',
  },
  {
    kind: 'network' as const,
    label: 'Logistics coordination',
    text: 'Full and part truck loads, routing and scheduling handled through a single, accountable point of contact.',
    to: '/services/logistics',
  },
]

/** Scene 04 — Move. A full-bleed road panel that widens on scroll, then three capabilities. */
export function MoveSection() {
  const panel = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return
      gsap.fromTo(
        panel.current,
        { clipPath: 'inset(0% 8% 0% 8% round 2rem)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0rem)',
          ease: 'none',
          scrollTrigger: { trigger: panel.current, start: 'top 85%', end: 'top 15%', scrub: true },
        },
      )
      gsap.fromTo(panel.current!.querySelector('[data-parallax]'), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: panel.current, start: 'top bottom', end: 'bottom top', scrub: true } })
    },
    { dependencies: [reduced] },
  )

  return (
    <section aria-labelledby="move-title" className="relative bg-white pb-28 pt-28 sm:pb-36 sm:pt-36">
      <div className="container-x grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <SectionLabel index="04">Move</SectionLabel>
          <SplitHeading lines={['Transport & logistics,', 'handled with care.']} className="mt-6 text-display-lg text-navy" />
        </div>
        <p className="text-muted lg:col-span-4">
          Beyond holidays, Skyhigh plans to coordinate the movement of people and goods — dependable, transparent and on schedule.
        </p>
      </div>

      <div ref={panel} className="relative mt-16 h-[62svh] min-h-[22rem] overflow-hidden sm:h-[78svh]">
        <div data-parallax className="absolute -inset-y-[10%] inset-x-0">
          <Artwork art={{ scene: 'road', tone: 'golden', alt: 'Illustration of a freight truck on a highway at golden hour' }} seed="move-hero" align="bottom" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-transparent" />
        <div className="container-x absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 pb-8 text-white">
          <p className="max-w-md font-display text-2xl leading-tight tracking-tight sm:text-3xl">Every route planned. Every handover confirmed.</p>
          <StatusTag tone="light">Proposed services</StatusTag>
        </div>
      </div>

      <div className="container-x mt-20">
      <div className="grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line md:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 0.1} className="bg-white">
            <Link to={it.to} className="group flex h-full flex-col p-8 sm:p-10">
              <span className="label-mono text-muted">0{i + 1}</span>
              <LineArt kind={it.kind} className="mt-8 w-full text-navy transition-colors duration-500 group-hover:text-sky" />
              <h3 className="mt-8 text-2xl font-medium text-navy">{it.label}</h3>
              <p className="mt-3 text-muted">{it.text}</p>
              <span className="label-mono mt-8 inline-flex items-center gap-2 text-navy transition-colors group-hover:text-orange">
                Learn more <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
      </div>
    </section>
  )
}
