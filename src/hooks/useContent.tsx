import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { hasSupabase } from '../config/env'
import { loadRemoteContent, localContent, type SiteContent } from '../services/content'

interface ContentCtx extends SiteContent {
  loading: boolean
  refresh: () => void
}

const Ctx = createContext<ContentCtx>({ ...localContent, loading: false, refresh: () => {} })

/**
 * Renders immediately with bundled content, then swaps in remote content
 * (if Supabase is configured). No loading flash for visitors.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(localContent)
  const [loading, setLoading] = useState(hasSupabase)

  const refresh = useCallback(() => {
    if (!hasSupabase) return
    setLoading(true)
    loadRemoteContent()
      .then(setContent)
      .catch(() => setContent(localContent))
      .finally(() => setLoading(false))
  }, [])

  useEffect(refresh, [refresh])

  return <Ctx.Provider value={{ ...content, loading, refresh }}>{children}</Ctx.Provider>
}

export const useContent = () => useContext(Ctx)
