import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/layout/PageHero'
import { PlanJourney } from '../components/sections/PlanJourney'
import { Artwork } from '../components/ui/Artwork'
import { Reveal, StatusTag } from '../components/ui/Motion'
import { absUrl, Seo } from '../components/ui/Seo'
import { useContent } from '../hooks/useContent'
import { track } from '../services/analytics'
import { cn } from '../utils/cn'

/** Services index — each service gets its own editorial row, alternating composition. */
export default function Services() {
  const { services } = useContent()
  return (
    <>
      <Seo
        title="Services"
        description="Tour & travel, passenger and goods transportation, truck & logistics, travel booking, corporate travel and customised packages by Skyhigh."
        breadcrumbs={[{ name: 'Services', path: '/services' }]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: services.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.title, url: absUrl(`/services/${s.slug}`) })),
          },
        ]}
      />
      <PageHero
        art={{ scene: 'mountains', tone: 'dusk', alt: 'Illustration of mountain ridges at dusk' }}
        seed="services-hero"
        crumbs={[{ name: 'Services' }]}
        title={['Everything that', 'moves you.']}
        intro={<p>Six connected services for travellers, teams and businesses — planned with care and coordinated end to end.</p>}
        aside={
          <p className="label-mono leading-relaxed text-white/70">
            All services are currently proposed offerings. Availability, coverage and terms will be confirmed as each service launches.
          </p>
        }
      />

      <section className="bg-cloud py-24 sm:py-32">
        <div className="container-x space-y-6">
          {services.map((s, i) => {
            const flip = i % 2 === 1
            return (
              <Reveal key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  onClick={() => track('service_select', { service: s.slug, from: 'services_index' })}
                  className="group grid overflow-hidden rounded-[2rem] border border-line bg-white transition-shadow duration-500 hover:shadow-[0_40px_80px_-50px_rgba(7,29,54,0.45)] md:grid-cols-12"
                >
                  <div className={cn('relative aspect-[16/10] overflow-hidden md:col-span-6 md:aspect-auto md:min-h-[26rem]', flip && 'md:order-2')}>
                    <div className="absolute inset-0 transition-transform duration-[1.6s] ease-[var(--ease-expo)] group-hover:scale-105">
                      <Artwork art={s.art} seed={s.slug} align={s.art.scene === 'road' ? 'bottom' : 'center'} />
                    </div>
                    <span className="absolute left-5 top-5">
                      <StatusTag tone="light">{s.status === 'proposed' ? 'Proposed service' : 'Available now'}</StatusTag>
                    </span>
                  </div>
                  <div className="flex flex-col p-8 sm:p-12 md:col-span-6">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm text-orange">{s.index}</span>
                      <span className="grid h-12 w-12 place-items-center rounded-full border border-line transition-all duration-500 group-hover:border-navy group-hover:bg-navy group-hover:text-white">
                        <ArrowUpRight className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="label-mono mt-10 text-muted">{s.kicker}</p>
                    <h2 className="mt-3 text-display-sm text-navy">{s.title}</h2>
                    <p className="mt-5 max-w-lg text-muted">{s.summary}</p>
                    <ul className="mt-auto flex flex-wrap gap-2 pt-10">
                      {s.offerings.map((o) => (
                        <li key={o.title} className="rounded-full bg-grey px-3 py-1.5 text-xs font-semibold text-navy">
                          {o.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>
      <PlanJourney index="" />
    </>
  )
}
