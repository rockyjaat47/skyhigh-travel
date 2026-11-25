import type { ReactNode } from 'react'
import type { Artwork as ArtworkT } from '../../types/content'
import { Artwork } from '../ui/Artwork'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { Reveal, SplitHeading } from '../ui/Motion'

/** Cinematic inner-page hero: artwork backdrop, breadcrumbs, split headline. */
export function PageHero({
  art,
  seed,
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
  children,
  align = 'center',
}: {
  art: ArtworkT
  seed: string
  crumbs: { name: string; path?: string }[]
  eyebrow?: ReactNode
  title: string[]
  intro?: ReactNode
  aside?: ReactNode
  children?: ReactNode
  align?: 'top' | 'center' | 'bottom'
}) {
  return (
    <section className="grain relative isolate flex min-h-[86svh] overflow-hidden bg-midnight text-white">
      <div className="absolute inset-0 -z-10 scale-105 animate-[heroZoom_14s_ease-out_forwards]">
        <Artwork art={art} seed={seed} priority align={align} />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,15,28,0.55)_0%,rgba(8,15,28,0.1)_35%,rgba(8,15,28,0.75)_100%)]" />
      <div className="container-x flex w-full flex-col justify-end pb-14 pt-36">
        <Breadcrumbs light items={crumbs} />
        {eyebrow && <div className="mt-8">{eyebrow}</div>}
        <SplitHeading as="h1" immediate delay={0.15} lines={title} className="mt-6 max-w-[16ch] text-display-lg" />
        <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
          {intro && (
            <Reveal delay={0.35} className="md:col-span-6">
              <div className="max-w-xl text-lg text-white/85">{intro}</div>
            </Reveal>
          )}
          {aside && (
            <Reveal delay={0.45} className="md:col-span-5 md:col-start-8">
              {aside}
            </Reveal>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}
