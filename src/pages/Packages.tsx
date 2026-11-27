import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PageHero } from '../components/layout/PageHero'
import { Button } from '../components/ui/Button'
import { EmptyState, PackageCard } from '../components/ui/Cards'
import { Reveal } from '../components/ui/Motion'
import { Seo } from '../components/ui/Seo'
import { durationFilters, packageThemes, priceFilters, tourCategories } from '../data/packages'
import { useContent } from '../hooks/useContent'
import { cn } from '../utils/cn'
import { hasPrice, isOffer } from '../utils/price'
import NotFound from './NotFound'

export default function Packages() {
  const { packages, destinations, pages } = useContent()
  const pg = pages.packages
  const [params, setParams] = useSearchParams()
  const { category } = useParams()
  const cat = category ? tourCategories.find((c) => c.slug === category) : undefined
  const q = params.get('q') ?? ''
  const theme = cat?.theme ?? params.get('theme') ?? 'all'
  const price = params.get('price') ?? 'any'
  const offers = params.get('offers') === '1'
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
  const active = [!cat && theme !== 'all', duration !== 'any', dest !== 'all', price !== 'any', offers, !!q].filter(Boolean).length

  const results = useMemo(() => {
    const range = durationFilters.find((d) => d.id === duration) ?? durationFilters[0]
    const budget = priceFilters.find((b) => b.id === price) ?? priceFilters[0]
    const term = q.trim().toLowerCase()
    const list = packages.filter((p) => {
      if (theme !== 'all' && p.theme !== theme) return false
      if (p.durationDays < range.min || p.durationDays > range.max) return false
      if (dest !== 'all' && !p.destinationSlugs.includes(dest)) return false
      if (budget.id !== 'any' && (!hasPrice(p) || p.pricePerPerson! < budget.min || p.pricePerPerson! > budget.max)) return false
      if (offers && !isOffer(p)) return false
      if (term && ![p.title, p.summary, p.theme, ...p.destinationSlugs].join(' ').toLowerCase().includes(term)) return false
      return true
    })
    if (sort === 'short') list.sort((a, b) => a.durationDays - b.durationDays)
    if (sort === 'long') list.sort((a, b) => b.durationDays - a.durationDays)
    const priceOf = (x: (typeof list)[number]) => (hasPrice(x) ? x.pricePerPerson! : Infinity)
    if (sort === 'price-low') list.sort((a, b) => priceOf(a) - priceOf(b))
    if (sort === 'price-high') list.sort((a, b) => (hasPrice(b) ? b.pricePerPerson! : -1) - (hasPrice(a) ? a.pricePerPerson! : -1))
    return list
  }, [packages, theme, duration, dest, q, sort, price, offers])

  if (category && !cat) return <NotFound />

  const selectCls = 'h-12 w-full appearance-none rounded-full border border-line bg-white pl-4 pr-9 text-sm font-semibold text-navy outline-none focus:border-navy'

  return (
    <>
      <Seo
        title={cat ? cat.title : 'Travel Packages'}
        description={cat ? `${cat.intro} Browse and book ${cat.title.toLowerCase()} with Skyhigh Travel.` : 'Tour packages from Skyhigh — family holidays, honeymoons, adventures, pilgrimages, beach and hill-station trips. Book online or tailor your own.'}
        breadcrumbs={cat ? [{ name: 'Packages', path: '/packages' }, { name: cat.title, path: `/tours/${cat.slug}` }] : [{ name: 'Packages', path: '/packages' }]}
      />
      <PageHero
        art={{ scene: 'backwaters', tone: 'golden', image: pg.image, alt: 'Illustration of calm backwaters at golden hour' }}
        seed="pkg-hero"
        crumbs={cat ? [{ name: 'Packages', path: '/packages' }, { name: cat.title }] : [{ name: 'Packages' }]}
        title={cat ? [cat.title] : pg.title}
        intro={<p>{cat ? cat.intro : pg.intro}</p>}
        aside={pg.note ? <p className="label-mono leading-relaxed text-white/70">{pg.note}</p> : undefined}
      />

      <section className="bg-cloud py-16 sm:py-24">
        <div className="container-x">
          <nav aria-label="Tour categories" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
            <Link to="/packages" className={cn('shrink-0 rounded-full px-4 py-2 text-sm font-semibold', !cat ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-navy/5')}>
              All packages
            </Link>
            {tourCategories.map((c) => (
              <Link key={c.slug} to={`/tours/${c.slug}`} className={cn('shrink-0 rounded-full px-4 py-2 text-sm font-semibold', cat?.slug === c.slug ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-navy/5')}>
                {c.title.replace(/ (tour )?packages?$| tours$| holidays$/i, '')}
              </Link>
            ))}
          </nav>
          <div className="rounded-[1.6rem] border border-line bg-white p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
              <label className="relative flex items-center">
                <span className="sr-only">Search packages</span>
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
                <input type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search packages…" className="h-12 w-full rounded-full border border-line bg-cloud pl-11 pr-4 text-sm outline-none focus:border-navy" />
              </label>
              {[
                ...(cat ? [] : [{ key: 'theme', label: 'Theme', value: theme, options: packageThemes.map((t) => [t.id, t.label]) }]),
                { key: 'duration', label: 'Duration', value: duration, options: durationFilters.map((d) => [d.id, d.label]) },
                { key: 'price', label: 'Budget per person', value: price, options: priceFilters.map((b) => [b.id, b.label]) },
                { key: 'destination', label: 'Destination', value: dest, options: [['all', 'All destinations'], ...destinations.map((d) => [d.slug, d.name])] },
                { key: 'sort', label: 'Sort', value: sort, options: [['featured', 'Featured'], ['price-low', 'Price: low to high'], ['price-high', 'Price: high to low'], ['short', 'Shortest first'], ['long', 'Longest first']] },
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
            <div className="flex flex-wrap items-center gap-4">
              <p className="label-mono text-muted" aria-live="polite">
                {results.length} package{results.length === 1 ? '' : 's'}
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy">
                <input type="checkbox" checked={offers} onChange={(e) => set('offers', e.target.checked ? '1' : '')} className="h-4 w-4 accent-orange" />
                Offers only
              </label>
            </div>
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
