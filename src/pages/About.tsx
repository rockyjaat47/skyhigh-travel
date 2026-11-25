import { PageHero } from '../components/layout/PageHero'
import { MissionVision } from '../components/sections/MissionVision'
import { Values } from '../components/sections/Values'
import { Button } from '../components/ui/Button'
import { MaskReveal, Reveal, SectionLabel, SplitHeading } from '../components/ui/Motion'
import { Artwork } from '../components/ui/Artwork'
import { organizationLd, Seo } from '../components/ui/Seo'
import { company as companyInfo } from '../config/site'
import { useContent } from '../hooks/useContent'

export default function About() {
  const { contact, company, pages } = useContent()
  const a = pages.about
  return (
    <>
      <Seo
        title="About Skyhigh"
        description="Skyhigh Travel Bird Technology is a customer-focused travel, tourism, transportation and logistics company combining technology with professional service."
        breadcrumbs={[{ name: 'About', path: '/about' }]}
        jsonLd={[organizationLd(contact)]}
      />
      <PageHero
        art={{ scene: 'sky', tone: 'dawn', image: a.image, alt: 'Aircraft above the clouds' }}
        seed="about-hero"
        crumbs={[{ name: 'About' }]}
        title={a.title}
        intro={<p>{a.intro}</p>}
        aside={a.note ? <p className="label-mono leading-relaxed text-white/70">{a.note}</p> : undefined}
      />

      <section className="bg-cloud py-28 sm:py-36">
        <div className="container-x grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel>Our story</SectionLabel>
            <SplitHeading lines={a.storyTitle} className="mt-6 text-display-md text-navy" />
          </div>
          <div className="space-y-6 text-lg text-muted lg:col-span-6 lg:col-start-7">
            {company.about.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{p}</p>
              </Reveal>
            ))}
            <Reveal delay={0.3}>
              <p>
                We operate across travel, tourism, transportation, logistics and technology — one partner who understands how people and goods actually move, and who stays accountable from planning to arrival.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="container-x mt-24 grid gap-4 md:grid-cols-12">
          {[
            { cls: 'md:col-span-5', scene: 'mountains' as const, tone: 'golden' as const },
            { cls: 'md:col-span-4 md:mt-24', scene: 'city' as const, tone: 'dusk' as const },
            { cls: 'md:col-span-3 md:mt-48', scene: 'road' as const, tone: 'dawn' as const },
          ].map((g, i) => (
            <MaskReveal key={i} className={`aspect-[4/5] ${g.cls}`} delay={i * 0.1}>
              <Artwork art={{ scene: g.scene, tone: g.tone, image: a.gallery[i], alt: 'Skyhigh travel moments' }} seed={`about-${i}`} sizes="(min-width: 768px) 40vw, 90vw" />
            </MaskReveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="container-x">
          <dl className="grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Legal name', companyInfo.legalName],
              ['Brand', companyInfo.brand],
              ['Corporate Identity Number', companyInfo.cin],
              ['Industry', companyInfo.industry],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-8">
                <dt className="label-mono text-muted">{k}</dt>
                <dd className="mt-3 font-display text-lg font-medium leading-snug text-navy">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <MissionVision />
      <Values />

      <section className="bg-cloud py-28">
        <div className="container-x flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SplitHeading lines={['Ready when', 'you are.']} className="text-display-md text-navy" />
          <div className="flex flex-wrap gap-3">
            <Button to="/services" variant="dark">
              Explore services
            </Button>
            <Button to="/contact#plan">Plan your journey</Button>
          </div>
        </div>
      </section>
    </>
  )
}
