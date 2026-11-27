import { KeyRound, Mail, UserPlus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Field, PasswordInput } from '../components/ui/FormBits'
import { LogoMark } from '../components/ui/Logo'
import { Seo } from '../components/ui/Seo'
import { useCustomer } from '../hooks/useCustomer'
import { customerApi } from '../services/customer'
import { cn } from '../utils/cn'

type Mode = 'signin' | 'signup' | 'forgot'

/** Only allow in-site redirects after login. */
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account')

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { enabled, status, refresh } = useCustomer()
  const next = safeNext(params.get('next'))
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (status === 'signed-in') navigate(next, { replace: true })
  }, [status, next, navigate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    const em = email.trim().toLowerCase()
    try {
      if (mode === 'signin') {
        await customerApi.signIn(em, password)
        await refresh()
      } else if (mode === 'signup') {
        if (fullName.trim().length < 2) throw new Error('Please enter your full name.')
        if (!/^[+\d][\d\s-]{7,}$/.test(phone.trim())) throw new Error('Please enter a valid mobile number.')
        const { needsConfirmation } = await customerApi.signUp({ email: em, password, fullName: fullName.trim(), phone: phone.trim() })
        if (needsConfirmation) setInfo(`Almost done — we’ve emailed a confirmation link to ${em}. Open it to activate your account.`)
        else await refresh()
      } else {
        await customerApi.sendPasswordReset(em)
        setInfo(`If an account exists for ${em}, a password-reset link is on its way. Check spam too.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => (setMode(m), setError(''), setInfo(''))}
      className={cn('h-10 flex-1 rounded-full text-sm font-semibold transition-colors', mode === m ? 'bg-navy text-white' : 'text-navy hover:bg-navy/5')}
    >
      {label}
    </button>
  )

  return (
    <>
      <Seo title={mode === 'signup' ? 'Create account' : 'Sign in'} description="Sign in to your Skyhigh account to book packages and track your trips." noindex />
      <section className="bg-cloud pb-24 pt-32 sm:pt-40">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <p className="label-mono text-orange">Your account</p>
            <h1 className="mt-4 text-display-sm text-navy">Book trips and track them in one place.</h1>
            <ul className="mt-8 space-y-4 text-muted">
              {['Send booking requests for any package in a minute', 'See every booking and its status — pending, confirmed, completed', 'Review the trips you’ve taken', 'Travel agents: apply for B2B rates'].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            {!enabled ? (
              <div className="rounded-[2rem] border border-line bg-white p-8 sm:p-10">
                <p className="text-navy">Online accounts aren’t switched on yet. Please <Link to="/contact" className="underline">contact us</Link> to book.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-[2rem] border border-line bg-white p-8 sm:p-10">
                <LogoMark className="h-10 w-10" />
                <div role="tablist" aria-label="Account" className="mt-6 flex gap-1 rounded-full bg-grey p-1">
                  {tab('signin', 'Sign in')}
                  {tab('signup', 'Create account')}
                </div>

                <h2 className="mt-8 font-display text-2xl font-medium text-navy">
                  {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
                </h2>

                <div className="mt-6 space-y-5">
                  {mode === 'signup' && (
                    <>
                      <Field label="Full name">
                        <input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="field-input" />
                      </Field>
                      <Field label="Mobile number">
                        <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="field-input" />
                      </Field>
                    </>
                  )}
                  <Field label="Email">
                    <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" />
                  </Field>
                  {mode !== 'forgot' && (
                    <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
                      <PasswordInput value={password} onChange={setPassword} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} />
                    </Field>
                  )}
                  {mode === 'signup' && (
                    <label className="flex items-start gap-3 text-sm text-muted">
                      <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-navy" />
                      <span>
                        I agree to the <Link to="/terms-and-conditions" className="underline">Terms</Link> and <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
                      </span>
                    </label>
                  )}
                </div>

                {error && (
                  <p role="alert" className="mt-5 text-sm text-[#c2410c]">
                    {error}
                  </p>
                )}
                {info && (
                  <p role="status" className="mt-5 rounded-2xl bg-sky/10 p-4 text-sm text-navy">
                    <Mail className="mb-1 h-4 w-4 text-sky" />
                    {info}
                  </p>
                )}

                <button type="submit" disabled={busy} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy font-semibold text-white transition-colors hover:bg-midnight disabled:opacity-60">
                  {mode === 'signup' ? <UserPlus className="h-4 w-4" /> : mode === 'signin' ? <KeyRound className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
                </button>

                <div className="mt-5 text-center text-sm text-muted">
                  {mode === 'signin' && (
                    <button type="button" onClick={() => (setMode('forgot'), setError(''), setInfo(''))} className="underline-offset-2 hover:text-navy hover:underline">
                      Forgot password?
                    </button>
                  )}
                  {mode === 'forgot' && (
                    <button type="button" onClick={() => setMode('signin')} className="underline-offset-2 hover:text-navy hover:underline">
                      Back to sign in
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
