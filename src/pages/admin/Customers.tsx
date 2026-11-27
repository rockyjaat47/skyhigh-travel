import { Check, RefreshCw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { adminCommerce, type AgentStatus, type CustomerRow } from '../../services/customer'
import { cn } from '../../utils/cn'
import { useAdminApi } from './AdminApp'
import { Btn, fmtDate, Notice, PageTitle, Panel } from './ui'

const AGENT: Record<AgentStatus, { label: string; cls: string }> = {
  none: { label: 'Customer', cls: 'bg-grey text-muted' },
  pending: { label: 'Agent — pending', cls: 'bg-orange/10 text-[#b45200]' },
  approved: { label: 'Agent', cls: 'bg-[#16a34a]/10 text-[#15803d]' },
  rejected: { label: 'Agent — rejected', cls: 'bg-[#c2410c]/10 text-[#9a3412]' },
}

export function Customers() {
  const api = useAdminApi()
  const [rows, setRows] = useState<CustomerRow[] | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const load = useCallback(() => {
    setRows(null)
    adminCommerce
      .customers()
      .then(setRows)
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setRows([])))
  }, [])
  useEffect(load, [load])

  const setAgent = async (r: CustomerRow, s: AgentStatus) => {
    try {
      await adminCommerce.setAgentStatus(r.user_id, s)
      setRows((rs) => rs?.map((x) => (x.user_id === r.user_id ? { ...x, agent_status: s } : x)) ?? null)
      setMsg({ kind: 'success', text: s === 'approved' ? `${r.agency_name || r.email} can now see agent rates.` : 'Updated.' })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  if (api.mode === 'preview') return <Notice kind="info">Customers need the live database — not available in local preview.</Notice>

  const term = q.trim().toLowerCase()
  const visible = rows?.filter(
    (r) => !r.is_admin && (filter === 'all' || r.agent_status === filter) && (!term || [r.email, r.full_name, r.phone, r.agency_name, r.city].join(' ').toLowerCase().includes(term)),
  )
  const pending = rows?.filter((r) => r.agent_status === 'pending').length ?? 0

  return (
    <>
      <PageTitle
        title="Customers & agents"
        sub="Everyone who created an account. Approve travel agents here so they see agent rates."
        actions={
          <Btn variant="light" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Btn>
        }
      />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <Panel className="mb-4 p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative flex items-center">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, agency…" className="h-10 w-full rounded-full border border-line pl-9 pr-4 text-sm" />
          </label>
          <div className="flex gap-2">
            {(
              [
                ['all', 'All'],
                ['pending', `Agent applications${pending ? ` (${pending})` : ''}`],
                ['approved', 'Approved agents'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} className={cn('h-10 rounded-full px-4 text-sm font-semibold', filter === k ? 'bg-navy text-white' : 'border border-line text-navy hover:border-navy')}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="label-mono border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Phone / city</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium" />
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
                  No customers here yet.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.user_id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{r.full_name || '—'}</p>
                    <p className="text-xs text-muted">{r.email}</p>
                    {r.agent_status !== 'none' && (
                      <div className="mt-2 rounded-xl bg-cloud p-2 text-xs text-navy">
                        <p className="font-semibold">{r.agency_name}</p>
                        {r.agency_gstin && <p>GSTIN {r.agency_gstin}</p>}
                        {r.agency_note && <p className="mt-1 whitespace-pre-line text-muted">{r.agency_note}</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p>{r.phone || '—'}</p>
                    <p className="text-xs text-muted">{r.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('label-mono inline-flex rounded-full px-2.5 py-1 !text-[0.6rem]', AGENT[r.agent_status].cls)}>{AGENT[r.agent_status].label}</span>
                  </td>
                  <td className="px-4 py-3">{r.bookings}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {r.agent_status === 'pending' && (
                        <>
                          <Btn onClick={() => setAgent(r, 'approved')}>
                            <Check className="h-4 w-4" /> Approve
                          </Btn>
                          <Btn variant="danger" onClick={() => setAgent(r, 'rejected')}>
                            <X className="h-4 w-4" /> Reject
                          </Btn>
                        </>
                      )}
                      {r.agent_status === 'approved' && (
                        <Btn variant="light" onClick={() => window.confirm('Remove agent access? They will see public prices again.') && setAgent(r, 'none')}>
                          Remove agent access
                        </Btn>
                      )}
                      {r.agent_status === 'rejected' && (
                        <Btn variant="light" onClick={() => setAgent(r, 'approved')}>
                          Approve anyway
                        </Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>
    </>
  )
}
