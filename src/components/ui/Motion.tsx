import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../../hooks/useMedia'
import { cn } from '../../utils/cn'

const EASE = [0.16, 1, 0.3, 1] as const

/** Fade-and-rise on first entry into the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'span' | 'p'
}) {
  const reduced = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </Comp>
  )
}

/**
 * Line-by-line masked headline reveal. Pass explicit lines for art-directed
 * breaks — this avoids fragile runtime text measurement.
 */
export function SplitHeading({
  lines,
  as: Tag = 'h2',
  className,
  delay = 0,
  immediate = false,
}: {
  lines: ReactNode[]
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  delay?: number
  immediate?: boolean
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })
  const reduced = useReducedMotion()
  const show = immediate || inView
  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="split-line">
          <motion.span
            className="split-inner"
            initial={reduced ? false : { y: '110%', rotate: 2 }}
            animate={show ? { y: '0%', rotate: 0 } : undefined}
            transition={{ duration: 1.25, delay: delay + i * 0.09, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/** Clip-path image reveal. */
export function MaskReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      initial={reduced ? false : { clipPath: 'inset(18% 10% 18% 10% round 28px)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 28px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1.4, delay, ease: EASE }}
    >
      <motion.div
        className="h-full w-full"
        initial={reduced ? false : { scale: 1.18 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 1.8, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export function SectionLabel({ index, children, className, light }: { index?: string; children: ReactNode; className?: string; light?: boolean }) {
  return (
    <p className={cn('label-mono flex items-center gap-3', light ? 'text-white/70' : 'text-muted', className)}>
      <span className={cn('inline-block h-1.5 w-1.5', 'bg-orange')} aria-hidden="true" />
      {index && <span className={light ? 'text-white' : 'text-navy'}>{index}</span>}
      {index && <span aria-hidden="true">—</span>}
      <span>{children}</span>
    </p>
  )
}

/** Small mono tag used for honest status labels (Proposed / Illustrative). */
export function StatusTag({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'light' | 'warn'; className?: string }) {
  return (
    <span
      className={cn(
        'label-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 !text-[0.62rem]',
        tone === 'light' && 'bg-white/15 text-white backdrop-blur',
        tone === 'default' && 'bg-navy/[0.06] text-navy',
        tone === 'warn' && 'bg-orange/10 text-[#b45200]',
        className,
      )}
    >
      {children}
    </span>
  )
}
