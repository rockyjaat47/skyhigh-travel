import { Star } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { hasSupabase } from '../../config/env'
import { useCustomer } from '../../hooks/useCustomer'
import { customerApi, type Review } from '../../services/customer'
import { cn } from '../../utils/cn'
import { Field } from '../ui/FormBits'

export function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(size, i <= Math.round(value) ? 'fill-orange text-orange' : 'text-line')} />
      ))}
    </span>
  )
}

function WriteReview({ slug, onSent }: { slug: string; onSent: () => void }) {
  const { profile } = useCustomer()
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [name, setName] = useState(profile?.full_name ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await customerApi.createReview({ package_slug: slug, rating, title: title.trim(), body: body.trim(), author_name: name.trim() })
      onSent()
    } catch (e2) {
      setErr((e2 as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="rounded-[1.6rem] border border-line bg-white p-7">
      <h3 className="font-display text-xl font-medium text-navy">Review your trip</h3>
      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} onClick={() => setRating(i)}>
            <Star className={cn('h-7 w-7', i <= rating ? 'fill-orange text-orange' : 'text-line')} />
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-5">
        <Field label="Headline (optional)">
          <input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" />
        </Field>
        <Field label="Your review">
          <textarea required minLength={10} maxLength={2000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="field-input resize-none" />
        </Field>
        <Field label="Name shown with the review">
          <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
        </Field>
      </div>
      {err && (
        <p role="alert" className="mt-4 text-sm text-[#c2410c]">
          {err}
        </p>
      )}
      <button type="submit" disabled={busy} className="mt-6 h-11 rounded-full bg-navy px-6 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? 'Sending…' : 'Submit review'}
      </button>
    </form>
  )
}

export function Reviews({ slug }: { slug: string }) {
  const { status } = useCustomer()
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [mine, setMine] = useState<Review | null>(null)
  const [eligible, setEligible] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!hasSupabase) return
    customerApi
      .reviewsFor(slug)
      .then(setReviews)
      .catch(() => setReviews([]))
  }, [slug])

  useEffect(() => {
    if (status !== 'signed-in') return
    customerApi.myReview(slug).then(setMine).catch(() => {})
    customerApi
      .myBookings()
      .then((b) => setEligible(b.some((x) => x.package_slug === slug && (x.status === 'confirmed' || x.status === 'completed'))))
      .catch(() => {})
  }, [status, slug])

  if (!hasSupabase || (reviews !== null && reviews.length === 0 && !eligible && !mine)) return null
  const avg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <section id="reviews" className="scroll-mt-28 bg-cloud pb-24">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-16">
          <div>
            <p className="label-mono text-orange">Traveller reviews</p>
            <h2 className="mt-3 font-display text-3xl font-medium text-navy">What travellers say</h2>
          </div>
          {reviews && reviews.length > 0 && (
            <p className="flex items-center gap-3 text-navy">
              <Stars value={avg} size="h-5 w-5" />
              <span className="font-display text-xl">{avg.toFixed(1)}</span>
              <span className="text-sm text-muted">
                ({reviews.length} review{reviews.length > 1 ? 's' : ''})
              </span>
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <ul className="grid gap-5 lg:col-span-7">
            {reviews === null ? (
              <li className="text-sm text-muted">Loading reviews…</li>
            ) : reviews.length === 0 ? (
              <li className="text-sm text-muted">No reviews yet — be the first.</li>
            ) : (
              reviews.map((r) => (
                <li key={r.id} className="rounded-[1.6rem] border border-line bg-white p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Stars value={r.rating} />
                    <span className="label-mono !text-[0.6rem] text-muted">{new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  {r.title && <p className="mt-3 font-display text-lg font-medium text-navy">{r.title}</p>}
                  <p className="mt-2 whitespace-pre-line text-muted">{r.body}</p>
                  <p className="label-mono mt-4 text-navy">— {r.author_name} · verified traveller</p>
                </li>
              ))
            )}
          </ul>
          <div className="lg:col-span-4 lg:col-start-9">
            {mine || sent ? (
              <p className="rounded-[1.6rem] border border-line bg-white p-6 text-sm text-muted">
                {mine?.status === 'approved' ? 'Thanks — your review is live.' : 'Thanks! Your review will appear once our team has checked it.'}
              </p>
            ) : eligible ? (
              <WriteReview slug={slug} onSent={() => setSent(true)} />
            ) : (
              <p className="rounded-[1.6rem] border border-line bg-white p-6 text-sm text-muted">Reviews come only from travellers whose booking for this package was confirmed by our team.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
