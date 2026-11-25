import { values } from '../../data/services'
import { Reveal, SectionLabel, SplitHeading } from '../ui/Motion'

/** Why Choose Skyhigh — core values as an editorial index. No invented statistics. */
export function Values() {
  return (
    <section aria-labelledby="values-title" className="relative bg-grey/60 py-28 sm:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionLabel>Why Skyhigh</SectionLabel>
            <SplitHeading lines={['Principles', 'before promises.']} className="mt-6 text-display-md text-navy" />
            <p className="mt-6 max-w-sm text-muted">
              We’re a new company, so we won’t dress up numbers we haven’t earned yet. Instead, here is what you can hold us to on every journey.
            </p>
          </div>
        </div>
        <ol className="lg:col-span-7">
          {values.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 0.04} className="group border-t border-navy/10 last:border-b">
              <div className="grid grid-cols-[3rem_1fr] gap-4 py-8 sm:grid-cols-[4rem_1fr_1fr] sm:gap-8">
                <span className="font-display text-sm text-orange">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-2xl font-medium leading-tight text-navy transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-x-2 sm:text-3xl">{v.title}</h3>
                <p className="col-start-2 text-muted sm:col-start-3">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
