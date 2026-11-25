export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/** Seeded PRNG (mulberry32) — deterministic procedural art. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hashString = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Resolves a bundled path ("images/x.webp") against the base URL; absolute URLs pass through. */
export const asset = (path: string) => (/^(https?:|blob:|data:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`)

/** Bundled photos ship as name.webp (1600w) + name-sm.webp (800w). */
export const srcSetFor = (path: string) =>
  /^\/?images\/[\w-]+\.webp$/.test(path) && !path.endsWith('-sm.webp') ? `${asset(path.replace(/\.webp$/, '-sm.webp'))} 800w, ${asset(path)} 1600w` : undefined

/** Only allow safe image sources from editable content. */
export const safeImage = (path?: string) => (path && /^(https:\/\/|blob:|\/?images\/|\/?brand\/|\/?assets\/)/.test(path.trim()) ? path.trim() : '')
