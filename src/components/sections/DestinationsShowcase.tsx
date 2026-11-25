import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { destinationCategories } from '../../data/destinations'
import { useContent } from '../../hooks/useContent'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { DestinationCard, EmptyState } from '../ui/Cards'
import { SectionLabel, SplitHeading } from '../ui/Motion'

/** Scene 02 — Explore. Filterable horizontal rail (native scroll + snap; never hijacks the page). */
export function DestinationsShowcase() {
  const { destinations } = useContent()
  const [cat, setCat] = useState<string>('all')
  const rail = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const list = cat === 'all' ? destinations : destinations.filter((d) => d.category === cat)

  const updateEdges = () => {
    const el = rail.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }
  useEffect(() => {
    rail.current?.scrollTo({ left: 0, behavior: 'smooth' })
    const id = setTimeout(updateEdges, 400)
    return () => clearTimeout(id)
  }, [cat])

  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 900), behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="dest-title" className="relative overflow-hidden bg-cloud py-28 sm:py-36">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel index="02">Explore</SectionLabel>
            <SplitHeading lines={['Mountains, coasts,', 'cities & stories.']} className="mt-6 text-display-lg text-navy" />
          </div>
          <div className="lg:col-span-5">
            <p className="text-muted">
              A glimpse of the places we love to plan for. Destinations shown are illustrative — every itinerary is tailored on request.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Destination categories" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {destinationCategories.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={cat === c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  'h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
                  cat === c.id ? 'border-navy bg-navy text-white' : 'border-line text-navy hover:border-navy/40',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" aria-label="Scroll destinations left" disabled={edges.start} onClick={() => scrollBy(-1)} className="grid h-12 w-12 place-items-center rounded-full border border-line text-navy transition-colors hover:bg-navy hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-navy">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Scroll destinations right" disabled={edges.end} onClick={() => scrollBy(1)} className="grid h-12 w-12 place-items-center rounded-full border border-line text-navy transition-colors hover:bg-navy hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-navy">
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={rail}
        onScroll={updateEdges}
        data-lenis-prevent-wheel=""
        className="scroll-thin mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 [scrollbar-width:none] sm:gap-6"
        style={{ paddingInline: 'var(--gutter)', scrollPaddingInline: 'var(--gutter)' }}
      >
        <AnimatePresence mode="popLayout">
          {list.length ? (
            list.map((d, i) => (
              <motion.div
                key={d.slug}
                layout
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="w-[78vw] shrink-0 snap-start xs:w-[68vw] sm:w-[22rem] lg:w-[26rem]"
              >
                <DestinationCard d={d} size="lg" />
              </motion.div>
            ))
          ) : (
            <div className="w-full">
              <EmptyState title="Nothing here yet" text="We haven’t added destinations in this category. Try another filter." />
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="container-x mt-8">
        <Button to="/destinations" variant="dark">
          All destinations
        </Button>
      </div>
    </section>
  )
}
