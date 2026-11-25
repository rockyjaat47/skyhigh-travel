import { defaultContact, defaultSeo } from '../config/site'
import { destinations } from '../data/destinations'
import { packages } from '../data/packages'
import { services } from '../data/services'
import type { EnquiryStatus } from '../types/content'
import { getSupabase } from './supabase'

export type ContentTable = 'services' | 'destinations' | 'packages'

export interface EnquiryRow {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  service: string
  departure: string
  destination: string
  travel_date: string
  travellers: number | null
  budget: string | null
  details: Record<string, unknown>
  message: string | null
  status: EnquiryStatus
  admin_notes: string | null
  source_page: string | null
}

export interface ContentRow {
  id: string
  slug: string
  data: Record<string, unknown>
  published: boolean
  sort: number
  updated_at?: string
}

export interface AdminApi {
  mode: 'supabase' | 'preview'
  getUser(): Promise<{ email: string } | null>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  isAdmin(): Promise<boolean>
  listEnquiries(opts?: { status?: EnquiryStatus | 'all'; search?: string }): Promise<EnquiryRow[]>
  updateEnquiry(id: string, patch: Partial<Pick<EnquiryRow, 'status' | 'admin_notes'>>): Promise<void>
  listContent(table: ContentTable): Promise<ContentRow[]>
  saveContent(table: ContentTable, row: Omit<ContentRow, 'id'> & { id?: string }): Promise<void>
  deleteContent(table: ContentTable, id: string): Promise<void>
  getSetting<T>(key: 'contact' | 'seo'): Promise<T | null>
  setSetting(key: 'contact' | 'seo', value: unknown): Promise<void>
}

const localFor = (t: ContentTable) => (t === 'services' ? services : t === 'destinations' ? destinations : packages) as unknown as { slug: string; published?: boolean }[]

/** Supabase-backed implementation. All authorisation is enforced by RLS on the server. */
async function supabaseApi(): Promise<AdminApi> {
  const sb = (await getSupabase())!
  const must = <T>(r: { data: T; error: { message: string } | null }) => {
    if (r.error) throw new Error(r.error.message)
    return r.data
  }
  return {
    mode: 'supabase',
    async getUser() {
      const { data } = await sb.auth.getUser()
      return data.user ? { email: data.user.email ?? '' } : null
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async isAdmin() {
      const { data, error } = await sb.rpc('is_admin')
      return !error && data === true
    },
    async listEnquiries({ status = 'all', search = '' } = {}) {
      let q = sb.from('enquiries').select('*').order('created_at', { ascending: false }).limit(1000)
      if (status !== 'all') q = q.eq('status', status)
      const term = search.trim().replace(/[%,()]/g, ' ')
      if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,destination.ilike.%${term}%,departure.ilike.%${term}%,phone.ilike.%${term}%`)
      return must(await q) as EnquiryRow[]
    },
    async updateEnquiry(id, patch) {
      must(await sb.from('enquiries').update(patch).eq('id', id))
    },
    async listContent(table) {
      return must(await sb.from(table).select('*').order('sort', { ascending: true })) as ContentRow[]
    },
    async saveContent(table, row) {
      const payload = { slug: row.slug, data: row.data, published: row.published, sort: row.sort }
      if (row.id) must(await sb.from(table).update(payload).eq('id', row.id))
      else must(await sb.from(table).insert(payload))
    },
    async deleteContent(table, id) {
      must(await sb.from(table).delete().eq('id', id))
    },
    async getSetting<T>(key: 'contact' | 'seo') {
      const r = await sb.from('site_settings').select('value').eq('key', key).maybeSingle()
      return (r.data?.value as T) ?? null
    },
    async setSetting(key, value) {
      must(await sb.from('site_settings').upsert({ key, value }))
    },
  }
}

/**
 * DEVELOPMENT-ONLY preview: in-memory data, no authentication, nothing persisted.
 * It exists so the admin UI can be reviewed before Supabase is configured.
 * It is never available in production builds (see AdminApp).
 */
function previewApi(): AdminApi {
  const id = () => Math.random().toString(36).slice(2, 10)
  const days = (n: number) => new Date(Date.now() + n * 864e5).toISOString()
  let enquiries: EnquiryRow[] = [
    { id: id(), created_at: days(-0.1), full_name: 'Sample — Aarav Mehta', email: 'aarav@example.com', phone: '+91 90000 00001', service: 'tour', departure: 'Lucknow', destination: 'Ladakh', travel_date: days(40).slice(0, 10), travellers: 4, budget: '₹75,000 – ₹2,00,000', details: {}, message: 'Family road trip, two kids.', status: 'new', admin_notes: null, source_page: '/destinations/ladakh' },
    { id: id(), created_at: days(-1.3), full_name: 'Sample — Priya Sharma', email: 'priya@example.com', phone: '+91 90000 00002', service: 'logistics', departure: 'Kanpur', destination: 'Pune', travel_date: days(7).slice(0, 10), travellers: null, budget: null, details: { goodsType: 'Textiles', weightKg: 4200, loadType: 'Full truck load (FTL)' }, message: null, status: 'contacted', admin_notes: 'Called, awaiting docs.', source_page: '/services/logistics' },
    { id: id(), created_at: days(-3), full_name: 'Sample — Rohan Gupta', email: 'rohan@example.com', phone: '+91 90000 00003', service: 'corporate', departure: 'Delhi', destination: 'Goa', travel_date: days(60).slice(0, 10), travellers: 35, budget: 'Above ₹2,00,000', details: { companyName: 'Example Pvt Ltd', employees: 35 }, message: 'Offsite in Feb.', status: 'quoted', admin_notes: null, source_page: '/contact' },
    { id: id(), created_at: days(-6), full_name: 'Sample — Neha Verma', email: 'neha@example.com', phone: '+91 90000 00004', service: 'transport-passenger', departure: 'Lucknow Airport', destination: 'Gomti Nagar', travel_date: days(2).slice(0, 10), travellers: 3, budget: null, details: { vehicle: 'SUV', tripType: 'One way' }, message: null, status: 'closed', admin_notes: null, source_page: '/' },
  ]
  const content: Record<ContentTable, ContentRow[]> = {
    services: localFor('services').map((d, i) => ({ id: id(), slug: d.slug, data: d as unknown as Record<string, unknown>, published: true, sort: i })),
    destinations: localFor('destinations').map((d, i) => ({ id: id(), slug: d.slug, data: d as unknown as Record<string, unknown>, published: d.published ?? true, sort: i })),
    packages: localFor('packages').map((d, i) => ({ id: id(), slug: d.slug, data: d as unknown as Record<string, unknown>, published: d.published ?? true, sort: i })),
  }
  const settings: Record<string, unknown> = { contact: defaultContact, seo: defaultSeo }
  const wait = () => new Promise((r) => setTimeout(r, 150))
  return {
    mode: 'preview',
    async getUser() {
      return { email: 'preview@localhost' }
    },
    async signIn() {},
    async signOut() {},
    async isAdmin() {
      return true
    },
    async listEnquiries({ status = 'all', search = '' } = {}) {
      await wait()
      const t = search.toLowerCase()
      return enquiries.filter((e) => (status === 'all' || e.status === status) && (!t || [e.full_name, e.email, e.destination, e.departure, e.phone].join(' ').toLowerCase().includes(t)))
    },
    async updateEnquiry(eid, patch) {
      await wait()
      enquiries = enquiries.map((e) => (e.id === eid ? { ...e, ...patch } : e))
    },
    async listContent(table) {
      await wait()
      return [...content[table]].sort((a, b) => a.sort - b.sort)
    },
    async saveContent(table, row) {
      await wait()
      if (content[table].some((r) => r.slug === row.slug && r.id !== row.id)) throw new Error('duplicate key value violates unique constraint (slug)')
      if (row.id) content[table] = content[table].map((r) => (r.id === row.id ? { ...r, ...row, id: r.id } : r))
      else content[table].push({ ...row, id: id() })
    },
    async deleteContent(table, rid) {
      await wait()
      content[table] = content[table].filter((r) => r.id !== rid)
    },
    async getSetting<T>(key: 'contact' | 'seo') {
      return settings[key] as T
    },
    async setSetting(key, value) {
      await wait()
      settings[key] = value
    },
  }
}

let preview: AdminApi | null = null
export async function getAdminApi(mode: 'supabase' | 'preview'): Promise<AdminApi> {
  // The DEV guard lets the bundler drop the preview implementation from production builds.
  if (mode === 'preview' && import.meta.env.DEV) return (preview ??= previewApi())
  return supabaseApi()
}

export { localFor }

/** CSV with formula-injection protection (cells starting with = + - @ are prefixed). */
export function toCsv(rows: EnquiryRow[]) {
  const cols: (keyof EnquiryRow)[] = ['created_at', 'status', 'service', 'full_name', 'email', 'phone', 'departure', 'destination', 'travel_date', 'travellers', 'budget', 'details', 'message', 'admin_notes', 'source_page']
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n')
}
