import { PageHero } from '../components/layout/PageHero'
import { MissionVision } from '../components/sections/MissionVision'
import { Values } from '../components/sections/Values'
import { Button } from '../components/ui/Button'
import { MaskReveal, Reveal, SectionLabel, SplitHeading } from '../components/ui/Motion'
import { Artwork } from '../components/ui/Artwork'
import { organizationLd, Seo } from '../components/ui/Seo'
import { company } from '../config/site'
import { useContent } from '../hooks/useContent'

export default function About() {
  const { contact } = useContent()
  return (
    <>
      <Seo
        title="About Skyhigh"
        description="Skyhigh Travel Bird Technology is a customer-focused travel, tourism, transportation and logistics company combining technology with professional service."
        breadcrumbs={[{ name: 'About', path: '/about' }]}
        jsonLd={[organizationLd(contact)]}
      />
      <PageHero
        art={{ scene: 'sky', tone: 'dawn', alt: 'Illustration of an aircraft climbing above clouds at dawn' }}
        seed="about-hero"
        crumbs={[{ name: 'About' }]}
        title={['Your journey,', 'our responsibility.']}
        intro={<p>{company.about[0]}</p>}
      />

      <section className="bg-cloud py-28 sm:py-36">
        <div className="container-x grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel>Our story</SectionLabel>
            <SplitHeading lines={['A new company,', 'built on an old', 'idea: care.']} className="mt-6 text-display-md text-navy" />
          </div>
          <div className="space-y-6 text-lg text-muted lg:col-span-6 lg:col-start-7">
            {company.about.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{p}</p>
              </Reveal>
            ))}
            <Reveal delay={0.3}>
              <p>
                We operate across {company.industry.toLowerCase()} — one partner who understands how people and goods actually move, and who stays accountable from planning to arrival.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="container-x mt-24 grid gap-4 md:grid-cols-12">
          <MaskReveal className="aspect-[4/5] md:col-span-5">
            <Artwork art={{ scene: 'mountains', tone: 'golden', alt: 'Illustration of mountain ridges at golden hour' }} seed="about-a" />
          </MaskReveal>
          <MaskReveal className="aspect-[4/5] md:col-span-4 md:mt-24" delay={0.1}>
            <Artwork art={{ scene: 'city', tone: 'dusk', alt: 'Illustration of a city skyline at dusk' }} seed="about-b" />
          </MaskReveal>
          <MaskReveal className="aspect-[4/5] md:col-span-3 md:mt-48" delay={0.2}>
            <Artwork art={{ scene: 'road', tone: 'dawn', alt: 'Illustration of a highway at dawn' }} seed="about-c" align="bottom" />
          </MaskReveal>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="container-x">
          <dl className="grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Legal name', company.legalName],
              ['Brand', company.brand],
              ['Corporate Identity Number', company.cin],
              ['Industry', company.industry],
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
