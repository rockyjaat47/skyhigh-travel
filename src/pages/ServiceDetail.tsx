import { ArrowUpRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHero } from '../components/layout/PageHero'
import { PlanJourney } from '../components/sections/PlanJourney'
import { Button } from '../components/ui/Button'
import { Reveal, SectionLabel, SplitHeading, StatusTag } from '../components/ui/Motion'
import { absUrl, Seo } from '../components/ui/Seo'
import { company } from '../config/site'
import { useContent } from '../hooks/useContent'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
  const { services } = useContent()
  const idx = services.findIndex((s) => s.slug === slug)
  if (idx < 0) return <NotFound />
  const s = services[idx]
  const nextS = services[(idx + 1) % services.length]

  return (
    <>
      <Seo
        title={s.seo.title}
        description={s.seo.description}
        breadcrumbs={[
          { name: 'Services', path: '/services' },
          { name: s.title, path: `/services/${s.slug}` },
        ]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: s.title,
            description: s.summary,
            serviceType: s.title,
            provider: { '@type': 'Organization', name: company.legalName, url: absUrl('/') },
            areaServed: 'IN',
          },
        ]}
      />
      <PageHero
        art={s.art}
        seed={s.slug}
        align={s.art.scene === 'road' ? 'bottom' : 'center'}
        crumbs={[{ name: 'Services', path: '/services' }, { name: s.title }]}
        eyebrow={<StatusTag tone="light">{s.status === 'proposed' ? 'Proposed service — launching soon' : 'Available now'}</StatusTag>}
        title={s.title.split(' & ').length > 1 ? s.title.split(' & ').map((p, i, a) => (i < a.length - 1 ? `${p} &` : p)) : [s.title]}
        intro={<p>{s.summary}</p>}
        aside={
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button to={`/services/${s.slug}#plan`} size="lg">
              Enquire now
            </Button>
          </div>
        }
      />

      <section className="bg-cloud py-28 sm:py-36">
        <div className="container-x grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel index={s.index}>{s.kicker}</SectionLabel>
          </div>
          <div className="space-y-6 lg:col-span-8">
            {s.description.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p className="font-display text-[clamp(1.4rem,1rem+1.2vw,2.2rem)] font-medium leading-[1.2] tracking-[-0.02em] text-navy">{p}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="container-x mt-24">
          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:grid-cols-2">
            {s.offerings.map((o, i) => (
              <Reveal key={o.title} delay={i * 0.06} className="bg-white p-8 sm:p-10">
                <span className="label-mono text-muted">0{i + 1}</span>
                <h3 className="mt-10 text-2xl font-medium text-navy sm:text-3xl">{o.title}</h3>
                <p className="mt-3 max-w-md text-muted">{o.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-midnight py-28 text-white sm:py-36">
        <div className="container-x">
          <SectionLabel light>How it works</SectionLabel>
          <SplitHeading lines={['Four steps.', 'Zero guesswork.']} className="mt-6 text-display-md" />
          <ol className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-4">
            {s.process.map((p, i) => (
              <Reveal as="li" key={p} delay={i * 0.08} className="relative bg-midnight p-8">
                <span className="font-display text-6xl font-medium text-white/10">{i + 1}</span>
                <p className="mt-6 text-xl font-medium">{p}</p>
                {i < s.process.length - 1 && <span aria-hidden="true" className="absolute right-6 top-10 hidden h-px w-10 bg-orange md:block" />}
              </Reveal>
            ))}
          </ol>
          <div className="mt-16 flex flex-wrap items-center gap-3">
            <span className="label-mono text-white/50">Ideal for</span>
            {s.forWhom.map((f) => (
              <span key={f} className="rounded-full border border-white/15 px-4 py-2 text-sm">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <PlanJourney defaultService={s.enquiryType} index="" />

      <Link to={`/services/${nextS.slug}`} className="group block bg-navy py-20 text-white">
        <div className="container-x flex items-end justify-between gap-6">
          <div>
            <p className="label-mono text-white/50">Next service</p>
            <p className="mt-4 font-display text-display-md transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-x-4">{nextS.title}</p>
          </div>
          <ArrowUpRight className="h-12 w-12 shrink-0 transition-transform duration-700 group-hover:-translate-y-2 group-hover:translate-x-2" />
        </div>
      </Link>
    </>
  )
}
