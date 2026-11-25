import { Compass, Cpu, Truck } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { Reveal, SectionLabel } from '../ui/Motion'
import { ScrubWords } from '../ui/ScrubWords'

const ICONS = [Compass, Truck, Cpu]

export function Intro() {
  const { home } = useContent()
  return (
    <section aria-labelledby="intro-title" className="relative overflow-hidden bg-cloud py-28 sm:py-40">
      {/* crosshair field (Swiss grid feel) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
        {[...Array(12)].map((_, i) => (
          <span key={i} className="cross-field absolute h-3 w-3" style={{ left: `${(i % 6) * 18 + 6}%`, top: `${Math.floor(i / 6) * 70 + 10}%` }} />
        ))}
      </div>
      <div className="container-x relative">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SectionLabel>{home.introLabel}</SectionLabel>
            <h2 id="intro-title" className="sr-only">
              About Skyhigh
            </h2>
          </div>
          <div className="lg:col-span-9">
            <ScrubWords
              className="font-display text-display-sm font-medium tracking-[-0.03em] text-navy sm:text-[clamp(2rem,1.2rem+2.6vw,3.6rem)] sm:leading-[1.05]"
              highlight={['experiences,', 'connections']}
              text={home.introStatement}
            />
          </div>
        </div>

        <div className="mt-24 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {home.pillars.map((p, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
            <Reveal key={i} delay={i * 0.08} className="group relative bg-cloud p-8 transition-colors duration-500 hover:bg-white sm:p-10">
              <div className="flex items-center justify-between">
                <span className="label-mono text-muted">0{i + 1}</span>
                <Icon className="h-5 w-5 text-navy transition-transform duration-500 group-hover:-translate-y-1 group-hover:text-orange" strokeWidth={1.5} />
              </div>
              <h3 className="mt-16 text-4xl font-medium text-navy sm:text-5xl">{p.title}</h3>
              <p className="mt-4 max-w-xs text-muted">{p.text}</p>
            </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
