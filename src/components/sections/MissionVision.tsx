import { useRef } from 'react'
import { gsap, useGSAP } from '../../animations/gsap'
import { useContent } from '../../hooks/useContent'
import { useReducedMotion } from '../../hooks/useMedia'
import { Artwork } from '../ui/Artwork'
import { SectionLabel } from '../ui/Motion'
import { ScrubWords } from '../ui/ScrubWords'

export function MissionVision() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { company, home } = useContent()
  useGSAP(
    () => {
      if (reduced) return
      gsap.fromTo('[data-mv-bg]', { scale: 1.2, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } })
    },
    { scope: ref, dependencies: [reduced] },
  )

  return (
    <section ref={ref} aria-label="Mission and vision" className="grain relative overflow-hidden bg-midnight text-white notch-top">
      <div data-mv-bg className="absolute inset-0 opacity-45">
        <Artwork art={{ scene: 'mountains', tone: 'night', image: home.missionImage, alt: '' }} seed="mission-night" decorative />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/60 to-midnight" />
      <div className="container-x relative space-y-32 py-40 sm:space-y-48 sm:py-56">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SectionLabel light>Our mission</SectionLabel>
          </div>
          <ScrubWords
            as="blockquote"
            className="font-display text-[clamp(1.9rem,1rem+3.4vw,4.6rem)] font-medium leading-[1.04] tracking-[-0.035em] lg:col-span-9"
            highlight={['dependable,', 'affordable']}
            text={company.mission}
          />
        </div>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SectionLabel light>Our vision</SectionLabel>
          </div>
          <ScrubWords
            as="blockquote"
            className="font-display text-[clamp(1.9rem,1rem+3.4vw,4.6rem)] font-medium leading-[1.04] tracking-[-0.035em] lg:col-span-9"
            highlight={['trusted']}
            text={company.vision}
          />
        </div>
      </div>
    </section>
  )
}
