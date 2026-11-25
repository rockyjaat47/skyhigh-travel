import { Download, RefreshCw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toCsv, type EnquiryRow } from '../../services/adminApi'
import { enquiryServices } from '../../services/enquirySchema'
import type { EnquiryStatus } from '../../types/content'
import { cn } from '../../utils/cn'
import { useAdminApi } from './AdminApp'
import { Btn, fmtDate, Notice, PageTitle, Panel, STATUS, StatusPill } from './ui'

const serviceLabel = (id: string) => enquiryServices.find((s) => s.id === id)?.label ?? id

export function Enquiries() {
  const api = useAdminApi()
  const [rows, setRows] = useState<EnquiryRow[] | null>(null)
  const [status, setStatus] = useState<EnquiryStatus | 'all'>('all')
  const [service, setService] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<EnquiryRow | null>(null)
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const load = useCallback(() => {
    setRows(null)
    api
      .listEnquiries({ status, search })
      .then(setRows)
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setRows([])))
  }, [api, status, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const visible = rows?.filter((r) => service === 'all' || r.service === service) ?? null

  const update = async (r: EnquiryRow, patch: Partial<Pick<EnquiryRow, 'status' | 'admin_notes'>>) => {
    try {
      await api.updateEnquiry(r.id, patch)
      setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, ...patch } : x)) ?? null)
      if (selected?.id === r.id) setSelected({ ...r, ...patch })
      setMsg({ kind: 'success', text: 'Enquiry updated.' })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  const exportCsv = () => {
    if (!visible?.length) return
    const blob = new Blob(['﻿' + toCsv(visible)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `skyhigh-enquiries-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageTitle
        title="Enquiries"
        sub="Search, filter, update status and export."
        actions={
          <>
            <Btn variant="light" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Btn>
            <Btn onClick={exportCsv} disabled={!visible?.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Btn>
          </>
        }
      />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <Panel className="mb-4 p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="relative flex items-center">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone or place…" className="h-11 w-full rounded-full border border-line bg-cloud pl-11 pr-4 text-sm outline-none focus:border-navy" />
          </label>
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as EnquiryStatus | 'all')} className="h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold">
            <option value="all">All statuses</option>
            {(Object.keys(STATUS) as EnquiryStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
          <select aria-label="Filter by service" value={service} onChange={(e) => setService(e.target.value)} className="h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold">
            <option value="all">All services</option>
            {enquiryServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <Panel className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="label-mono border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!visible ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    No enquiries match these filters.
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={() => (setSelected(r), setNotes(r.admin_notes ?? ''))}
                    onKeyDown={(e) => e.key === 'Enter' && (setSelected(r), setNotes(r.admin_notes ?? ''))}
                    className={cn('cursor-pointer transition-colors hover:bg-cloud', selected?.id === r.id && 'bg-cloud')}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{r.full_name}</p>
                      <p className="text-xs text-muted">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">{serviceLabel(r.service)}</td>
                    <td className="px-4 py-3">
                      {r.departure} → {r.destination}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{r.travel_date}</td>
                    <td className="px-4 py-3">
                      <StatusPill s={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>

        <Panel className="h-fit p-6 xl:sticky xl:top-6">
          {!selected ? (
            <p className="text-sm text-muted">Select an enquiry to see details and update its status.</p>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-medium text-navy">{selected.full_name}</p>
                  <p className="text-sm text-muted">{fmtDate(selected.created_at)}</p>
                </div>
                <button type="button" aria-label="Close details" onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-grey">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                {[
                  ['Email', <a key="e" className="text-sky underline" href={`mailto:${selected.email}`}>{selected.email}</a>],
                  ['Phone', <a key="p" className="text-sky underline" href={`tel:${selected.phone.replace(/\s/g, '')}`}>{selected.phone}</a>],
                  ['Service', serviceLabel(selected.service)],
                  ['Route', `${selected.departure} → ${selected.destination}`],
                  ['Date', selected.travel_date],
                  ['Travellers', selected.travellers ?? '—'],
                  ['Budget', selected.budget ?? '—'],
                  ...Object.entries(selected.details ?? {})
                    .filter(([, v]) => v !== null && v !== undefined && v !== '')
                    .map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()), String(v)]),
                  ['Message', selected.message || '—'],
                  ['Source', selected.source_page ?? '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="grid grid-cols-[6.5rem_1fr] gap-2">
                    <dt className="label-mono pt-0.5 text-muted">{k}</dt>
                    <dd className="break-words text-navy">{v}</dd>
                  </div>
                ))}
              </dl>
              <label className="mt-6 block">
                <span className="label-mono text-muted">Status</span>
                <select value={selected.status} onChange={(e) => update(selected, { status: e.target.value as EnquiryStatus })} className="mt-2 h-11 w-full rounded-full border border-line bg-white px-4 text-sm font-semibold">
                  {(Object.keys(STATUS) as EnquiryStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS[s].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-5 block">
                <span className="label-mono text-muted">Internal notes</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} rows={4} className="mt-2 w-full rounded-2xl border border-line p-3 text-sm outline-none focus:border-navy" />
              </label>
              <Btn className="mt-3" onClick={() => update(selected, { admin_notes: notes.trim() || null })}>
                Save notes
              </Btn>
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
