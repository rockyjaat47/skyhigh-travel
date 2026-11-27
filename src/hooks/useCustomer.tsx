import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { hasSupabase } from '../config/env'
import { customerApi, hasStoredSession, type CustomerProfile } from '../services/customer'

interface CustomerState {
  /** false when the site has no backend configured (accounts hidden). */
  enabled: boolean
  status: 'loading' | 'signed-out' | 'signed-in'
  user: { id: string; email: string } | null
  profile: CustomerProfile | null
  /** true right after opening a password-reset link — show the “set new password” form. */
  recovery: boolean
  refresh: () => Promise<void>
  clearRecovery: () => void
  signOut: () => Promise<void>
}

const Ctx = createContext<CustomerState | null>(null)

const authInUrl = () => /access_token=|type=recovery|[?&]code=/.test(window.location.hash + window.location.search)

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CustomerState['status']>(hasSupabase && (hasStoredSession() || authInUrl()) ? 'loading' : 'signed-out')
  const [user, setUser] = useState<CustomerState['user']>(null)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [recovery, setRecovery] = useState(() => /type=recovery/.test(window.location.hash))

  const refresh = useCallback(async () => {
    if (!hasSupabase) return
    try {
      const u = await customerApi.session()
      setUser(u)
      setProfile(u ? await customerApi.getProfile().catch(() => null) : null)
      setStatus(u ? 'signed-in' : 'signed-out')
    } catch {
      setStatus('signed-out')
    }
  }, [])

  useEffect(() => {
    if (status !== 'loading') return
    let off: (() => void) | undefined
    customerApi
      .onChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setRecovery(true)
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') refresh()
      })
      .then((f) => (off = f))
      .catch(() => {})
    refresh()
    return () => off?.()
    // Only on first load; later changes call refresh() directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = useCallback(async () => {
    await customerApi.signOut()
    setUser(null)
    setProfile(null)
    setStatus('signed-out')
  }, [])

  return (
    <Ctx.Provider value={{ enabled: hasSupabase, status, user, profile, recovery, refresh, clearRecovery: () => setRecovery(false), signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCustomer() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCustomer must be used inside CustomerProvider')
  return c
}
