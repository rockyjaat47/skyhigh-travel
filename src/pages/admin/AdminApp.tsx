import { AlertTriangle, BadgePercent, BarChart3, CalendarCheck, Star, UserRound, Database, FileText, Globe2, ImageIcon, Inbox, Eye, EyeOff, KeyRound, LogOut, Map, Menu, Package, Settings, ShieldCheck, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { LogoMark } from '../../components/ui/Logo'
import { Seo } from '../../components/ui/Seo'
import { hasSupabase } from '../../config/env'
import { getAdminApi, type AdminApi, type Role } from '../../services/adminApi'
import { cn } from '../../utils/cn'
import { AgentRates } from './AgentRates'
import { Bookings } from './Bookings'
import { ContentManager } from './ContentManager'
import { Customers } from './Customers'
import { Dashboard } from './Dashboard'
import { Enquiries } from './Enquiries'
import { MediaLibrary } from './MediaLibrary'
import { ReviewsAdmin } from './ReviewsAdmin'
import { SettingsEditor } from './SettingsEditor'

const ApiCtx = createContext<AdminApi | null>(null)
const RoleCtx = createContext<Role>('editor')
export const useAdminApi = () => useContext(ApiCtx)!
export const useRole = () => useContext(RoleCtx)

const PREVIEW_KEY = 'skyhigh-admin-preview'
/** The no-auth preview is compiled out of production builds entirely. */
const previewAllowed = import.meta.env.DEV

type State = { status: 'loading' } | { status: 'signed-out' } | { status: 'denied'; email: string } | { status: 'ready'; email: string; role: Role }

const NAV = [
  { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
  { to: '/admin/customers', label: 'Customers & agents', icon: UserRound },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/agent-rates', label: 'Agent rates', icon: BadgePercent },
  { heading: 'Website' },
  { to: '/admin/content', label: 'Pages & text', icon: FileText },
  { to: '/admin/destinations', label: 'Destinations', icon: Map },
  { to: '/admin/packages', label: 'Packages', icon: Package },
  { to: '/admin/services', label: 'Services', icon: Globe2 },
  { to: '/admin/media', label: 'Photos', icon: ImageIcon },
  { heading: 'Settings' },
  { to: '/admin/settings', label: 'Contact & Google', icon: Settings },
] as const

function Shell({ api, email, role, onSignOut, children }: { api: AdminApi; email: string; role: Role; onSignOut: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5 px-3 pb-4">
      {NAV.map((n, i) =>
        'heading' in n ? (
          <p key={i} className="label-mono mt-5 px-3 pb-1 !text-[0.6rem] text-white/40">
            {n.heading}
          </p>
        ) : 'ownerOnly' in n && n.ownerOnly && role !== 'admin' ? null : (
          <NavLink
            key={n.to}
            to={n.to}
            end={'end' in n ? n.end : false}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors', isActive ? 'bg-white text-navy' : 'text-white/70 hover:bg-white/10 hover:text-white')}
          >
            <n.icon className="h-4 w-4" /> {n.label}
          </NavLink>
        ),
      )}
    </nav>
  )

  const footer = (
    <div className="border-t border-white/10 p-5 text-sm">
      <p className="truncate text-white/80">{email}</p>
      <p className="label-mono mt-1 !text-[0.6rem] text-white/40">{role === 'admin' ? 'Owner' : 'Editor'}</p>
      <div className="mt-3 flex items-center justify-between">
        <Link to="/" target="_blank" className="label-mono text-white/50 hover:text-white">
          View site ↗
        </Link>
        <button type="button" onClick={onSignOut} className="label-mono inline-flex items-center gap-1.5 text-white/50 hover:text-white">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-svh bg-cloud text-ink">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-midnight text-white lg:flex">
        <Link to="/admin" className="flex items-center gap-2.5 p-5">
          <LogoMark tone="white" className="h-8 w-8" />
          <span className="font-display text-lg font-bold tracking-wide">SKYHIGH</span>
          <span className="label-mono rounded bg-white/10 px-1.5 py-0.5 !text-[0.55rem]">Admin</span>
        </Link>
        <div className="scroll-thin flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>

      {/* mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-midnight px-4 py-3 text-white lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <LogoMark tone="white" className="h-7 w-7" />
          <span className="font-display font-bold">SKYHIGH</span>
        </Link>
        <button type="button" aria-label="Open admin menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="flex w-72 flex-col bg-midnight text-white">
            <div className="flex items-center justify-between p-4">
              <span className="font-display font-bold">Menu</span>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {footer}
          </div>
          <button type="button" aria-label="Close menu" className="flex-1 bg-midnight/50" onClick={() => setOpen(false)} />
        </div>
      )}

      <main className="min-w-0 lg:pl-64">
        {api.mode === 'preview' && (
          <div role="note" className="flex items-center gap-3 border-b border-orange/30 bg-orange/10 px-6 py-3 text-sm text-navy">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange" />
            <p>
              <strong>Local preview</strong> — sample data in memory, nothing is saved. Only available on the developer’s computer; the live site requires a real login.
            </p>
          </div>
        )}
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  )
}

function SetupScreen({ onPreview }: { onPreview?: () => void }) {
  return (
    <div className="grid min-h-svh place-items-center bg-cloud p-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-line bg-white p-8 sm:p-12">
        <LogoMark className="h-12 w-12" />
        <h1 className="mt-8 text-display-sm text-navy">Admin panel is almost ready</h1>
        <p className="mt-4 text-muted">
          The admin panel saves your changes in a free, secure database (Supabase). It hasn’t been connected to this website yet. A developer needs to do this once — the full steps are in <strong>ADMIN_SETUP.md</strong> in the project.
        </p>
        <ol className="mt-8 space-y-4 text-sm text-navy">
          {[
            'Create a free project at supabase.com.',
            'Open its SQL editor and run supabase/setup.sql (put your email in the last line first).',
            'Add the project URL and anon key to GitHub → Settings → Secrets, then redeploy.',
            'Create the admin user in Supabase → Authentication → Users, then sign in here with that email and password.',
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
              <Database className="h-4 w-4" /> Open local preview (developer only)
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
  const [show, setShow] = useState(false)
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
            await api.signIn(email.trim().toLowerCase(), password)
            onDone()
          } catch (err) {
            const msg = err instanceof Error ? err.message : ''
            setError(/invalid login credentials/i.test(msg) ? 'Wrong email or password.' : msg || 'Sign-in failed')
          } finally {
            setBusy(false)
          }
        }}
      >
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-6 font-display text-2xl font-medium text-navy">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">For the Skyhigh admin only.</p>
        <label className="mt-8 block">
          <span className="label-mono text-muted">Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" />
        </label>
        <label className="mt-5 block">
          <span className="label-mono text-muted">Password</span>
          <span className="relative block">
            <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input pr-12" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-navy">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm text-[#c2410c]">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy font-semibold text-white disabled:opacity-60">
          <KeyRound className="h-4 w-4" />
          {busy ? 'Please wait…' : 'Sign in'}
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
    const role = await a.getRole()
    setState(role ? { status: 'ready', email: user.email, role } : { status: 'denied', email: user.email })
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
          <h1 className="mt-6 font-display text-2xl font-medium text-navy">No admin access yet</h1>
          <p className="mt-2 text-muted">{state.email} doesn’t have admin access to this website.</p>
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
      <RoleCtx.Provider value={state.role}>
        {seo}
        <Shell api={api} email={state.email} role={state.role} onSignOut={signOut}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reviews" element={<ReviewsAdmin />} />
            <Route path="agent-rates" element={<AgentRates />} />
            <Route path="content" element={<SettingsEditor group="content" />} />
            <Route path="content/:key" element={<SettingsEditor group="content" />} />
            <Route path="destinations" element={<ContentManager table="destinations" />} />
            <Route path="packages" element={<ContentManager table="packages" />} />
            <Route path="services" element={<ContentManager table="services" />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="settings" element={<SettingsEditor group="settings" />} />
            <Route path="settings/:key" element={<SettingsEditor group="settings" />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Shell>
      </RoleCtx.Provider>
    </ApiCtx.Provider>
  )
}
