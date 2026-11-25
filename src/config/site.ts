import type { ContactSettings, SeoSettings } from '../types/content'
import { env } from './env'

export const company = {
  legalName: 'Skyhigh Travel Bird Technology Private Limited',
  brand: 'Skyhigh',
  cin: 'U79110UP2026PTC241002',
  industry: 'Travel, Tourism, Transportation, Logistics and Technology',
  tagline: 'Your Journey, Our Responsibility – Taking You Higher!',
  about: [
    'Skyhigh Travel Bird Technology Private Limited is a modern, customer-focused company committed to providing reliable, convenient and innovative travel, transportation and tourism solutions.',
    'The company aims to make every journey comfortable, safe, affordable and memorable by combining technology, professional services and customer satisfaction.',
    'Skyhigh believes that travel is more than reaching a destination; it is about creating experiences, building connections and making every journey worthwhile.',
  ],
  mission:
    'To deliver dependable, affordable and technology-enabled travel and transportation solutions while maintaining high standards of customer service, safety and professionalism.',
  vision:
    'To become a trusted and recognized name in the travel and tourism industry by connecting people, places and opportunities through innovation and excellent service.',
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
