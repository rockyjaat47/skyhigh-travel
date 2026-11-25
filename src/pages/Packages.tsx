import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHero } from '../components/layout/PageHero'
import { Button } from '../components/ui/Button'
import { EmptyState, PackageCard } from '../components/ui/Cards'
import { Reveal } from '../components/ui/Motion'
import { Seo } from '../components/ui/Seo'
import { durationFilters, packageThemes } from '../data/packages'
import { useContent } from '../hooks/useContent'
import { cn } from '../utils/cn'

export default function Packages() {
  const { packages, destinations } = useContent()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const theme = params.get('theme') ?? 'all'
  const duration = params.get('duration') ?? 'any'
  const dest = params.get('destination') ?? 'all'
  const sort = params.get('sort') ?? 'featured'

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || ['all', 'any', 'featured'].includes(value)) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const nameOf = (s: string) => destinations.find((d) => d.slug === s)?.name ?? s
  const active = [theme !== 'all', duration !== 'any', dest !== 'all', !!q].filter(Boolean).length

  const results = useMemo(() => {
    const range = durationFilters.find((d) => d.id === duration) ?? durationFilters[0]
    const term = q.trim().toLowerCase()
    const list = packages.filter((p) => {
      if (theme !== 'all' && p.theme !== theme) return false
      if (p.durationDays < range.min || p.durationDays > range.max) return false
      if (dest !== 'all' && !p.destinationSlugs.includes(dest)) return false
      if (term && ![p.title, p.summary, p.theme, ...p.destinationSlugs].join(' ').toLowerCase().includes(term)) return false
      return true
    })
    if (sort === 'short') list.sort((a, b) => a.durationDays - b.durationDays)
    if (sort === 'long') list.sort((a, b) => b.durationDays - a.durationDays)
    return list
  }, [packages, theme, duration, dest, q, sort])

  const selectCls = 'h-12 w-full appearance-none rounded-full border border-line bg-white pl-4 pr-9 text-sm font-semibold text-navy outline-none focus:border-navy'

  return (
    <>
      <Seo
        title="Travel Packages"
        description="Sample travel package formats from Skyhigh — family holidays, honeymoons, adventures, spiritual journeys and team offsites, tailored on request."
        breadcrumbs={[{ name: 'Packages', path: '/packages' }]}
      />
      <PageHero
        art={{ scene: 'backwaters', tone: 'golden', alt: 'Illustration of calm backwaters at golden hour' }}
        seed="pkg-hero"
        crumbs={[{ name: 'Packages' }]}
        title={['Journeys,', 'ready to shape.']}
        intro={<p>Sample itineraries that show how we structure a trip. Every package is customised — dates, stays, pace and budget.</p>}
        aside={<p className="label-mono leading-relaxed text-white/70">Sample itineraries for illustration. Prices are quoted on request; inclusions are confirmed at booking.</p>}
      />

      <section className="bg-cloud py-16 sm:py-24">
        <div className="container-x">
          <div className="rounded-[1.6rem] border border-line bg-white p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
              <label className="relative flex items-center">
                <span className="sr-only">Search packages</span>
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
                <input type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search packages…" className="h-12 w-full rounded-full border border-line bg-cloud pl-11 pr-4 text-sm outline-none focus:border-navy" />
              </label>
              {[
                { key: 'theme', label: 'Theme', value: theme, options: packageThemes.map((t) => [t.id, t.label]) },
                { key: 'duration', label: 'Duration', value: duration, options: durationFilters.map((d) => [d.id, d.label]) },
                { key: 'destination', label: 'Destination', value: dest, options: [['all', 'All destinations'], ...destinations.map((d) => [d.slug, d.name])] },
                { key: 'sort', label: 'Sort', value: sort, options: [['featured', 'Featured'], ['short', 'Shortest first'], ['long', 'Longest first']] },
              ].map((f) => (
                <label key={f.key} className="relative">
                  <span className="sr-only">{f.label}</span>
                  <select value={f.value} onChange={(e) => set(f.key, e.target.value)} className={selectCls}>
                    {f.options.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="label-mono text-muted" aria-live="polite">
              {results.length} package{results.length === 1 ? '' : 's'}
            </p>
            {active > 0 && (
              <button type="button" onClick={() => setParams({}, { replace: true })} className="label-mono inline-flex items-center gap-1.5 text-navy hover:text-orange">
                <X className="h-3.5 w-3.5" /> Clear {active} filter{active > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {results.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {results.map((p, i) => (
                <Reveal key={p.slug} delay={Math.min(i, 5) * 0.05} className={cn('flex')}>
                  <div className="flex w-full">
                    <PackageCard p={p} destinationNames={p.destinationSlugs.map(nameOf).join(' · ')} />
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="No packages match these filters"
                text="Try widening your filters — or describe your ideal trip and we’ll design a custom package."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" icon={false} onClick={() => setParams({}, { replace: true })}>
                      Clear filters
                    </Button>
                    <Button to="/services/custom-packages">Design a custom package</Button>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </section>
    </>
  )
}
