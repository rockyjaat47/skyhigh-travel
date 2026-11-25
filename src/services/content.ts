import { defaultContact, defaultSeo } from '../config/site'
import { defaultCompany, defaultFaqs, defaultHome, defaultLegal, defaultPages } from '../data/siteCopy'
import { destinations as localDestinations } from '../data/destinations'
import { packages as localPackages } from '../data/packages'
import { services as localServices } from '../data/services'
import type { CompanyCopy, ContactSettings, Destination, FaqItem, HomeCopy, LegalCopy, PagesCopy, SeoSettings, Service, TravelPackage } from '../types/content'
import { getSupabase } from './supabase'

export interface SiteContent {
  services: Service[]
  destinations: Destination[]
  packages: TravelPackage[]
  contact: ContactSettings
  seo: SeoSettings
  home: HomeCopy
  company: CompanyCopy
  pages: PagesCopy
  faqs: FaqItem[]
  legal: LegalCopy
  source: 'local' | 'remote'
}

/** Keys stored in the site_settings table (one JSON document each). */
export const SETTINGS_KEYS = ['contact', 'seo', 'home', 'company', 'pages', 'faqs', 'legal'] as const
export type SettingsKey = (typeof SETTINGS_KEYS)[number]

export const settingsDefaults = {
  contact: defaultContact,
  seo: defaultSeo,
  home: defaultHome,
  company: defaultCompany,
  pages: defaultPages,
  faqs: defaultFaqs,
  legal: defaultLegal,
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Saved values override defaults key-by-key (one level deep for nested page objects). */
export function mergeSetting<T>(def: T, saved: unknown): T {
  if (Array.isArray(def)) return (Array.isArray(saved) && saved.length ? saved : def) as T
  if (!isObj(def) || !isObj(saved)) return def
  const out: Record<string, unknown> = { ...def }
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined || v === null) continue
    out[k] = isObj(out[k]) && isObj(v) ? { ...(out[k] as object), ...v } : v
  }
  return out as T
}

export const localContent: SiteContent = {
  services: localServices,
  destinations: localDestinations.filter((d) => d.published),
  packages: localPackages.filter((p) => p.published),
  ...settingsDefaults,
  source: 'local',
}

type Row<T> = { slug: string; data: T; published: boolean; sort: number }

/**
 * Loads published content from Supabase when configured. Any table that is
 * empty or fails falls back to bundled content, so the site never renders blank.
 */
export async function loadRemoteContent(): Promise<SiteContent> {
  const sb = await getSupabase()
  if (!sb) return localContent

  const pick = async <T,>(table: string, fallback: T[]): Promise<T[]> => {
    const { data, error } = await sb
      .from(table)
      .select('slug,data,published,sort')
      .eq('published', true)
      .order('sort', { ascending: true })
    if (error || !data?.length) return fallback
    return (data as Row<T>[]).map((r) => ({ ...r.data, slug: r.slug, published: r.published }))
  }

  const [services, destinations, packages, settings] = await Promise.all([
    pick<Service>('services', localContent.services),
    pick<Destination>('destinations', localContent.destinations),
    pick<TravelPackage>('packages', localContent.packages),
    sb.from('site_settings').select('key,value'),
  ])

  const settingsMap = new Map<string, unknown>((settings.data ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value]))
  return {
    services,
    destinations,
    packages,
    contact: mergeSetting(defaultContact, settingsMap.get('contact')),
    seo: mergeSetting(defaultSeo, settingsMap.get('seo')),
    home: mergeSetting(defaultHome, settingsMap.get('home')),
    company: mergeSetting(defaultCompany, settingsMap.get('company')),
    pages: mergeSetting(defaultPages, settingsMap.get('pages')),
    faqs: mergeSetting(defaultFaqs, settingsMap.get('faqs')),
    legal: mergeSetting(defaultLegal, settingsMap.get('legal')),
    source: 'remote',
  }
}
