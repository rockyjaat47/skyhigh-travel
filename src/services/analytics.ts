import { env, hasTracking } from '../config/env'

/**
 * Consent-gated marketing analytics. Nothing is loaded or sent unless
 * (a) at least one integration ID is configured, and
 * (b) the visitor has accepted analytics cookies.
 */
export type ConsentState = 'granted' | 'denied' | 'unset'
const KEY = 'skyhigh-consent'

export type TrackEvent =
  | 'cta_click'
  | 'service_select'
  | 'enquiry_start'
  | 'enquiry_submit_success'
  | 'whatsapp_click'
  | 'contact_click'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown }
    _fbq?: unknown
  }
}

export const getConsent = (): ConsentState => {
  try {
    return (localStorage.getItem(KEY) as ConsentState) || 'unset'
  } catch {
    return 'unset'
  }
}

let loaded = false

function inject(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

function loadIntegrations() {
  if (loaded || !hasTracking) return
  loaded = true
  window.dataLayer = window.dataLayer || []
  if (env.gtmId) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    inject(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(env.gtmId)}`)
  }
  if (env.ga4Id) {
    inject(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(env.ga4Id)}`)
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', env.ga4Id, { anonymize_ip: true })
  }
  if (env.metaPixelId) {
    const q: unknown[] = []
    const fbq = Object.assign((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args)
      else q.push(args)
    }, { queue: q, loaded: true, version: '2.0' } as { queue: unknown[]; loaded: boolean; version: string; callMethod?: (...a: unknown[]) => void })
    window.fbq = fbq
    window._fbq = fbq
    inject('https://connect.facebook.net/en_US/fbevents.js')
    window.fbq('init', env.metaPixelId)
    window.fbq('track', 'PageView')
  }
}

export function setConsent(state: 'granted' | 'denied') {
  try {
    localStorage.setItem(KEY, state)
  } catch {
    /* storage unavailable */
  }
  if (state === 'granted') loadIntegrations()
  window.dispatchEvent(new CustomEvent('skyhigh:consent', { detail: state }))
}

export function initAnalytics() {
  if (getConsent() === 'granted') loadIntegrations()
}

export function trackPageView(path: string) {
  if (!loaded) return
  window.gtag?.('event', 'page_view', { page_path: path })
  window.dataLayer?.push({ event: 'page_view', page_path: path })
  window.fbq?.('track', 'PageView')
}

export function track(event: TrackEvent, params: Record<string, string | number | boolean | undefined> = {}) {
  if (import.meta.env.DEV) console.debug('[analytics]', event, params, loaded ? '(sent)' : '(not sent — no consent/config)')
  if (!loaded) return
  window.dataLayer?.push({ event, ...params })
  window.gtag?.('event', event, params)
  if (event === 'enquiry_submit_success') window.fbq?.('track', 'Lead', params)
  else if (event === 'whatsapp_click' || event === 'contact_click') window.fbq?.('track', 'Contact', params)
}
