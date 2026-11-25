import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function Breadcrumbs({ items, light, className }: { items: { name: string; path?: string }[]; light?: boolean; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('label-mono', light ? 'text-white/70' : 'text-muted', className)}>
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className={cn('transition-colors', light ? 'hover:text-white' : 'hover:text-navy')}>
            Home
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {it.path && i < items.length - 1 ? (
              <Link to={it.path} className={cn('transition-colors', light ? 'hover:text-white' : 'hover:text-navy')}>
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className={light ? 'text-white' : 'text-navy'}>
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
