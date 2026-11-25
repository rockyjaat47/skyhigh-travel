import { BRAND_COLORS, MARK_DOT, MARK_FACET_PATH, MARK_PATH, MARK_TRANSFORM, MARK_VIEWBOX } from '../../config/brandMark'
import { cn } from '../../utils/cn'

type Tone = 'color' | 'white' | 'dark'

export function LogoMark({ tone = 'color', className }: { tone?: Tone; className?: string }) {
  const body = tone === 'white' ? '#fff' : tone === 'dark' ? BRAND_COLORS.midnight : BRAND_COLORS.navy
  const facet = tone === 'white' ? 'rgba(255,255,255,0.7)' : tone === 'dark' ? BRAND_COLORS.midnight : BRAND_COLORS.sky
  return (
    <svg viewBox={MARK_VIEWBOX} className={cn('shrink-0', className)} aria-hidden="true">
      <g transform={MARK_TRANSFORM}>
        <path d={MARK_PATH} fill={body} />
        <path d={MARK_FACET_PATH} fill={facet} />
      </g>
      <circle {...MARK_DOT} fill={BRAND_COLORS.orange} />
    </svg>
  )
}

/** Horizontal lockup used in navigation and footer. Text uses the web font for crispness. */
export function Logo({ tone = 'color', compact, className }: { tone?: Tone; compact?: boolean; className?: string }) {
  const text = tone === 'white' ? 'text-white' : tone === 'dark' ? 'text-midnight' : 'text-navy'
  return (
    <span className={cn('inline-flex items-center gap-2.5', text, className)}>
      <LogoMark tone={tone} className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] font-bold tracking-[0.02em]">SKYHIGH</span>
        {!compact && (
          <span className="mt-1 hidden font-display text-[0.5rem] font-medium tracking-[0.29em] opacity-70 sm:block">
            TRAVEL BIRD TECHNOLOGY
          </span>
        )}
      </span>
    </span>
  )
}
