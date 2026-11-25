/** Procedural artwork scenes rendered by <Artwork/>. Swap for photography via `image`. */
export type ArtScene =
  | 'mountains'
  | 'snow'
  | 'beach'
  | 'backwaters'
  | 'city'
  | 'city-night'
  | 'desert'
  | 'forest'
  | 'river'
  | 'road'
  | 'sky'

export type ArtTone = 'dawn' | 'day' | 'golden' | 'dusk' | 'night'

export interface Artwork {
  scene: ArtScene
  tone: ArtTone
  /** Optional photograph path (e.g. "images/ladakh.avif"). Overrides the procedural art. */
  image?: string
  alt: string
}

/** Proposed = planned offering; operational = confirmed and currently delivered. */
export type ServiceStatus = 'proposed' | 'operational'

export type ServiceSlug =
  | 'tour-travel'
  | 'transportation'
  | 'logistics'
  | 'travel-booking'
  | 'corporate-travel'
  | 'custom-packages'

export interface Service {
  slug: ServiceSlug
  index: string
  title: string
  short: string
  kicker: string
  summary: string
  description: string[]
  offerings: { title: string; text: string }[]
  process: string[]
  forWhom: string[]
  status: ServiceStatus
  art: Artwork
  /** Which enquiry type the CTA should pre-select. */
  enquiryType: EnquiryService
  seo: { title: string; description: string }
}

export type DestinationCategory = 'mountains' | 'beaches' | 'cities' | 'nature' | 'heritage'

export interface Destination {
  slug: string
  name: string
  region: string
  country: string
  category: DestinationCategory
  tagline: string
  summary: string
  highlights: string[]
  bestTime: string
  idealFor: string[]
  coordinates: [lat: number, lon: number]
  art: Artwork
  /** True for illustrative showcase content; shown with a clear label. */
  illustrative: boolean
  published: boolean
}

export type PackageTheme = 'family' | 'honeymoon' | 'adventure' | 'spiritual' | 'corporate' | 'leisure'

export interface TravelPackage {
  slug: string
  title: string
  theme: PackageTheme
  destinationSlugs: string[]
  durationDays: number
  summary: string
  itinerary: { day: string; title: string; text: string }[]
  inclusions: string[]
  exclusions: string[]
  /** Pricing is never fabricated — shown as "On request" until provided. */
  priceNote: string
  art: Artwork
  illustrative: boolean
  published: boolean
}

export type EnquiryService =
  | 'tour'
  | 'transport-passenger'
  | 'transport-goods'
  | 'logistics'
  | 'booking'
  | 'corporate'
  | 'custom-package'

export type EnquiryStatus = 'new' | 'contacted' | 'quoted' | 'closed' | 'spam'

export interface ContactSettings {
  email: string
  phone: string
  whatsapp: string
  address: string
  hours: string
  social: { label: string; url: string }[]
}

export interface SeoSettings {
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  ogImage: string
}
