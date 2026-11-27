import { BadgeCheck, CalendarDays, KeyRound, LogOut, Star, Users } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Field, PasswordInput } from '../components/ui/FormBits'
import { Seo } from '../components/ui/Seo'
import { useCustomer } from '../hooks/useCustomer'
import { BOOKING_STATUS, customerApi, type Booking } from '../services/customer'
import { cn } from '../utils/cn'
import { fmtDay, formatINR } from '../utils/price'

const card = 'rounded-[1.6rem] border border-line bg-white p-6 sm:p-8'

function Msg({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) {
  return (
    <p role={kind === 'error' ? 'alert' : 'status'} className={cn('mt-4 text-sm', kind === 'error' ? 'text-[#c2410c]' : 'text-[#15803d]')}>
      {children}
    </p>
  )
}

function NewPassword({ title, onDone }: { title: string; onDone?: () => void }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pw !== pw2) return setMsg({ kind: 'error', text: 'The two passwords don’t match.' })
    setBusy(true)
    setMsg(null)
    try {
      await customerApi.updatePassword(pw)
      setPw('')
      setPw2('')
      setMsg({ kind: 'ok', text: 'Password updated.' })
      onDone?.()
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className={card}>
      <h2 className="flex items-center gap-2 font-display text-xl font-medium text-navy">
        <KeyRound className="h-5 w-5 text-orange" /> {title}
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="New password" hint="At least 8 characters.">
          <PasswordInput value={pw} onChange={setPw} autoComplete="new-password" minLength={8} />
        </Field>
        <Field label="Repeat new password">
          <PasswordInput value={pw2} onChange={setPw2} autoComplete="new-password" minLength={8} />
        </Field>
      </div>
      {msg && <Msg kind={msg.kind}>{msg.text}</Msg>}
      <button type="submit" disabled={busy} className="mt-6 h-11 rounded-full bg-navy px-6 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? 'Saving…' : 'Save password'}
      </button>
    </form>
  )
}

function Bookings() {
  const [rows, setRows] = useState<Booking[] | null>(null)
  const [err, setErr] = useState('')
  const load = useCallback(() => {
    customerApi
      .myBookings()
      .then(setRows)
      .catch((e) => (setErr(e.message), setRows([])))
  }, [])
  useEffect(load, [load])

  const cancel = async (b: Booking) => {
    if (!window.confirm(`Cancel your booking request for ${b.package_title}?`)) return
    try {
      await customerApi.cancelBooking(b.id)
      load()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className={card}>
      <h2 className="flex items-center gap-2 font-display text-xl font-medium text-navy">
        <CalendarDays className="h-5 w-5 text-orange" /> My bookings
      </h2>
      {err && <Msg kind="error">{err}</Msg>}
      {rows === null ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-navy">No bookings yet.</p>
          <Link to="/packages" className="mt-3 inline-block text-sm font-semibold text-orange underline-offset-2 hover:underline">
            Browse packages →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {rows.map((b) => {
            const pax = b.adults + b.children
            return (
              <li key={b.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/packages/${b.package_slug}`} className="font-display text-lg font-medium text-navy hover:text-orange">
                    {b.package_title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {fmtDay(b.travel_date)} · {b.adults} adult{b.adults > 1 ? 's' : ''}
                    {b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}
                    {b.price_per_person ? ` · est. ${formatINR(b.price_per_person * pax)}${b.rate_type === 'agent' ? ' (agent rate)' : ''}` : ' · price to be quoted'}
                  </p>
                  <p className="label-mono mt-1 !text-[0.6rem] text-muted">Ref {b.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('label-mono rounded-full px-2.5 py-1 !text-[0.6rem]', BOOKING_STATUS[b.status].cls)}>{BOOKING_STATUS[b.status].label}</span>
                  {b.status === 'pending' && (
                    <button type="button" onClick={() => cancel(b)} className="text-sm text-muted underline-offset-2 hover:text-[#c2410c] hover:underline">
                      Cancel
                    </button>
                  )}
                  {(b.status === 'confirmed' || b.status === 'completed') && (
                    <Link to={`/packages/${b.package_slug}#reviews`} className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:text-orange">
                      <Star className="h-4 w-4" /> Review
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted">Bookings are requests until our team confirms availability and the final price with you by phone or WhatsApp. No payment is taken on this website.</p>
    </div>
  )
}

function Profile() {
  const { user, profile, refresh } = useCustomer()
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '', city: profile?.city ?? '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setMsg(null)
    try {
      await customerApi.updateProfile(user.id, { full_name: form.full_name.trim(), phone: form.phone.trim(), city: form.city.trim() })
      await refresh()
      setMsg({ kind: 'ok', text: 'Saved.' })
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={save} className={card}>
      <h2 className="font-display text-xl font-medium text-navy">Profile</h2>
      <p className="mt-1 text-sm text-muted">{user?.email}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <Field label="Full name">
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="field-input" autoComplete="name" />
        </Field>
        <Field label="Mobile">
          <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field-input" autoComplete="tel" />
        </Field>
        <Field label="City">
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field-input" autoComplete="address-level2" />
        </Field>
      </div>
      {msg && <Msg kind={msg.kind}>{msg.text}</Msg>}
      <button type="submit" disabled={busy} className="mt-6 h-11 rounded-full bg-navy px-6 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}

function AgentCard() {
  const { profile } = useCustomer()
  const s = profile?.agent_status ?? 'none'
  return (
    <div className={card}>
      <h2 className="flex items-center gap-2 font-display text-xl font-medium text-navy">
        <Users className="h-5 w-5 text-orange" /> Travel agent (B2B)
      </h2>
      {s === 'approved' ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-[#15803d]">
          <BadgeCheck className="h-4 w-4" /> Approved — agent rates are shown on package pages while you’re signed in.
        </p>
      ) : s === 'pending' ? (
        <p className="mt-3 text-sm text-muted">Your application for {profile?.agency_name} is being reviewed. We’ll be in touch.</p>
      ) : s === 'rejected' ? (
        <p className="mt-3 text-sm text-muted">
          Your agent application wasn’t approved. <Link to="/agents" className="underline">Contact us or apply again</Link>.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Run a travel agency? <Link to="/agents" className="font-semibold text-navy underline-offset-2 hover:underline">Apply for agent rates →</Link>
        </p>
      )}
    </div>
  )
}

export default function Account() {
  const { enabled, status, user, profile, recovery, clearRecovery, signOut } = useCustomer()
  if (!enabled) return <Navigate to="/contact" replace />
  if (status === 'signed-out' && !recovery) return <Navigate to="/login?next=/account" replace />

  return (
    <>
      <Seo title="My account" description="Your Skyhigh bookings and profile." noindex />
      <section className="bg-cloud pb-24 pt-32 sm:pt-40">
        <div className="container-x">
          {status === 'loading' ? (
            <p className="label-mono text-muted">Loading your account…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="label-mono text-orange">My account</p>
                  <h1 className="mt-3 text-display-sm text-navy">Hello{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1>
                </div>
                <button type="button" onClick={signOut} className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-navy hover:border-navy">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
              <div className="mt-10 grid gap-6">
                {recovery && user && <NewPassword title="Set a new password" onDone={clearRecovery} />}
                <Bookings />
                <div className="grid gap-6 lg:grid-cols-2">
                  <Profile key={profile?.user_id ?? 'none'} />
                  <AgentCard />
                </div>
                {!recovery && <NewPassword title="Change password" />}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
