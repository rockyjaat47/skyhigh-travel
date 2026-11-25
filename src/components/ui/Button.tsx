import { ArrowUpRight } from 'lucide-react'
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'dark' | 'light' | 'outline' | 'outline-light' | 'ghost'

const styles: Record<Variant, string> = {
  primary: 'bg-orange text-white hover:bg-[#ff8a1f]',
  dark: 'bg-navy text-white hover:bg-midnight',
  light: 'bg-white text-navy hover:bg-cloud',
  outline: 'border border-navy/20 text-navy hover:border-navy hover:bg-navy hover:text-white',
  'outline-light': 'border border-white/30 text-white hover:bg-white hover:text-navy',
  ghost: 'text-navy hover:bg-navy/5',
}

interface BaseProps {
  variant?: Variant
  size?: 'md' | 'lg'
  icon?: boolean
  magnetic?: boolean
  className?: string
  children: ReactNode
}

type ButtonProps = BaseProps &
  (
    | ({ to: string; href?: never } & Omit<ComponentPropsWithoutRef<typeof Link>, 'to' | 'className' | 'children'>)
    | ({ href: string; to?: never } & Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'children'>)
    | ({ to?: never; href?: never } & Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'>)
  )

/** Pill CTA with an optional magnetic pull on fine pointers. */
export function Button({ variant = 'primary', size = 'md', icon = true, magnetic = true, className, children, ...rest }: ButtonProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const enabled = magnetic && fine && !reduced

  const onMove = (e: React.PointerEvent) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) * 0.22
    const y = (e.clientY - r.top - r.height / 2) * 0.3
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  const cls = cn(
    'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em]',
    'transition-[background-color,color,border-color,transform] duration-500 ease-[var(--ease-expo)]',
    size === 'lg' ? 'h-14 px-7 text-[0.95rem]' : 'h-11 px-5 text-sm',
    styles[variant],
    className,
  )

  const inner = (
    <span ref={ref} className="inline-flex items-center gap-2 transition-transform duration-500 ease-[var(--ease-expo)]">
      {children}
      {icon && (
        <span className="relative -mr-1 grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-current/10">
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-4 group-hover:-translate-y-4" />
          <ArrowUpRight className="absolute h-3.5 w-3.5 -translate-x-4 translate-y-4 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0 group-hover:translate-y-0" />
        </span>
      )}
    </span>
  )

  const handlers = { onPointerMove: onMove, onPointerLeave: onLeave }

  if ('to' in rest && rest.to !== undefined) {
    const { to, ...linkRest } = rest
    return (
      <Link to={to} className={cls} {...handlers} {...linkRest}>
        {inner}
      </Link>
    )
  }
  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={cls} {...handlers} {...(rest as ComponentPropsWithoutRef<'a'>)}>
        {inner}
      </a>
    )
  }
  return (
    <button className={cls} {...handlers} {...(rest as ComponentPropsWithoutRef<'button'>)}>
      {inner}
    </button>
  )
}
