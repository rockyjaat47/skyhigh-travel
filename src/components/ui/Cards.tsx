import { ArrowUpRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Destination, TravelPackage } from '../../types/content'
import { cn } from '../../utils/cn'
import { Artwork } from './Artwork'
import { StatusTag } from './Motion'

export function DestinationCard({ d, className, size = 'md' }: { d: Destination; className?: string; size?: 'md' | 'lg' }) {
  return (
    <Link
      to={`/destinations/${d.slug}`}
      className={cn('group relative block overflow-hidden rounded-[1.75rem] bg-navy text-white', size === 'lg' ? 'aspect-[3/4]' : 'aspect-[4/5]', className)}
    >
      <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.06]">
        <Artwork art={d.art} seed={d.slug} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/10 to-transparent" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <StatusTag tone="light">{d.category}</StatusTag>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur transition-all duration-500 group-hover:bg-white group-hover:text-navy">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="label-mono text-white/70">
          {d.region}, {d.country}
        </p>
        <h3 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{d.name}</h3>
        <p className="mt-2 line-clamp-2 max-w-xs text-sm text-white/80">{d.tagline}</p>
      </div>
    </Link>
  )
}

export function PackageCard({ p, destinationNames }: { p: TravelPackage; destinationNames: string }) {
  return (
    <Link to={`/packages/${p.slug}`} className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(7,29,54,0.35)]">
      <div className="relative aspect-[16/11] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.06]">
          <Artwork art={p.art} seed={p.slug} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw" />
        </div>
        <div className="absolute left-4 top-4 flex gap-2">
          <StatusTag tone="light">{p.theme}</StatusTag>
          {p.illustrative && <StatusTag tone="light">Sample itinerary</StatusTag>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="label-mono text-muted">{destinationNames}</p>
        <h3 className="mt-2 text-2xl font-medium leading-tight tracking-tight text-navy">{p.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm text-muted">{p.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="label-mono flex items-center gap-2 text-navy">
            <Clock className="h-3.5 w-3.5" /> {p.durationDays} days
          </span>
          <span className="label-mono flex items-center gap-1 text-navy transition-colors group-hover:text-orange">
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center rounded-[1.75rem] border border-dashed border-line px-6 py-20 text-center">
      <p className="font-display text-2xl font-medium text-navy">{title}</p>
      <p className="mt-2 max-w-sm text-muted">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
