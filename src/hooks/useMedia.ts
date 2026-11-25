import { useEffect, useState, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')

let webglSupport: boolean | null = null
/** Detects WebGL once. `?nowebgl` in the URL forces the static fallback (for testing). */
export function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).has('nowebgl')) return (webglSupport = false)
  try {
    const c = document.createElement('canvas')
    webglSupport = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

/** True while the element is within (or near) the viewport — used to pause WebGL. */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, rootMargin = '200px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return inView
}
