import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useContent } from '../../hooks/useContent'
import { track } from '../../services/analytics'
import { cn } from '../../utils/cn'
import { Artwork } from '../ui/Artwork'
import { Button } from '../ui/Button'
import { SectionLabel, SplitHeading, StatusTag } from '../ui/Motion'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Six services as an interactive index: hovering / focusing a row swaps
 * the large masked preview (desktop). On touch devices each row expands
 * in place — nothing depends on hover.
 */
export function ServicesShowcase() {
  const { services } = useContent()
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<number | null>(0)
  const current = services[active]

  return (
    <section aria-labelledby="services-title" className="relative bg-white py-28 sm:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <SectionLabel>What we do</SectionLabel>
            <SplitHeading
              lines={['Six ways we', 'move you forward.']}
              className="mt-6 text-display-lg text-navy"
            />
          </div>
          <div className="max-w-sm">
            <p className="text-muted">
              One partner for the whole journey — from the first idea to the last mile. All services below are proposed offerings and will be confirmed as they launch.
            </p>
            <Button to="/services" variant="outline" className="mt-6">
              View all services
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          {/* index */}
          <ul className="lg:col-span-7" role="list">
            {services.map((s, i) => (
              <li key={s.slug} className="border-t border-line last:border-b">
                {/* desktop row */}
                <Link
                  to={`/services/${s.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => track('service_select', { service: s.slug, from: 'home_index' })}
                  className="group hidden items-center gap-6 py-7 lg:flex"
                >
                  <span className={cn('label-mono w-10 transition-colors', active === i ? 'text-orange' : 'text-muted')}>{s.index}</span>
                  <span
                    className={cn(
                      'flex-1 font-display text-[clamp(1.6rem,1rem+1.5vw,2.6rem)] font-medium leading-none tracking-[-0.035em] transition-[color,transform] duration-700 ease-[var(--ease-expo)]',
                      active === i ? 'translate-x-3 text-navy' : 'text-navy/35',
                    )}
                  >
                    {s.title}
                  </span>
                  <span
                    className={cn(
                      'grid h-11 w-11 place-items-center rounded-full border transition-all duration-500',
                      active === i ? 'border-navy bg-navy text-white' : 'border-line text-navy',
                    )}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>

                {/* mobile / tablet accordion */}
                <div className="lg:hidden">
                  <button
                    type="button"
                    aria-expanded={open === i}
                    aria-controls={`svc-panel-${i}`}
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center gap-4 py-6 text-left"
                  >
                    <span className="label-mono w-8 text-muted">{s.index}</span>
                    <span className="flex-1 font-display text-2xl font-medium leading-tight tracking-tight text-navy sm:text-3xl">{s.title}</span>
                    <Plus className={cn('h-5 w-5 shrink-0 transition-transform duration-500', open === i && 'rotate-45')} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open === i && (
                      <motion.div
                        id={`svc-panel-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="pb-8">
                          <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                            <Artwork art={s.art} seed={s.slug} />
                          </div>
                          <p className="mt-5 text-muted">{s.summary}</p>
                          <Link to={`/services/${s.slug}`} className="label-mono mt-5 inline-flex items-center gap-2 text-navy">
                            Explore {s.short} <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            ))}
          </ul>

          {/* sticky preview */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-navy">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={current.slug}
                    className="absolute inset-0"
                    initial={{ clipPath: 'inset(100% 0 0 0)', scale: 1.15 }}
                    animate={{ clipPath: 'inset(0% 0 0 0)', scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.3 } }}
                    transition={{ duration: 1, ease: EASE }}
                  >
                    <Artwork art={current.art} seed={current.slug} />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/10 to-transparent" />
                <div className="absolute left-6 top-6">
                  <StatusTag tone="light">{current.status === 'proposed' ? 'Proposed service' : 'Available now'}</StatusTag>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                  <AnimatePresence mode="wait">
                    <motion.div key={current.slug} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                      <p className="label-mono text-white/70">{current.kicker}</p>
                      <p className="mt-3 text-lg leading-snug text-white/95">{current.summary}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
