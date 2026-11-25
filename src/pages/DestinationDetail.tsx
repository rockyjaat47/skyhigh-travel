import { CalendarDays, MapPin, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { PageHero } from '../components/layout/PageHero'
import { PlanJourney } from '../components/sections/PlanJourney'
import { Artwork } from '../components/ui/Artwork'
import { Button } from '../components/ui/Button'
import { DestinationCard, PackageCard } from '../components/ui/Cards'
import { MaskReveal, Reveal, SectionLabel, SplitHeading, StatusTag } from '../components/ui/Motion'
import { absUrl, Seo } from '../components/ui/Seo'
import { useContent } from '../hooks/useContent'
import NotFound from './NotFound'

export default function DestinationDetail() {
  const { slug } = useParams()
  const { destinations, packages } = useContent()
  const d = destinations.find((x) => x.slug === slug)
  if (!d) return <NotFound />
  const related = packages.filter((p) => p.destinationSlugs.includes(d.slug))
  const similar = destinations.filter((x) => x.slug !== d.slug && (x.category === d.category || x.country === d.country)).slice(0, 3)
  const nameOf = (s: string) => destinations.find((x) => x.slug === s)?.name ?? s

  return (
    <>
      <Seo
        title={`${d.name}, ${d.country}`}
        description={`${d.summary} Plan a trip to ${d.name} with Skyhigh.`}
        breadcrumbs={[
          { name: 'Destinations', path: '/destinations' },
          { name: d.name, path: `/destinations/${d.slug}` },
        ]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'TouristDestination',
            name: d.name,
            description: d.summary,
            url: absUrl(`/destinations/${d.slug}`),
            geo: { '@type': 'GeoCoordinates', latitude: d.coordinates[0], longitude: d.coordinates[1] },
            containedInPlace: { '@type': 'Country', name: d.country },
          },
        ]}
      />
      <PageHero
        art={d.art}
        seed={d.slug}
        crumbs={[{ name: 'Destinations', path: '/destinations' }, { name: d.name }]}
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <StatusTag tone="light">{d.category}</StatusTag>
            {d.illustrative && <StatusTag tone="light">Illustrative destination</StatusTag>}
          </div>
        }
        title={[d.name + '.']}
        intro={<p>{d.tagline}</p>}
        aside={
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="label-mono text-white/50">Region</dt>
              <dd className="mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {d.region}, {d.country}
              </dd>
            </div>
            <div>
              <dt className="label-mono text-white/50">Best time</dt>
              <dd className="mt-1 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> {d.bestTime}
              </dd>
            </div>
          </dl>
        }
      />

      <section className="bg-cloud py-28 sm:py-36">
        <div className="container-x grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionLabel>Overview</SectionLabel>
            <Reveal>
              <p className="mt-8 font-display text-[clamp(1.5rem,1rem+1.4vw,2.4rem)] font-medium leading-[1.18] tracking-[-0.02em] text-navy">{d.summary}</p>
            </Reveal>
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4 text-muted" />
              <span className="label-mono mr-2 text-muted">Ideal for</span>
              {d.idealFor.map((x) => (
                <span key={x} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-navy">
                  {x}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button to={`/destinations/${d.slug}#plan`}>Plan a trip to {d.name}</Button>
            </div>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <SectionLabel>Highlights</SectionLabel>
            <ol className="mt-8">
              {d.highlights.map((h, i) => (
                <Reveal as="li" key={h} delay={i * 0.06} className="flex items-baseline gap-6 border-t border-line py-5 last:border-b">
                  <span className="font-display text-sm text-orange">0{i + 1}</span>
                  <span className="text-xl font-medium text-navy">{h}</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>

        <div className="container-x mt-24">
          <MaskReveal className="aspect-[21/9] min-h-[16rem]">
            <Artwork art={{ ...d.art, tone: d.art.tone === 'night' ? 'dusk' : 'night' }} seed={`${d.slug}-alt`} />
          </MaskReveal>
          <p className="label-mono mt-3 text-muted">Illustration — photography will be added as packages are confirmed.</p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-white py-24">
          <div className="container-x">
            <SplitHeading lines={['Sample', 'itineraries']} className="text-display-md text-navy" />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PackageCard key={p.slug} p={p} destinationNames={p.destinationSlugs.map(nameOf).join(' · ')} />
              ))}
            </div>
          </div>
        </section>
      )}

      <PlanJourney defaultService="tour" defaultDestination={`${d.name}, ${d.country}`} index="" />

      {similar.length > 0 && (
        <section className="bg-cloud pb-28">
          <div className="container-x">
            <SectionLabel>You may also like</SectionLabel>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((x) => (
                <DestinationCard key={x.slug} d={x} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
