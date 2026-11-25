import type { ReactNode } from 'react'
import type { EnquiryStatus } from '../../types/content'
import { cn } from '../../utils/cn'

export function PageTitle({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-navy sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Btn({ children, variant = 'dark', className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'dark' | 'light' | 'danger' | 'orange' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'dark' && 'bg-navy text-white hover:bg-midnight',
        variant === 'light' && 'border border-line bg-white text-navy hover:border-navy',
        variant === 'danger' && 'border border-[#c2410c]/30 bg-white text-[#c2410c] hover:bg-[#c2410c] hover:text-white',
        variant === 'orange' && 'bg-orange text-white hover:bg-[#ff8a1f]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export const STATUS: Record<EnquiryStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-sky/10 text-[#0074a6]' },
  contacted: { label: 'Contacted', cls: 'bg-[#7c3aed]/10 text-[#6d28d9]' },
  quoted: { label: 'Quoted', cls: 'bg-orange/10 text-[#b45200]' },
  closed: { label: 'Closed', cls: 'bg-[#16a34a]/10 text-[#15803d]' },
  spam: { label: 'Spam', cls: 'bg-grey text-muted' },
}

export function StatusPill({ s }: { s: EnquiryStatus }) {
  return <span className={cn('label-mono inline-flex rounded-full px-2.5 py-1 !text-[0.6rem]', STATUS[s].cls)}>{STATUS[s].label}</span>
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-[1.4rem] border border-line bg-white', className)}>{children}</div>
}

export function Notice({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-6 rounded-2xl border p-4 text-sm',
        kind === 'error' && 'border-[#c2410c]/30 bg-[#c2410c]/5 text-[#9a3412]',
        kind === 'success' && 'border-[#16a34a]/30 bg-[#16a34a]/5 text-[#166534]',
        kind === 'info' && 'border-line bg-white text-navy',
      )}
    >
      {children}
    </div>
  )
}

export const fmtDate = (s: string) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
