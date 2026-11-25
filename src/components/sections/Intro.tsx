import { Compass, Cpu, Truck } from 'lucide-react'
import { Reveal, SectionLabel } from '../ui/Motion'
import { ScrubWords } from '../ui/ScrubWords'

const pillars = [
  { icon: Compass, label: 'Travel', text: 'Tours, bookings and packages shaped around the way you want to see the world.' },
  { icon: Truck, label: 'Transport', text: 'People and goods moved with the same care — from city transfers to freight.' },
  { icon: Cpu, label: 'Technology', text: 'Smart planning tools that make every step clearer, faster and more reliable.' },
]

export function Intro() {
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
            <SectionLabel>Who we are</SectionLabel>
            <h2 id="intro-title" className="sr-only">
              About Skyhigh
            </h2>
          </div>
          <div className="lg:col-span-9">
            <ScrubWords
              className="font-display text-display-sm font-medium tracking-[-0.03em] text-navy sm:text-[clamp(2rem,1.2rem+2.6vw,3.6rem)] sm:leading-[1.05]"
              highlight={['experiences,', 'connections']}
              text="Travel is more than reaching a destination. It is about creating experiences, building connections and making every journey worthwhile — and we combine technology with genuinely professional service to make that happen."
            />
          </div>
        </div>

        <div className="mt-24 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.08} className="group relative bg-cloud p-8 transition-colors duration-500 hover:bg-white sm:p-10">
              <div className="flex items-center justify-between">
                <span className="label-mono text-muted">0{i + 1}</span>
                <p.icon className="h-5 w-5 text-navy transition-transform duration-500 group-hover:-translate-y-1 group-hover:text-orange" strokeWidth={1.5} />
              </div>
              <h3 className="mt-16 text-4xl font-medium text-navy sm:text-5xl">{p.label}</h3>
              <p className="mt-4 max-w-xs text-muted">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
