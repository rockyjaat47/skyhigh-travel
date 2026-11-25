import { useRef } from 'react'
import { gsap, useGSAP } from '../../animations/gsap'
import { useReducedMotion } from '../../hooks/useMedia'
import { cn } from '../../utils/cn'

/**
 * Words brighten one by one as the paragraph scrolls through the viewport.
 * `highlight` words get the accent colour. Purely presentational: the full
 * text is always in the DOM and readable.
 */
export function ScrubWords({
  text,
  highlight = [],
  className,
  dimClass = 'opacity-[0.18]',
  as: Tag = 'p',
}: {
  text: string
  highlight?: string[]
  className?: string
  dimClass?: string
  as?: 'p' | 'h2' | 'blockquote'
}) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  useGSAP(
    () => {
      if (reduced || !ref.current) return
      const words = ref.current.querySelectorAll('[data-w]')
      gsap.fromTo(
        words,
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 82%', end: 'bottom 45%', scrub: 0.6 },
        },
      )
    },
    { scope: ref, dependencies: [reduced, text] },
  )
  const words = text.split(' ')
  return (
    <Tag ref={ref as never} className={className}>
      {words.map((w, i) => {
        const clean = w.replace(/[^\w’'-]/g, '').toLowerCase()
        const hl = highlight.some((h) => h.toLowerCase() === clean)
        return (
          <span key={i} data-w className={cn(!reduced && dimClass, hl && 'text-orange')} style={reduced ? undefined : { opacity: 0.16 }}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </Tag>
  )
}
