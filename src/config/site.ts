import type { ContactSettings, SeoSettings } from '../types/content'
import { env } from './env'

/** Legal identity — fixed company facts (not marketing copy; that lives in data/siteCopy.ts). */
export const company = {
  legalName: 'Skyhigh Travel Bird Technology Private Limited',
  brand: 'Skyhigh',
  cin: 'U79110UP2026PTC241002',
  industry: 'Travel, Tourism, Transportation, Logistics and Technology',
  tagline: 'Your Journey, Our Responsibility – Taking You Higher!',
} as const

/** Defaults come from env vars; the admin panel can override them at runtime (site_settings.contact). */
export const defaultContact: ContactSettings = {
  email: env.contactEmail,
  phone: env.contactPhone,
  whatsapp: env.whatsappNumber,
  address: env.contactAddress,
  hours: 'Monday – Saturday, 10:00 – 19:00 IST',
  social: [],
}

export const defaultSeo: SeoSettings = {
  defaultTitle: 'Skyhigh — Travel, Transport & Technology',
  titleTemplate: '%s · Skyhigh',
  defaultDescription:
    'Skyhigh Travel Bird Technology connects people, places and possibilities through smarter travel, tourism, transportation and logistics solutions.',
  ogImage: 'brand/og-image.png',
}

export const mainNav = [
  { label: 'Services', to: '/services', mega: true },
  { label: 'Destinations', to: '/destinations' },
  { label: 'Packages', to: '/packages' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
] as const
