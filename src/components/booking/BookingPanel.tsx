import { BadgeCheck, CalendarCheck, Minus, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCustomer } from '../../hooks/useCustomer'
import { customerApi } from '../../services/customer'
import type { TravelPackage } from '../../types/content'
import { discountPercent, formatINR, hasPrice } from '../../utils/price'
import { Field } from '../ui/FormBits'

const isoDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div>
      <span className="label-mono text-muted">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line text-navy hover:border-navy disabled:opacity-40">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center font-display text-lg text-navy" aria-live="polite">
          {value}
        </span>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line text-navy hover:border-navy disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/** Price box shown at the top of the package sidebar. */
export function PriceBox({ p, agentPrice }: { p: TravelPackage; agentPrice: number | null }) {
  const off = discountPercent(p)
  return (
    <div className="rounded-[1.6rem] border border-line bg-white p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono text-muted">{hasPrice(p) ? 'Starting from' : 'Price'}</p>
        {(off > 0 || p.offerLabel) && <span className="label-mono rounded-full bg-orange px-2.5 py-1 !text-[0.6rem] text-white">{off > 0 ? `${off}% off` : p.offerLabel}</span>}
      </div>
      {hasPrice(p) ? (
        <>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-3xl font-medium text-navy">{formatINR(p.pricePerPerson!)}</span>
            {off > 0 && <s className="text-muted">{formatINR(p.originalPrice!)}</s>}
            <span className="text-sm text-muted">/ person</span>
          </p>
          {p.offerLabel && off > 0 && <p className="mt-1 text-sm font-semibold text-orange">{p.offerLabel}</p>}
          <p className="mt-2 text-xs text-muted">{p.priceNote}</p>
        </>
      ) : (
        <p className="mt-2 font-display text-xl font-medium leading-snug text-navy">{p.priceNote}</p>
      )}
      {agentPrice && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#16a34a]/10 px-3 py-2 text-sm font-semibold text-[#15803d]">
          <BadgeCheck className="h-4 w-4" /> Your agent rate: {formatINR(agentPrice)} / person
        </p>
      )}
      <a href="#book" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-orange text-sm font-semibold text-white hover:bg-[#ff8a1f]">
        Book now
      </a>
    </div>
  )
}

export function useAgentPrice(slug: string) {
  const { profile } = useCustomer()
  const [price, setPrice] = useState<number | null>(null)
  const approved = profile?.agent_status === 'approved'
  useEffect(() => {
    if (!approved) return setPrice(null)
    customerApi
      .agentRates()
      .then((r) => setPrice(r.find((x) => x.package_slug === slug)?.price_per_person ?? null))
      .catch(() => setPrice(null))
  }, [approved, slug])
  return price
}

/** Booking request form (customers must be signed in). */
export function BookingPanel({ p, agentPrice }: { p: TravelPackage; agentPrice: number | null }) {
  const { enabled, status, profile } = useCustomer()
  const tomorrow = isoDay(new Date(Date.now() + 864e5))
  const [date, setDate] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (profile) {
      setName((n) => n || profile.full_name)
      setPhone((x) => x || profile.phone)
    }
  }, [profile])

  const unit = agentPrice ?? (hasPrice(p) ? p.pricePerPerson! : null)
  const next = encodeURIComponent(`/packages/${p.slug}#book`)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      if (!date || date < tomorrow) throw new Error('Please choose a travel date from tomorrow onwards.')
      await customerApi.createBooking({
        package_slug: p.slug,
        package_title: p.title,
        travel_date: date,
        adults,
        children,
        contact_name: name.trim(),
        contact_phone: phone.trim(),
        notes: notes.trim() || null,
      })
      setDone(true)
    } catch (e2) {
      setErr((e2 as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="book" className="scroll-mt-28 bg-white py-24 sm:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="label-mono text-orange">Book this package</p>
          <h2 className="mt-4 text-display-sm text-navy">Send a booking request.</h2>
          <p className="mt-5 max-w-md text-muted">Pick your date and travellers. Our team confirms availability and the final price with you on call or WhatsApp — usually within one working day. No payment is taken on the website.</p>
          {unit && (
            <p className="mt-8 font-display text-2xl text-navy">
              {formatINR(unit)} <span className="text-base text-muted">/ person{agentPrice ? ' · agent rate' : ''}</span>
            </p>
          )}
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-[2rem] border border-line bg-cloud p-8 sm:p-10">
            {!enabled ? (
              <p className="text-navy">
                Online booking isn’t switched on yet. Please <a href="#plan" className="underline">send an enquiry</a> instead.
              </p>
            ) : status === 'loading' ? (
              <p className="label-mono text-muted">Loading…</p>
            ) : status === 'signed-out' ? (
              <div>
                <h3 className="font-display text-2xl font-medium text-navy">Sign in to book</h3>
                <p className="mt-2 text-sm text-muted">It takes a minute — and you can track the booking from your account.</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link to={`/login?mode=signup&next=${next}`} className="inline-flex h-12 items-center justify-center rounded-full bg-navy font-semibold text-white">
                    Create account
                  </Link>
                  <Link to={`/login?next=${next}`} className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white font-semibold text-navy hover:border-navy">
                    Sign in
                  </Link>
                </div>
              </div>
            ) : done ? (
              <div role="status">
                <CalendarCheck className="h-9 w-9 text-[#16a34a]" />
                <h3 className="mt-4 font-display text-2xl font-medium text-navy">Booking request sent</h3>
                <p className="mt-2 text-muted">We’ll call you on {phone} to confirm. You can follow its status in your account.</p>
                <Link to="/account" className="mt-6 inline-flex h-12 items-center rounded-full bg-navy px-6 font-semibold text-white">
                  View my bookings
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6">
                <Field label="Travel date">
                  <input type="date" required min={tomorrow} value={date} onChange={(e) => setDate(e.target.value)} className="field-input" />
                </Field>
                <div className="grid grid-cols-2 gap-6">
                  <Stepper label="Adults" value={adults} min={1} max={60} onChange={setAdults} />
                  <Stepper label="Children" value={children} min={0} max={60} onChange={setChildren} />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Lead traveller name">
                    <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="field-input" autoComplete="name" />
                  </Field>
                  <Field label="Mobile number">
                    <input required type="tel" minLength={6} maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} className="field-input" autoComplete="tel" />
                  </Field>
                </div>
                <Field label="Anything we should know? (optional)">
                  <textarea rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hotel preference, departure city, special occasions…" className="field-input resize-none" />
                </Field>
                {unit && (
                  <p className="rounded-2xl bg-white p-4 text-sm text-navy">
                    Estimated total: <strong>{formatINR(unit * (adults + children))}</strong> for {adults + children} traveller{adults + children > 1 ? 's' : ''}. Final price is confirmed by our team.
                  </p>
                )}
                {err && (
                  <p role="alert" className="text-sm text-[#c2410c]">
                    {err}
                  </p>
                )}
                <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-orange font-semibold text-white hover:bg-[#ff8a1f] disabled:opacity-60">
                  {busy ? 'Sending…' : 'Send booking request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
