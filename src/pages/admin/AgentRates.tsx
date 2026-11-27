import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useContent } from '../../hooks/useContent'
import { adminCommerce } from '../../services/customer'
import { formatINR, hasPrice } from '../../utils/price'
import { useAdminApi } from './AdminApp'
import { Btn, Notice, PageTitle, Panel } from './ui'

export function AgentRates() {
  const api = useAdminApi()
  const { packages } = useContent()
  const [rates, setRates] = useState<Record<string, string> | null>(null)
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    adminCommerce
      .agentRates()
      .then((r) => {
        const m = Object.fromEntries(r.map((x) => [x.package_slug, String(x.price_per_person)]))
        setRates(m)
        setSaved(m)
      })
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setRates({})))
  }, [])

  const save = async (slug: string) => {
    const v = rates?.[slug]?.trim() ?? ''
    const n = v === '' ? null : Number(v)
    if (n !== null && (!Number.isFinite(n) || n <= 0)) return setMsg({ kind: 'error', text: 'Enter a price above 0, or leave empty to remove the agent rate.' })
    setBusy(slug)
    try {
      await adminCommerce.saveAgentRate(slug, n)
      setSaved((s) => ({ ...s, [slug]: v }))
      setMsg({ kind: 'success', text: n === null ? 'Agent rate removed.' : `Agent rate saved: ${formatINR(n)} per person.` })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy('')
    }
  }

  if (api.mode === 'preview') return <Notice kind="info">Agent rates need the live database — not available in local preview.</Notice>

  return (
    <>
      <PageTitle title="Agent rates (B2B)" sub="Net price per person shown only to approved travel agents. Leave empty to give agents the public price." />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Panel className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="label-mono border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="px-4 py-3 font-medium">Public price</th>
              <th className="px-4 py-3 font-medium">Agent price (₹ / person)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rates ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : (
              packages.map((p) => {
                const dirty = (rates[p.slug] ?? '') !== (saved[p.slug] ?? '')
                return (
                  <tr key={p.slug}>
                    <td className="px-4 py-3 font-semibold text-navy">{p.title}</td>
                    <td className="px-4 py-3 text-muted">{hasPrice(p) ? formatINR(p.pricePerPerson!) : 'On request'}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        aria-label={`Agent price for ${p.title}`}
                        value={rates[p.slug] ?? ''}
                        onChange={(e) => setRates({ ...rates, [p.slug]: e.target.value })}
                        className="h-10 w-40 rounded-xl border border-line px-3"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Btn disabled={!dirty || busy === p.slug} onClick={() => save(p.slug)}>
                        <Save className="h-4 w-4" /> {busy === p.slug ? 'Saving…' : 'Save'}
                      </Btn>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </Panel>
    </>
  )
}
