import { ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { EnquiryRow } from '../../services/adminApi'
import { adminCommerce } from '../../services/customer'
import { enquiryServices } from '../../services/enquirySchema'
import type { EnquiryStatus } from '../../types/content'
import { useAdminApi } from './AdminApp'
import { fmtDate, Notice, PageTitle, Panel, STATUS, StatusPill } from './ui'

export function Dashboard() {
  const api = useAdminApi()
  const [rows, setRows] = useState<EnquiryRow[] | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [now] = useState(() => Date.now())
  const [shop, setShop] = useState<{ bookings: number; agents: number; reviews: number } | null>(null)

  useEffect(() => {
    if (api.mode === 'preview') return
    Promise.all([adminCommerce.bookings('pending'), adminCommerce.customers(), adminCommerce.reviews('pending')])
      .then(([b, c, r]) => setShop({ bookings: b.length, agents: c.filter((x) => x.agent_status === 'pending').length, reviews: r.length }))
      .catch(() => setShop(null))
  }, [api])

  useEffect(() => {
    Promise.all([api.listEnquiries(), api.listContent('destinations'), api.listContent('packages'), api.listContent('services')])
      .then(([e, d, p, s]) => {
        setRows(e)
        setCounts({ destinations: d.length, packages: p.length, services: s.length })
      })
      .catch((err) => setError(err.message))
  }, [api])

  const byStatus = (s: EnquiryStatus) => rows?.filter((r) => r.status === s).length ?? 0
  const week = rows?.filter((r) => now - new Date(r.created_at).getTime() < 7 * 864e5).length ?? 0
  const byService = enquiryServices.map((s) => ({ ...s, n: rows?.filter((r) => r.service === s.id).length ?? 0 }))
  const max = Math.max(1, ...byService.map((s) => s.n))

  return (
    <>
      <PageTitle title="Overview" sub="Bookings, enquiries and content at a glance." />
      {error && <Notice kind="error">{error}</Notice>}
      {shop && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          {(
            [
              ['Bookings to confirm', shop.bookings, '/admin/bookings'],
              ['Agent applications', shop.agents, '/admin/customers'],
              ['Reviews to approve', shop.reviews, '/admin/reviews'],
            ] as const
          ).map(([label, value, to]) => (
            <Link key={label} to={to} className="group">
              <Panel className={value ? 'border-orange/50 bg-orange/5 p-6 transition-colors group-hover:border-orange' : 'p-6 transition-colors group-hover:border-navy'}>
                <p className="label-mono text-muted">{label}</p>
                <p className="mt-4 font-display text-5xl font-medium tracking-tight text-navy">{value}</p>
              </Panel>
            </Link>
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['New enquiries', byStatus('new'), '/admin/enquiries'],
          ['Last 7 days', week, '/admin/enquiries'],
          ['In progress', byStatus('contacted') + byStatus('quoted'), '/admin/enquiries'],
          ['Published destinations', counts.destinations ?? '—', '/admin/destinations'],
        ].map(([label, value, to]) => (
          <Link key={label as string} to={to as string} className="group">
            <Panel className="p-6 transition-colors group-hover:border-navy">
              <p className="label-mono text-muted">{label}</p>
              <p className="mt-4 font-display text-5xl font-medium tracking-tight text-navy">{rows ? value : '…'}</p>
            </Panel>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Edit home page text', '/admin/content/home'],
          ['Add a destination', '/admin/destinations'],
          ['Upload photos', '/admin/media'],
          ['Update phone / WhatsApp', '/admin/settings/contact'],
        ].map(([label, to]) => (
          <Link key={to} to={to} className="flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4 text-sm font-semibold text-navy hover:border-navy">
            {label} <ArrowUpRight className="h-4 w-4" />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Panel className="p-6 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-medium text-navy">Recent enquiries</h2>
            <Link to="/admin/enquiries" className="label-mono inline-flex items-center gap-1 text-navy hover:text-orange">
              All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {!rows ? (
            <p className="mt-6 text-sm text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No enquiries yet. They will appear here as soon as visitors submit the form.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {rows.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{r.full_name}</p>
                    <p className="truncate text-muted">
                      {enquiryServices.find((s) => s.id === r.service)?.label} · {r.departure} → {r.destination}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill s={r.status} />
                    <span className="text-xs text-muted">{fmtDate(r.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="p-6 xl:col-span-2">
          <h2 className="font-display text-lg font-medium text-navy">Demand by service</h2>
          <ul className="mt-6 space-y-3">
            {byService.map((s) => (
              <li key={s.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-navy">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.n}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-grey">
                  <div className="h-full rounded-full bg-navy" style={{ width: `${(s.n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2">
            {(Object.keys(STATUS) as EnquiryStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-2 text-xs text-muted">
                <StatusPill s={s} /> {byStatus(s)}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}
