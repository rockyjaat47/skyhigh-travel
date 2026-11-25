import { Check, Clock, Minus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHero } from '../components/layout/PageHero'
import { PlanJourney } from '../components/sections/PlanJourney'
import { Button } from '../components/ui/Button'
import { Reveal, SectionLabel, StatusTag } from '../components/ui/Motion'
import { absUrl, Seo } from '../components/ui/Seo'
import { useContent } from '../hooks/useContent'
import NotFound from './NotFound'

export default function PackageDetail() {
  const { slug } = useParams()
  const { packages, destinations } = useContent()
  const p = packages.find((x) => x.slug === slug)
  if (!p) return <NotFound />
  const dests = p.destinationSlugs.map((s) => destinations.find((d) => d.slug === s)).filter(Boolean) as typeof destinations

  return (
    <>
      <Seo
        title={p.title}
        description={`${p.summary} A ${p.durationDays}-day sample itinerary by Skyhigh, tailored on request.`}
        breadcrumbs={[
          { name: 'Packages', path: '/packages' },
          { name: p.title, path: `/packages/${p.slug}` },
        ]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            name: p.title,
            description: p.summary,
            url: absUrl(`/packages/${p.slug}`),
            itinerary: dests.map((d) => ({ '@type': 'TouristDestination', name: d.name })),
          },
        ]}
      />
      <PageHero
        art={p.art}
        seed={p.slug}
        crumbs={[{ name: 'Packages', path: '/packages' }, { name: p.title }]}
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <StatusTag tone="light">{p.theme}</StatusTag>
            {p.illustrative && <StatusTag tone="light">Sample itinerary</StatusTag>}
          </div>
        }
        title={[p.title]}
        intro={<p>{p.summary}</p>}
        aside={
          <div className="flex flex-wrap items-center gap-6 md:justify-end">
            <span className="flex items-center gap-2 font-display text-2xl">
              <Clock className="h-5 w-5" /> {p.durationDays} days
            </span>
            <Button to={`/packages/${p.slug}#plan`}>Request this trip</Button>
          </div>
        }
      />

      <section className="bg-cloud py-28 sm:py-36">
        <div className="container-x grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel>Itinerary</SectionLabel>
            <ol className="relative mt-10 border-l border-line pl-8">
              {p.itinerary.map((day, i) => (
                <Reveal as="li" key={day.day} delay={i * 0.06} className="relative pb-12 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[2.35rem] top-1 h-3 w-3 rounded-full border-2 border-orange bg-cloud" />
                  <p className="label-mono text-orange">{day.day}</p>
                  <h3 className="mt-2 text-2xl font-medium text-navy sm:text-3xl">{day.title}</h3>
                  <p className="mt-2 text-muted">{day.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="space-y-6 lg:sticky lg:top-32">
              <div className="rounded-[1.6rem] border border-line bg-white p-7">
                <p className="label-mono text-muted">Price</p>
                <p className="mt-2 font-display text-xl font-medium leading-snug text-navy">{p.priceNote}</p>
              </div>
              <div className="rounded-[1.6rem] border border-line bg-white p-7">
                <p className="label-mono text-muted">Typically includes</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {p.inclusions.map((x) => (
                    <li key={x} className="flex gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky" /> {x}
                    </li>
                  ))}
                </ul>
                <p className="label-mono mt-8 text-muted">Not included</p>
                <ul className="mt-4 space-y-3 text-sm text-muted">
                  {p.exclusions.map((x) => (
                    <li key={x} className="flex gap-3">
                      <Minus className="mt-0.5 h-4 w-4 shrink-0" /> {x}
                    </li>
                  ))}
                </ul>
              </div>
              {dests.length > 0 && (
                <div className="rounded-[1.6rem] border border-line bg-white p-7">
                  <p className="label-mono text-muted">Destinations</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {dests.map((d) => (
                      <li key={d.slug}>
                        <Link to={`/destinations/${d.slug}`} className="inline-block rounded-full bg-grey px-3 py-1.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white">
                          {d.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <PlanJourney
        defaultService={p.theme === 'corporate' ? 'corporate' : 'custom-package'}
        defaultDestination={dests.map((d) => d.name).join(', ')}
        index=""
      />
    </>
  )
}
