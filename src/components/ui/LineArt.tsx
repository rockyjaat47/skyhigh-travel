import { motion } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useMedia'

type Kind = 'coach' | 'truck' | 'network'

/** Technical line drawings that "draw themselves" when scrolled into view. */
const PATHS: Record<Kind, string[]> = {
  coach: [
    'M20 150 H300 Q316 150 316 134 V78 Q316 52 290 52 H58 Q34 52 28 74 L20 110 Z',
    'M40 72 H130 V108 H34 Z',
    'M142 72 H198 V108 H142 Z',
    'M210 72 H266 V108 H210 Z',
    'M278 72 H300 V124 H278 Z',
    'M20 122 H270',
    'M56 150 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0',
    'M234 150 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0',
    'M0 172 H340',
  ],
  truck: [
    'M20 140 V54 H210 V140 Z',
    'M210 82 H262 L296 112 V140 H210',
    'M224 90 H258 L280 110 H224 Z',
    'M20 140 H300',
    'M60 140 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0',
    'M104 140 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0',
    'M246 140 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0',
    'M44 78 H120 M44 96 H90',
    'M0 166 H340',
  ],
  network: [
    'M40 130 C90 40 160 40 200 90 S300 150 310 50',
    'M40 130 C120 150 200 160 290 140',
    'M200 90 L290 140',
    'M40 130 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0',
    'M192 90 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0',
    'M302 50 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0',
    'M282 140 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0',
    'M20 172 H340',
  ],
}

export function LineArt({ kind, className }: { kind: Kind; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <svg viewBox="0 0 340 180" className={className} fill="none" aria-hidden="true">
      {PATHS[kind].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: '0px 0px -15% 0px' }}
          transition={{ duration: 1.6, delay: i * 0.12, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
      {kind === 'network' && !reduced && (
        <circle r="4" fill="#FF7900">
          <animateMotion dur="4s" repeatCount="indefinite" path={PATHS.network[0]} />
        </circle>
      )}
    </svg>
  )
}
