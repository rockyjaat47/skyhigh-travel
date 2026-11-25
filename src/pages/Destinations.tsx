import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHero } from '../components/layout/PageHero'
import { Button } from '../components/ui/Button'
import { DestinationCard, EmptyState } from '../components/ui/Cards'
import { absUrl, Seo } from '../components/ui/Seo'
import { destinationCategories } from '../data/destinations'
import { useContent } from '../hooks/useContent'
import { cn } from '../utils/cn'

export default function Destinations() {
  const { destinations, loading } = useContent()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const cat = params.get('category') ?? 'all'

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    return destinations.filter((d) => {
      if (cat !== 'all' && d.category !== cat) return false
      if (!term) return true
      return [d.name, d.region, d.country, d.tagline, ...d.highlights, ...d.idealFor].join(' ').toLowerCase().includes(term)
    })
  }, [destinations, q, cat])

  return (
    <>
      <Seo
        title="Destinations"
        description="Explore illustrative destinations Skyhigh can plan for — mountains, beaches, heritage cities and natural escapes in India and abroad."
        breadcrumbs={[{ name: 'Destinations', path: '/destinations' }]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: destinations.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.name, url: absUrl(`/destinations/${d.slug}`) })),
          },
        ]}
      />
      <PageHero
        art={{ scene: 'beach', tone: 'golden', alt: 'Illustration of a coastline at golden hour' }}
        seed="dest-hero"
        crumbs={[{ name: 'Destinations' }]}
        title={['Where will', 'you go next?']}
        intro={<p>From Himalayan passes to tropical coastlines — a showcase of places we love to plan journeys around.</p>}
        aside={<p className="label-mono leading-relaxed text-white/70">Illustrative destinations. Itineraries, availability and pricing are tailored on request.</p>}
      />

      <section className="bg-cloud py-16 sm:py-24">
        <div className="container-x">
          <div className="sticky top-24 z-20 -mx-2 rounded-[1.4rem] p-2 glass shadow-[0_10px_40px_-20px_rgba(7,29,54,0.25)] sm:top-28">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex flex-1 items-center">
                <span className="sr-only">Search destinations</span>
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => set('q', e.target.value)}
                  placeholder="Search by place, country or experience…"
                  className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-11 text-sm outline-none focus:border-navy"
                />
                {q && (
                  <button type="button" aria-label="Clear search" onClick={() => set('q', '')} className="absolute right-3 grid h-7 w-7 place-items-center rounded-full hover:bg-grey">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              <div role="tablist" aria-label="Category" className="flex gap-2 overflow-x-auto">
                {destinationCategories.map((c) => (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={cat === c.id}
                    onClick={() => set('category', c.id)}
                    className={cn('h-12 shrink-0 rounded-full px-5 text-sm font-semibold transition-colors', cat === c.id ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-grey')}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="label-mono mt-10 text-muted" aria-live="polite">
            {loading ? 'Loading destinations…' : `${results.length} destination${results.length === 1 ? '' : 's'}`}
          </p>

          {results.length ? (
            <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map((d, i) => (
                  <motion.div
                    key={d.slug}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(i % 5 === 0 && 'sm:col-span-2 lg:col-span-1')}
                  >
                    <DestinationCard d={d} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="No destinations match"
                text={`We couldn’t find anything for “${q}”. Try another search — or tell us where you want to go and we’ll plan it.`}
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" icon={false} onClick={() => setParams({}, { replace: true })}>
                      Clear filters
                    </Button>
                    <Button to="/contact#plan">Request a destination</Button>
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
