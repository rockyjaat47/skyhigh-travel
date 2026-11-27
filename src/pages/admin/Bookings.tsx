import { Download, Mail, MessageCircle, Phone, RefreshCw, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { adminCommerce, BOOKING_STATUS, type Booking, type BookingStatus } from '../../services/customer'
import { cn } from '../../utils/cn'
import { fmtDay, formatINR } from '../../utils/price'
import { useAdminApi, useRole } from './AdminApp'
import { Btn, fmtDate, Notice, PageTitle, Panel } from './ui'

export function BookingPill({ s }: { s: BookingStatus }) {
  return <span className={cn('label-mono inline-flex rounded-full px-2.5 py-1 !text-[0.6rem]', BOOKING_STATUS[s].cls)}>{BOOKING_STATUS[s].label}</span>
}

const waNumber = (p: string) => {
  const d = p.replace(/\D/g, '')
  return d.length === 10 ? `91${d}` : d
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export function Bookings() {
  const api = useAdminApi()
  const role = useRole()
  const [status, setStatus] = useState<BookingStatus | 'all'>('all')
  const [rows, setRows] = useState<Booking[] | null>(null)
  const [sel, setSel] = useState<Booking | null>(null)
  const [notes, setNotes] = useState('')
  const [price, setPrice] = useState('')
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const load = useCallback(() => {
    setRows(null)
    adminCommerce
      .bookings(status)
      .then(setRows)
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setRows([])))
  }, [status])
  useEffect(load, [load])

  const pick = (b: Booking) => (setSel(b), setNotes(b.admin_notes ?? ''), setPrice(b.price_per_person ? String(b.price_per_person) : ''))

  const update = async (b: Booking, patch: Partial<Pick<Booking, 'status' | 'admin_notes' | 'price_per_person'>>) => {
    try {
      await adminCommerce.updateBooking(b.id, patch)
      const next = { ...b, ...patch }
      setRows((rs) => rs?.map((x) => (x.id === b.id ? next : x)) ?? null)
      setSel(next)
      setMsg({ kind: 'success', text: 'Booking updated.' })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  const exportCsv = () => {
    if (!rows?.length) return
    const head = ['Ref', 'Received', 'Status', 'Package', 'Travel date', 'Adults', 'Children', 'Name', 'Phone', 'Email', 'Price/person', 'Rate', 'Notes', 'Admin notes']
    const lines = rows.map((b) => [b.id.slice(0, 8).toUpperCase(), b.created_at, b.status, b.package_title, b.travel_date, b.adults, b.children, b.contact_name, b.contact_phone, b.contact_email, b.price_per_person, b.rate_type, b.notes, b.admin_notes].map(csvCell).join(','))
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `skyhigh-bookings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (api.mode === 'preview') return <Notice kind="info">Bookings need the live database — not available in local preview.</Notice>

  return (
    <>
      <PageTitle
        title="Bookings"
        sub="Booking requests from signed-in customers. Confirm them after you’ve spoken to the customer."
        actions={
          <>
            <Btn variant="light" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Btn>
            <Btn onClick={exportCsv} disabled={!rows?.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Btn>
          </>
        }
      />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={cn('h-9 rounded-full px-4 text-sm font-semibold', status === s ? 'bg-navy text-white' : 'border border-line bg-white text-navy hover:border-navy')}>
            {s === 'all' ? 'All' : BOOKING_STATUS[s].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <Panel className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="label-mono border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Travel</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!rows ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No bookings here yet.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} tabIndex={0} onClick={() => pick(b)} onKeyDown={(e) => e.key === 'Enter' && pick(b)} className={cn('cursor-pointer transition-colors hover:bg-cloud', sel?.id === b.id && 'bg-cloud')}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(b.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{b.contact_name}</p>
                      <p className="text-xs text-muted">{b.contact_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      {b.package_title}
                      {b.rate_type === 'agent' && <span className="label-mono ml-2 rounded bg-[#16a34a]/10 px-1.5 py-0.5 !text-[0.55rem] text-[#15803d]">Agent</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {fmtDay(b.travel_date)} · {b.adults + b.children} pax
                    </td>
                    <td className="px-4 py-3">
                      <BookingPill s={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>

        <Panel className="h-fit p-6 xl:sticky xl:top-6">
          {!sel ? (
            <p className="text-sm text-muted">Select a booking to see details and confirm it.</p>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-medium text-navy">{sel.package_title}</p>
                  <p className="label-mono mt-1 !text-[0.6rem] text-muted">Ref {sel.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button type="button" aria-label="Close details" onClick={() => setSel(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-grey">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-5 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted">Traveller</dt>
                <dd className="text-navy">{sel.contact_name}</dd>
                <dt className="text-muted">Phone</dt>
                <dd className="text-navy">{sel.contact_phone}</dd>
                <dt className="text-muted">Account email</dt>
                <dd className="break-all text-navy">{sel.contact_email ?? '—'}</dd>
                <dt className="text-muted">Travel date</dt>
                <dd className="text-navy">{fmtDay(sel.travel_date)}</dd>
                <dt className="text-muted">Travellers</dt>
                <dd className="text-navy">
                  {sel.adults} adult(s), {sel.children} child(ren)
                </dd>
                <dt className="text-muted">Price / person</dt>
                <dd className="text-navy">
                  {sel.price_per_person ? `${formatINR(sel.price_per_person)} (${sel.rate_type === 'agent' ? 'agent rate' : 'public price'})` : 'Not set'}
                </dd>
                <dt className="text-muted">Estimate</dt>
                <dd className="font-semibold text-navy">{sel.price_per_person ? formatINR(sel.price_per_person * (sel.adults + sel.children)) : '—'}</dd>
                <dt className="text-muted">Received</dt>
                <dd className="text-navy">{fmtDate(sel.created_at)}</dd>
              </dl>
              {sel.notes && <p className="mt-4 whitespace-pre-line rounded-xl bg-cloud p-3 text-sm text-navy">{sel.notes}</p>}

              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`tel:${sel.contact_phone.replace(/\s/g, '')}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold text-navy hover:border-navy">
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${waNumber(sel.contact_phone)}?text=${encodeURIComponent(`Hello ${sel.contact_name}, this is Skyhigh Travel about your booking request for ${sel.package_title} on ${fmtDay(sel.travel_date)} (Ref ${sel.id.slice(0, 8).toUpperCase()}).`)}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold text-navy hover:border-navy"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                {sel.contact_email && (
                  <a href={`mailto:${sel.contact_email}?subject=${encodeURIComponent(`Your Skyhigh booking — ${sel.package_title}`)}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold text-navy hover:border-navy">
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}
              </div>

              <label className="mt-6 block">
                <span className="label-mono text-muted">Status</span>
                <select value={sel.status} onChange={(e) => update(sel, { status: e.target.value as BookingStatus })} className="mt-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm">
                  {(Object.keys(BOOKING_STATUS) as BookingStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {BOOKING_STATUS[s].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block">
                <span className="label-mono text-muted">Final price per person (₹)</span>
                <div className="mt-2 flex gap-2">
                  <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="h-10 w-full rounded-xl border border-line px-3 text-sm" />
                  <Btn variant="light" onClick={() => update(sel, { price_per_person: price ? Number(price) : null })}>
                    Save
                  </Btn>
                </div>
              </label>
              <label className="mt-4 block">
                <span className="label-mono text-muted">Internal notes (customer can’t see)</span>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full rounded-xl border border-line p-3 text-sm" />
              </label>
              <div className="mt-3 flex justify-between gap-2">
                <Btn onClick={() => update(sel, { admin_notes: notes || null })}>Save notes</Btn>
                {role === 'admin' && (
                  <Btn
                    variant="danger"
                    onClick={async () => {
                      if (!window.confirm('Delete this booking permanently? The customer will no longer see it.')) return
                      try {
                        await adminCommerce.deleteBooking(sel.id)
                        setSel(null)
                        load()
                      } catch (e) {
                        setMsg({ kind: 'error', text: (e as Error).message })
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Btn>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
