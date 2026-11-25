import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, Loader2, Mail, MessageCircle, WifiOff } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { useContent } from '../../hooks/useContent'
import { track } from '../../services/analytics'
import { canSubmitLive, enquirySummary, mailtoLink, submitEnquiry, whatsappLink, type SubmitResult } from '../../services/enquiry'
import {
  budgetOptions,
  enquiryServices,
  loadOptions,
  serviceFlags,
  stepSchemas,
  vehicleOptions,
  type Enquiry,
  type EnquiryInput,
} from '../../services/enquirySchema'
import type { EnquiryService } from '../../types/content'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'

const STEPS = ['Service', 'Journey', 'Contact', 'Review'] as const
const EASE = [0.16, 1, 0.3, 1] as const

function Field({ label, error, children, hint, className }: { label: string; error?: string; children: (id: string, describedBy?: string) => ReactNode; hint?: string; className?: string }) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div className={className}>
      <label htmlFor={id} className="label-mono text-muted">
        {label}
      </label>
      {children(id, error ? errId : undefined)}
      {error ? (
        <p id={errId} role="alert" className="mt-1.5 text-sm text-[#c2410c]">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

export function EnquiryForm({ defaultService, defaultDestination, tone = 'light' }: { defaultService?: EnquiryService; defaultDestination?: string; tone?: 'light' | 'dark' }) {
  const { contact } = useContent()
  const { pathname } = useLocation()
  const [step, setStep] = useState(defaultService ? 1 : 0)
  const stepRef = useRef(step)
  stepRef.current = step
  const startedAt = useRef(Date.now())
  const started = useRef(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [copied, setCopied] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  // Validate only the current step's schema (conditional rules included).
  const resolver: Resolver<EnquiryInput, unknown, Enquiry> = (values, ctx, opts) =>
    zodResolver(stepSchemas[stepRef.current] as never)(values as never, ctx, opts as never) as never

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput, unknown, Enquiry>({
    resolver,
    mode: 'onTouched',
    defaultValues: {
      service: defaultService,
      destination: defaultDestination ?? '',
      departure: '',
      travelDate: '',
      fullName: '',
      email: '',
      phone: '',
      message: '',
      website: '',
    },
  })

  const service = watch('service') as EnquiryService | undefined
  const flags = serviceFlags(service)
  const values = watch()
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (defaultService) setValue('service', defaultService)
  }, [defaultService, setValue])

  const markStart = () => {
    if (started.current) return
    started.current = true
    startedAt.current = Date.now()
    track('enquiry_start', { page: pathname })
  }

  const goto = (n: number) => {
    setStep(n)
    topRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const next = async () => {
    const ok = await trigger()
    if (ok) goto(step + 1)
  }

  const onSubmit = async (data: Enquiry) => {
    const res = await submitEnquiry(data, { startedAt: startedAt.current, page: pathname })
    setResult(res)
    if (res.ok) track('enquiry_submit_success', { service: data.service, channel: res.channel })
  }

  const summary = enquirySummary(getValues() as Partial<Enquiry>)
  const wa = whatsappLink(contact.whatsapp, summary)
  const mail = mailtoLink(contact.email, 'Journey enquiry — Skyhigh', summary)
  const dark = tone === 'dark'
  const inputCls = cn('field-input', dark && '!text-white [border-color:rgba(255,255,255,0.2)] focus:![border-color:white] focus:![box-shadow:0_1px_0_0_white] [&>option]:text-navy')

  // ── Success ────────────────────────────────────────────────
  if (result?.ok) {
    return (
      <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-6 py-10">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-sky/10 text-sky">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="text-display-sm">Thank you — your enquiry is with us.</h3>
        <p className={cn('max-w-lg', dark ? 'text-white/75' : 'text-muted')}>
          Our team will review your details and get back to you on the email or phone number you shared. There is no obligation, and no payment is ever collected through this form.
        </p>
        <Button variant={dark ? 'light' : 'dark'} onClick={() => (setResult(null), setStep(0))} icon={false}>
          Send another enquiry
        </Button>
      </motion.div>
    )
  }

  const Option = ({ id, label, hint }: { id: EnquiryService; label: string; hint: string }) => {
    const checked = service === id
    return (
      <label
        className={cn(
          'group relative flex cursor-pointer flex-col justify-between gap-6 rounded-2xl border p-5 transition-all duration-300',
          checked ? (dark ? 'border-white bg-white text-navy' : 'border-navy bg-navy text-white') : dark ? 'border-white/15 hover:border-white/40' : 'border-line bg-white hover:border-navy/40',
        )}
      >
        <input type="radio" value={id} className="sr-only" {...register('service', { onChange: () => (markStart(), track('service_select', { service: id, from: 'enquiry_form' })) })} />
        <span className={cn('grid h-6 w-6 place-items-center rounded-full border transition-colors', checked ? 'border-orange bg-orange text-white' : dark ? 'border-white/30' : 'border-line')}>
          {checked && <Check className="h-3.5 w-3.5" />}
        </span>
        <span>
          <span className="block font-display text-lg font-medium leading-tight">{label}</span>
          <span className={cn('mt-1 block text-xs', checked ? 'opacity-70' : dark ? 'text-white/60' : 'text-muted')}>{hint}</span>
        </span>
      </label>
    )
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      {!canSubmitLive && (
        <div role="note" className={cn('mb-8 flex items-start gap-3 rounded-2xl border p-4 text-sm', dark ? 'border-white/15 bg-white/5 text-white/80' : 'border-orange/30 bg-orange/5 text-navy')}>
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
          <p>
            <strong className="font-semibold">Online submissions aren’t connected yet.</strong> You can still prepare your enquiry here — on the last step we’ll help you send it
            {wa || mail ? ' via WhatsApp or email' : ' by copying the details'}. Nothing is sent or stored by this page.
          </p>
        </div>
      )}

      {/* progress */}
      <ol className="mb-10 grid grid-cols-4 gap-2" aria-label="Enquiry progress">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined}>
            <div className={cn('h-[3px] overflow-hidden rounded-full', dark ? 'bg-white/15' : 'bg-line')}>
              <motion.div className="h-full bg-orange" initial={false} animate={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }} transition={{ duration: 0.6, ease: EASE }} />
            </div>
            <p className={cn('label-mono mt-2 !text-[0.6rem]', i === step ? (dark ? 'text-white' : 'text-navy') : dark ? 'text-white/40' : 'text-muted')}>
              0{i + 1} {s}
            </p>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} noValidate onFocus={markStart}>
        {/* honeypot (hidden from people, tempting for bots) */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website <input tabIndex={-1} autoComplete="off" {...register('website')} />
          </label>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45, ease: EASE }}>
            {step === 0 && (
              <fieldset>
                <legend className="font-display text-2xl font-medium tracking-tight sm:text-3xl">What can we help you with?</legend>
                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {enquiryServices.map((s) => (
                    <Option key={s.id} {...s} />
                  ))}
                </div>
                {errors.service && (
                  <p role="alert" className="mt-3 text-sm text-[#c2410c]">
                    {errors.service.message}
                  </p>
                )}
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
                  {flags.showGoods ? 'Tell us about the shipment' : 'Tell us about the journey'}
                </legend>
                <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  <Field label={flags.showGoods ? 'Pickup location' : 'Departure city'} error={errors.departure?.message}>
                    {(id, d) => <input id={id} aria-describedby={d} aria-invalid={!!errors.departure} className={inputCls} placeholder="e.g. Lucknow" autoComplete="address-level2" {...register('departure')} />}
                  </Field>
                  <Field label={flags.showGoods ? 'Delivery location' : 'Destination'} error={errors.destination?.message}>
                    {(id, d) => <input id={id} aria-describedby={d} aria-invalid={!!errors.destination} className={inputCls} placeholder="e.g. Goa" {...register('destination')} />}
                  </Field>
                  <Field label={flags.showGoods ? 'Pickup date' : 'Travel date'} error={errors.travelDate?.message}>
                    {(id, d) => <input id={id} type="date" min={today} aria-describedby={d} aria-invalid={!!errors.travelDate} className={inputCls} {...register('travelDate')} />}
                  </Field>
                  {flags.showTravellers && (
                    <Field label={service === 'corporate' ? 'Number of travellers' : 'Travellers'} error={errors.travellers?.message}>
                      {(id, d) => <input id={id} type="number" inputMode="numeric" min={1} max={500} aria-describedby={d} aria-invalid={!!errors.travellers} className={inputCls} placeholder="2" {...register('travellers')} />}
                    </Field>
                  )}
                  {flags.showBudget && (
                    <Field label="Estimated budget" hint="Optional — helps us suggest the right options">
                      {(id) => (
                        <select id={id} className={inputCls} {...register('budget')}>
                          <option value="">Select a range</option>
                          {budgetOptions.map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </select>
                      )}
                    </Field>
                  )}
                  {flags.showVehicle && (
                    <>
                      <Field label="Vehicle type" error={errors.vehicle?.message}>
                        {(id, d) => (
                          <select id={id} aria-describedby={d} aria-invalid={!!errors.vehicle} className={inputCls} {...register('vehicle')}>
                            <option value="">Select a vehicle</option>
                            {vehicleOptions.map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        )}
                      </Field>
                      <Field label="Trip type">
                        {(id) => (
                          <select id={id} className={inputCls} {...register('tripType')}>
                            <option value="">Select</option>
                            <option>One way</option>
                            <option>Round trip</option>
                          </select>
                        )}
                      </Field>
                    </>
                  )}
                  {flags.showGoods && (
                    <>
                      <Field label="Type of goods" error={errors.goodsType?.message}>
                        {(id, d) => <input id={id} aria-describedby={d} aria-invalid={!!errors.goodsType} className={inputCls} placeholder="e.g. Packaged textiles" {...register('goodsType')} />}
                      </Field>
                      <Field label="Approx. weight (kg)" error={errors.weightKg?.message}>
                        {(id, d) => <input id={id} type="number" inputMode="decimal" min={1} aria-describedby={d} aria-invalid={!!errors.weightKg} className={inputCls} placeholder="500" {...register('weightKg')} />}
                      </Field>
                    </>
                  )}
                  {flags.showLoad && (
                    <Field label="Load type" error={errors.loadType?.message}>
                      {(id, d) => (
                        <select id={id} aria-describedby={d} aria-invalid={!!errors.loadType} className={inputCls} {...register('loadType')}>
                          <option value="">Select a load type</option>
                          {loadOptions.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      )}
                    </Field>
                  )}
                  {flags.showCorporate && (
                    <>
                      <Field label="Company name" error={errors.companyName?.message}>
                        {(id, d) => <input id={id} aria-describedby={d} aria-invalid={!!errors.companyName} className={inputCls} autoComplete="organization" {...register('companyName')} />}
                      </Field>
                      <Field label="Team size" hint="Optional">
                        {(id) => <input id={id} type="number" min={1} className={inputCls} {...register('employees')} />}
                      </Field>
                    </>
                  )}
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="font-display text-2xl font-medium tracking-tight sm:text-3xl">How can we reach you?</legend>
                <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  <Field label="Full name" error={errors.fullName?.message}>
                    {(id, d) => <input id={id} aria-describedby={d} aria-invalid={!!errors.fullName} className={inputCls} autoComplete="name" {...register('fullName')} />}
                  </Field>
                  <Field label="Email address" error={errors.email?.message}>
                    {(id, d) => <input id={id} type="email" aria-describedby={d} aria-invalid={!!errors.email} className={inputCls} autoComplete="email" {...register('email')} />}
                  </Field>
                  <Field label="Phone number" error={errors.phone?.message}>
                    {(id, d) => <input id={id} type="tel" aria-describedby={d} aria-invalid={!!errors.phone} className={inputCls} autoComplete="tel" placeholder="+91" {...register('phone')} />}
                  </Field>
                  <Field label="Additional requirements" error={errors.message?.message} className="sm:col-span-2" hint="Optional — please don’t include passport or payment details.">
                    {(id, d) => <textarea id={id} rows={3} aria-describedby={d} className={cn(inputCls, 'resize-y')} {...register('message')} />}
                  </Field>
                </div>
                <label className="mt-8 flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#FF7900]" aria-invalid={!!errors.consent} {...register('consent')} />
                  <span className={dark ? 'text-white/80' : 'text-muted'}>
                    I agree to be contacted by Skyhigh about this enquiry and accept the{' '}
                    <Link to="/privacy-policy" className="underline underline-offset-2">
                      privacy policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.consent && (
                  <p role="alert" className="mt-2 text-sm text-[#c2410c]">
                    {errors.consent.message}
                  </p>
                )}
              </fieldset>
            )}

            {step === 3 && (
              <div>
                <h3 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">Review your enquiry</h3>
                <dl className={cn('mt-6 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2', dark ? 'border-white/10 bg-white/10' : 'border-line bg-line')}>
                  {[
                    ['Service', enquiryServices.find((s) => s.id === values.service)?.label],
                    [flags.showGoods ? 'Pickup' : 'From', values.departure],
                    [flags.showGoods ? 'Delivery' : 'To', values.destination],
                    ['Date', values.travelDate],
                    flags.showTravellers && ['Travellers', values.travellers],
                    flags.showBudget && ['Budget', values.budget || '—'],
                    flags.showVehicle && ['Vehicle', values.vehicle],
                    flags.showGoods && ['Goods', `${values.goodsType ?? ''} · ${values.weightKg ?? '?'} kg`],
                    flags.showLoad && ['Load', values.loadType],
                    flags.showCorporate && ['Company', values.companyName],
                    ['Name', values.fullName],
                    ['Email', values.email],
                    ['Phone', values.phone],
                  ]
                    .filter(Boolean)
                    .map((row) => {
                      const [k, v] = row as [string, unknown]
                      return (
                        <div key={k} className={cn('p-4', dark ? 'bg-midnight' : 'bg-white')}>
                          <dt className="label-mono text-muted">{k}</dt>
                          <dd className="mt-1 break-words font-medium">{String(v ?? '—')}</dd>
                        </div>
                      )
                    })}
                </dl>

                {result && !result.ok && (
                  <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-[#c2410c]/30 bg-[#c2410c]/5 p-4 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" />
                    <p>{result.message}</p>
                  </div>
                )}

                {!canSubmitLive && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {wa && (
                      <Button href={wa} target="_blank" rel="noopener noreferrer" variant="primary" onClick={() => track('whatsapp_click', { from: 'enquiry_form' })}>
                        <MessageCircle className="h-4 w-4" /> Send via WhatsApp
                      </Button>
                    )}
                    {mail && (
                      <Button href={mail} variant={dark ? 'outline-light' : 'outline'} onClick={() => track('contact_click', { channel: 'email', from: 'enquiry_form' })}>
                        <Mail className="h-4 w-4" /> Send via email
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={dark ? 'outline-light' : 'outline'}
                      icon={false}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(summary)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2500)
                        } catch {
                          setCopied(false)
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy details'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* nav */}
        <div className={cn('mt-10 flex items-center justify-between gap-4 border-t pt-6', dark ? 'border-white/10' : 'border-line')}>
          {step > 0 ? (
            <button type="button" onClick={() => goto(step - 1)} className="label-mono inline-flex items-center gap-2 py-2 hover:text-orange">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" onClick={next} variant={dark ? 'light' : 'dark'}>
              Continue
            </Button>
          ) : canSubmitLive ? (
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                'Send enquiry'
              )}
            </Button>
          ) : (
            <span className="label-mono text-right text-muted">Live submission unavailable</span>
          )}
        </div>
      </form>
    </div>
  )
}
