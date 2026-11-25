import { defaultContact, defaultSeo } from '../config/site'
import { destinations as localDestinations } from '../data/destinations'
import { packages as localPackages } from '../data/packages'
import { services as localServices } from '../data/services'
import type { ContactSettings, Destination, SeoSettings, Service, TravelPackage } from '../types/content'
import { getSupabase } from './supabase'

export interface SiteContent {
  services: Service[]
  destinations: Destination[]
  packages: TravelPackage[]
  contact: ContactSettings
  seo: SeoSettings
  source: 'local' | 'remote'
}

export const localContent: SiteContent = {
  services: localServices,
  destinations: localDestinations.filter((d) => d.published),
  packages: localPackages.filter((p) => p.published),
  contact: defaultContact,
  seo: defaultSeo,
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
    contact: { ...defaultContact, ...((settingsMap.get('contact') as Partial<ContactSettings>) ?? {}) },
    seo: { ...defaultSeo, ...((settingsMap.get('seo') as Partial<SeoSettings>) ?? {}) },
    source: 'remote',
  }
}
