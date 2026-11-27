import { BadgeCheck, Briefcase, Clock, Handshake, Percent } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Field } from '../components/ui/FormBits'
import { Seo } from '../components/ui/Seo'
import { useCustomer } from '../hooks/useCustomer'
import { customerApi } from '../services/customer'

const perks = [
  { icon: Percent, title: 'Agent rates', text: 'Net B2B prices on our packages, visible on each package page once you’re approved.' },
  { icon: Briefcase, title: 'Book for your clients', text: 'Send booking requests in your clients’ names and track them from one account.' },
  { icon: Handshake, title: 'One point of contact', text: 'Our team confirms availability, final pricing and the paperwork with you directly.' },
]

function ApplyForm() {
  const { profile, refresh } = useCustomer()
  const [agency, setAgency] = useState(profile?.agency_name ?? '')
  const [gstin, setGstin] = useState(profile?.agency_gstin ?? '')
  const [note, setNote] = useState(profile?.agency_note ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await customerApi.requestAgent(agency.trim(), gstin.trim(), note.trim())
      await refresh()
    } catch (e2) {
      setErr((e2 as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Agency / company name">
        <input required minLength={2} value={agency} onChange={(e) => setAgency(e.target.value)} className="field-input" autoComplete="organization" />
      </Field>
      <Field label="GSTIN (optional)">
        <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={20} className="field-input" />
      </Field>
      <Field label="About your business" hint="City, years in business, the kind of trips you sell.">
        <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className="field-input resize-none" />
      </Field>
      {err && (
        <p role="alert" className="text-sm text-[#c2410c]">
          {err}
        </p>
      )}
      <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-navy font-semibold text-white disabled:opacity-60">
        {busy ? 'Sending…' : 'Apply for agent access'}
      </button>
    </form>
  )
}

export default function Agents() {
  const { enabled, status, profile } = useCustomer()
  const s = profile?.agent_status ?? 'none'

  return (
    <>
      <Seo title="Travel agents (B2B)" description="Partner with Skyhigh Travel: agent rates on tour packages, booking requests for your clients and a single point of contact." />
      <section className="bg-cloud pb-24 pt-32 sm:pt-40">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="label-mono text-orange">Partner programme</p>
            <h1 className="mt-4 text-display-sm text-navy">For travel agents & tour operators.</h1>
            <p className="mt-5 max-w-lg text-lg text-muted">Sell Skyhigh packages to your clients at agent rates. Create an account, apply once, and our team reviews your application.</p>
            <ul className="mt-10 space-y-6">
              {perks.map((p) => (
                <li key={p.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-orange">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="font-display text-lg font-medium text-navy">{p.title}</span>
                    <span className="mt-1 block text-sm text-muted">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <div className="rounded-[2rem] border border-line bg-white p-8 sm:p-10">
              {!enabled ? (
                <p className="text-navy">
                  Agent sign-up isn’t available online yet — please <Link to="/contact" className="underline">contact us</Link>.
                </p>
              ) : status === 'loading' ? (
                <p className="label-mono text-muted">Loading…</p>
              ) : status === 'signed-out' ? (
                <>
                  <h2 className="font-display text-2xl font-medium text-navy">Step 1 — create your account</h2>
                  <p className="mt-2 text-sm text-muted">Then come back to this page to apply.</p>
                  <div className="mt-8 grid gap-3">
                    <Link to="/login?mode=signup&next=/agents" className="inline-flex h-12 items-center justify-center rounded-full bg-navy font-semibold text-white">
                      Create account
                    </Link>
                    <Link to="/login?next=/agents" className="inline-flex h-12 items-center justify-center rounded-full border border-line font-semibold text-navy hover:border-navy">
                      I already have an account
                    </Link>
                  </div>
                </>
              ) : s === 'approved' ? (
                <div>
                  <BadgeCheck className="h-8 w-8 text-[#16a34a]" />
                  <h2 className="mt-4 font-display text-2xl font-medium text-navy">You’re an approved agent</h2>
                  <p className="mt-2 text-sm text-muted">Agent rates appear on package pages while you’re signed in.</p>
                  <Link to="/packages" className="mt-6 inline-flex h-12 items-center rounded-full bg-navy px-6 font-semibold text-white">
                    Browse packages
                  </Link>
                </div>
              ) : s === 'pending' ? (
                <div>
                  <Clock className="h-8 w-8 text-orange" />
                  <h2 className="mt-4 font-display text-2xl font-medium text-navy">Application received</h2>
                  <p className="mt-2 text-sm text-muted">We’re reviewing {profile?.agency_name}. You’ll hear from us soon — you can already book at public prices meanwhile.</p>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-medium text-navy">{s === 'rejected' ? 'Apply again' : 'Apply for agent access'}</h2>
                  <p className="mb-6 mt-2 text-sm text-muted">Signed in as {profile?.full_name || 'you'}.</p>
                  <ApplyForm />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
