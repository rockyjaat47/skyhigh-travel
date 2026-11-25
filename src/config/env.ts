/**
 * Typed access to public (VITE_*) environment variables.
 * Only publishable values belong here — they are compiled into the bundle.
 * The Supabase anon key is designed to be public; access is enforced by RLS.
 */
const e = import.meta.env

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export const env = {
  siteUrl: str(e.VITE_SITE_URL) || 'https://example.github.io/skyhigh-travel',
  supabaseUrl: str(e.VITE_SUPABASE_URL),
  supabaseAnonKey: str(e.VITE_SUPABASE_ANON_KEY),
  /** Optional form endpoint (e.g. Formspree) used when Supabase is not configured. */
  enquiryEndpoint: str(e.VITE_ENQUIRY_ENDPOINT),
  contactEmail: str(e.VITE_CONTACT_EMAIL),
  contactPhone: str(e.VITE_CONTACT_PHONE),
  whatsappNumber: str(e.VITE_WHATSAPP_NUMBER).replace(/[^\d]/g, ''),
  contactAddress: str(e.VITE_CONTACT_ADDRESS),
  ga4Id: str(e.VITE_GA4_ID),
  gtmId: str(e.VITE_GTM_ID),
  metaPixelId: str(e.VITE_META_PIXEL_ID),
}

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey)
export const hasTracking = Boolean(env.ga4Id || env.gtmId || env.metaPixelId)
