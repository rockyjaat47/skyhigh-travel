/**
 * Skyhigh brand mark — "The Ascending Swift".
 *
 * A swift is the bird whose silhouette most resembles a swept-wing jet.
 * The mark draws it as one geometric shape, angled 35° upward (progress),
 * with crescent wings (aviation, movement) and a forked tail. The orange
 * point ahead of the nose is the destination — the only accent colour.
 *
 * Single source of truth: used by the React <Logo/> component and by
 * scripts/build-brand.ts which writes the SVG files in public/brand.
 * All coordinates live in a 64 × 64 box.
 */
export const MARK_VIEWBOX = '0 0 64 64'

/** Upright swift body + wings + tail (rotated with MARK_TRANSFORM). */
export const MARK_PATH =
  'M32 5C34.6 9.4 35.9 14.6 36 19.6C45.5 19.8 53.6 26 60.5 36.5C52.4 31.6 44.6 29.6 36 30.2' +
  'L35.6 40.5L40.6 56L32 49.6L23.4 56L28.4 40.5L28 30.2C19.4 29.6 11.6 31.6 3.5 36.5' +
  'C10.4 26 18.5 19.8 28 19.6C28.1 14.6 29.4 9.4 32 5Z'

/** Inner wing-root cut that separates the two wings into facets. */
export const MARK_FACET_PATH = 'M36 19.6C45.5 19.8 53.6 26 60.5 36.5C52.4 31.6 44.6 29.6 36 30.2Z'

export const MARK_TRANSFORM = 'rotate(35 32 34)'

/** Destination point, already in rotated space. */
export const MARK_DOT = { cx: 53.5, cy: 8.5, r: 4.2 }

export const BRAND_COLORS = {
  cloud: '#F7F9FC',
  navy: '#071D36',
  sky: '#009FE3',
  orange: '#FF7900',
  midnight: '#080F1C',
  grey: '#E8EDF3',
} as const
