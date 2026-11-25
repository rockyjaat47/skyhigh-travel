import { AlertTriangle, BarChart3, Database, Globe2, Inbox, LogOut, Map, Package, Settings, ShieldCheck } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { LogoMark } from '../../components/ui/Logo'
import { Seo } from '../../components/ui/Seo'
import { hasSupabase } from '../../config/env'
import { getAdminApi, type AdminApi } from '../../services/adminApi'
import { cn } from '../../utils/cn'
import { ContentManager } from './ContentManager'
import { Dashboard } from './Dashboard'
import { Enquiries } from './Enquiries'
import { SiteSettings } from './SiteSettings'

const ApiCtx = createContext<AdminApi | null>(null)
export const useAdminApi = () => useContext(ApiCtx)!

const PREVIEW_KEY = 'skyhigh-admin-preview'
/** The no-auth preview is compiled out of production builds entirely. */
const previewAllowed = import.meta.env.DEV

type State = { status: 'loading' } | { status: 'signed-out' } | { status: 'denied'; email: string } | { status: 'ready'; email: string }

function Shell({ api, email, onSignOut, children }: { api: AdminApi; email: string; onSignOut: () => void; children: ReactNode }) {
  const nav = [
    { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
    { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
    { to: '/admin/destinations', label: 'Destinations', icon: Map },
    { to: '/admin/packages', label: 'Packages', icon: Package },
    { to: '/admin/services', label: 'Services', icon: Globe2 },
    { to: '/admin/settings', label: 'Contact & SEO', icon: Settings },
  ]
  return (
    <div className="min-h-svh bg-cloud text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col bg-midnight text-white lg:sticky lg:top-0 lg:h-svh">
        <div className="flex items-center justify-between gap-3 p-5">
          <Link to="/admin" className="flex items-center gap-2.5">
            <LogoMark tone="white" className="h-8 w-8" />
            <span className="font-display text-lg font-bold tracking-wide">SKYHIGH</span>
            <span className="label-mono rounded bg-white/10 px-1.5 py-0.5 !text-[0.55rem]">Admin</span>
          </Link>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => cn('flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors', isActive ? 'bg-white text-navy' : 'text-white/70 hover:bg-white/10 hover:text-white')}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 p-5 text-sm lg:block">
          <p className="truncate text-white/70">{email}</p>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/" className="label-mono text-white/50 hover:text-white">
              View site ↗
            </Link>
            <button type="button" onClick={onSignOut} className="label-mono inline-flex items-center gap-1.5 text-white/50 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0">
        {api.mode === 'preview' && (
          <div role="note" className="flex items-center gap-3 border-b border-orange/30 bg-orange/10 px-6 py-3 text-sm text-navy">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange" />
            <p>
              <strong>Local preview mode</strong> — sample data in memory, nothing is saved, no authentication. Available only in development; production requires Supabase sign-in.
            </p>
          </div>
        )}
        <div className="p-5 sm:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  )
}

function SetupScreen({ onPreview }: { onPreview?: () => void }) {
  return (
    <div className="grid min-h-svh place-items-center bg-cloud p-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-line bg-white p-8 sm:p-12">
        <LogoMark className="h-12 w-12" />
        <h1 className="mt-8 text-display-sm text-navy">Admin needs a backend</h1>
        <p className="mt-4 text-muted">
          The Skyhigh admin uses Supabase for secure sign-in, role-based access (Row Level Security) and storage. No Supabase project is configured for this build, so the admin is disabled — there is deliberately no client-side login.
        </p>
        <ol className="mt-8 space-y-4 text-sm text-navy">
          {[
            'Create a Supabase project and run supabase/migrations/20261125000000_init.sql (SQL editor or `supabase db push`).',
            'Create your user under Authentication → Users, then add it to admin_users with role "admin".',
            'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (and as GitHub Actions secrets), then rebuild.',
            'Sign in here, then use “Import bundled content” on each content page to seed the database.',
          ].map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-display text-orange">0{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/" className="inline-flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white">
            Back to website
          </Link>
          {onPreview && (
            <button type="button" onClick={onPreview} className="inline-flex h-11 items-center gap-2 rounded-full border border-navy/20 px-5 text-sm font-semibold text-navy hover:border-navy">
              <Database className="h-4 w-4" /> Open local preview (dev only)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SignIn({ api, onDone }: { api: AdminApi; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="grid min-h-svh place-items-center bg-midnight p-6">
      <form
        className="w-full max-w-sm rounded-[2rem] bg-white p-8"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError('')
          try {
            await api.signIn(email.trim(), password)
            onDone()
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign-in failed')
          } finally {
            setBusy(false)
          }
        }}
      >
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-6 font-display text-2xl font-medium text-navy">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Authorised Skyhigh staff only.</p>
        <label className="mt-8 block">
          <span className="label-mono text-muted">Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" />
        </label>
        <label className="mt-5 block">
          <span className="label-mono text-muted">Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm text-[#c2410c]">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="mt-8 h-12 w-full rounded-full bg-navy font-semibold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="label-mono mt-6 block text-center text-muted hover:text-navy">
          ← Back to website
        </Link>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const [mode, setMode] = useState<'supabase' | 'preview' | null>(() =>
    hasSupabase ? 'supabase' : previewAllowed && sessionStorage.getItem(PREVIEW_KEY) ? 'preview' : null,
  )
  const [api, setApi] = useState<AdminApi | null>(null)
  const [state, setState] = useState<State>({ status: 'loading' })

  const check = useCallback(async (a: AdminApi) => {
    const user = await a.getUser()
    if (!user) return setState({ status: 'signed-out' })
    const ok = await a.isAdmin()
    setState(ok ? { status: 'ready', email: user.email } : { status: 'denied', email: user.email })
  }, [])

  useEffect(() => {
    if (!mode) return
    let alive = true
    getAdminApi(mode).then((a) => {
      if (!alive) return
      setApi(a)
      check(a)
    })
    return () => {
      alive = false
    }
  }, [mode, check])

  const seo = <Seo title="Admin" noindex />

  if (!mode)
    return (
      <>
        {seo}
        <SetupScreen
          onPreview={
            previewAllowed
              ? () => {
                  sessionStorage.setItem(PREVIEW_KEY, '1')
                  setMode('preview')
                }
              : undefined
          }
        />
      </>
    )
  if (!api || state.status === 'loading')
    return (
      <div className="grid min-h-svh place-items-center">
        {seo}
        <p className="label-mono text-muted">Checking access…</p>
      </div>
    )
  if (state.status === 'signed-out')
    return (
      <>
        {seo}
        <SignIn api={api} onDone={() => check(api)} />
      </>
    )
  if (state.status === 'denied')
    return (
      <div className="grid min-h-svh place-items-center bg-cloud p-6">
        {seo}
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-orange" />
          <h1 className="mt-6 font-display text-2xl font-medium text-navy">No admin access</h1>
          <p className="mt-2 text-muted">{state.email} is signed in but isn’t listed as a Skyhigh administrator. Ask an owner to add your account.</p>
          <button type="button" className="mt-6 h-11 rounded-full bg-navy px-5 text-sm font-semibold text-white" onClick={async () => (await api.signOut(), check(api))}>
            Sign out
          </button>
        </div>
      </div>
    )

  const signOut = async () => {
    if (api.mode === 'preview') {
      sessionStorage.removeItem(PREVIEW_KEY)
      setMode(null)
      setApi(null)
      return
    }
    await api.signOut()
    check(api)
  }

  return (
    <ApiCtx.Provider value={api}>
      {seo}
      <Shell api={api} email={state.email} onSignOut={signOut}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="destinations" element={<ContentManager table="destinations" />} />
          <Route path="packages" element={<ContentManager table="packages" />} />
          <Route path="services" element={<ContentManager table="services" />} />
          <Route path="settings" element={<SiteSettings />} />
          <Route path="*" element={<p className="text-muted">Not found.</p>} />
        </Routes>
      </Shell>
    </ApiCtx.Provider>
  )
}
