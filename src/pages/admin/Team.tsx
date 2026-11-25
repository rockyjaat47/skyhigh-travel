import { Mail, UserMinus, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { Role, TeamMember } from '../../services/adminApi'
import { useAdminApi, useRole } from './AdminApp'
import { Btn, fmtDate, Notice, PageTitle, Panel } from './ui'

export function Team() {
  const api = useAdminApi()
  const role = useRole()
  const [team, setTeam] = useState<TeamMember[] | null>(null)
  const [email, setEmail] = useState('')
  const [newRole, setNewRole] = useState<Role>('editor')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const load = useCallback(() => {
    api
      .listTeam()
      .then(setTeam)
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setTeam([])))
  }, [api])
  useEffect(load, [load])

  if (role !== 'admin')
    return (
      <>
        <PageTitle title="Team" />
        <Notice kind="info">Only owners (admin role) can manage the team.</Notice>
      </>
    )

  return (
    <>
      <PageTitle title="Team" sub="Give staff their own login. Nobody shares passwords." />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <Panel className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-medium text-navy">Invite someone</h2>
        <p className="mt-1 text-sm text-muted">They’ll get an email with a sign-in link. No password needed.</p>
        <form
          className="mt-6 grid gap-3 sm:grid-cols-[1fr_12rem_auto]"
          onSubmit={async (e) => {
            e.preventDefault()
            const addr = email.trim().toLowerCase()
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) return setMsg({ kind: 'error', text: 'Enter a valid email address.' })
            setBusy(true)
            setMsg(null)
            try {
              await api.inviteMember(addr, newRole)
              setEmail('')
              setMsg({ kind: 'success', text: `Invite sent to ${addr}.` })
              load()
            } catch (err) {
              setMsg({ kind: 'error', text: (err as Error).message })
              load()
            } finally {
              setBusy(false)
            }
          }}
        >
          <label className="relative flex items-center">
            <span className="sr-only">Email</span>
            <Mail className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="h-11 w-full rounded-full border border-line pl-11 pr-4 text-sm outline-none focus:border-navy" />
          </label>
          <select aria-label="Role" value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} className="h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold">
            <option value="editor">Editor</option>
            <option value="admin">Owner (admin)</option>
          </select>
          <Btn type="submit" variant="orange" className="h-11" disabled={busy}>
            <UserPlus className="h-4 w-4" /> {busy ? 'Sending…' : 'Send invite'}
          </Btn>
        </form>
        <ul className="mt-6 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li>
            <strong className="text-navy">Editor</strong> — can edit all content, photos and enquiries.
          </li>
          <li>
            <strong className="text-navy">Owner</strong> — everything, plus deleting items and managing the team.
          </li>
        </ul>
      </Panel>

      <Panel className="mt-6">
        <ul className="divide-y divide-line">
          {team === null ? (
            <li className="p-6 text-sm text-muted">Loading…</li>
          ) : (
            team.map((m) => (
              <li key={m.email} className="flex flex-wrap items-center gap-4 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-navy font-display text-sm font-semibold uppercase text-white">{m.email[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">{m.email}</p>
                  <p className="text-xs text-muted">
                    {m.role === 'admin' ? 'Owner' : 'Editor'} · {m.pending ? 'Invite pending' : `Joined ${fmtDate(m.created_at)}`}
                  </p>
                </div>
                <Btn
                  variant="danger"
                  className="h-9"
                  onClick={async () => {
                    if (!window.confirm(`Remove ${m.email} from the admin team?`)) return
                    try {
                      await api.removeMember(m.email)
                      load()
                    } catch (e) {
                      setMsg({ kind: 'error', text: (e as Error).message })
                    }
                  }}
                >
                  <UserMinus className="h-4 w-4" /> Remove
                </Btn>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </>
  )
}
