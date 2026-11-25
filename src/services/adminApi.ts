import { destinations } from '../data/destinations'
import { packages } from '../data/packages'
import { services } from '../data/services'
import type { EnquiryStatus } from '../types/content'
import { settingsDefaults, type SettingsKey } from './content'
import { getSupabase } from './supabase'

export type ContentTable = 'services' | 'destinations' | 'packages'
export type Role = 'admin' | 'editor'

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

export interface MediaItem {
  path: string
  url: string
  name: string
  size?: number
  created_at?: string
}

export interface TeamMember {
  user_id: string | null
  email: string
  role: Role
  pending: boolean
  created_at: string
}

export interface AdminApi {
  mode: 'supabase' | 'preview'
  // auth
  getUser(): Promise<{ email: string } | null>
  signIn(email: string, password: string): Promise<void>
  sendMagicLink(email: string): Promise<void>
  signOut(): Promise<void>
  /** Accepts a pending invite (if any) and returns the user's role, or null if not staff. */
  getRole(): Promise<Role | null>
  // enquiries
  listEnquiries(opts?: { status?: EnquiryStatus | 'all'; search?: string }): Promise<EnquiryRow[]>
  updateEnquiry(id: string, patch: Partial<Pick<EnquiryRow, 'status' | 'admin_notes'>>): Promise<void>
  deleteEnquiry(id: string): Promise<void>
  // content
  listContent(table: ContentTable): Promise<ContentRow[]>
  saveContent(table: ContentTable, row: Omit<ContentRow, 'id'> & { id?: string }): Promise<void>
  deleteContent(table: ContentTable, id: string): Promise<void>
  // settings
  getSetting<T>(key: SettingsKey): Promise<T | null>
  setSetting(key: SettingsKey, value: unknown): Promise<void>
  // media
  listMedia(): Promise<MediaItem[]>
  uploadMedia(file: File): Promise<MediaItem>
  deleteMedia(path: string): Promise<void>
  // team
  listTeam(): Promise<TeamMember[]>
  inviteMember(email: string, role: Role): Promise<void>
  removeMember(email: string): Promise<void>
}

export const localFor = (t: ContentTable) =>
  (t === 'services' ? services : t === 'destinations' ? destinations : packages) as unknown as { slug: string; published?: boolean }[]

export const MAX_UPLOAD_MB = 5
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

/**
 * Prepares an upload: validates type/size, downscales to ≤ 2000px and re-encodes
 * as WebP in the browser so pages stay fast. GIFs are kept as-is.
 */
export async function prepareImage(file: File): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) throw new Error('Please upload a JPG, PNG, WebP, AVIF or GIF image.')
  if (file.size > 20 * 1024 * 1024) throw new Error('That image is too large (max 20 MB before compression).')
  if (file.type === 'image/gif') {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`GIFs must be under ${MAX_UPLOAD_MB} MB.`)
    return file
  }
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.82))
  if (!blob) throw new Error('Could not process this image.')
  if (blob.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Image is still over ${MAX_UPLOAD_MB} MB after compression.`)
  return blob
}

const fileName = (original: string) => {
  const base = original.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image'
  return `${Date.now().toString(36)}-${base}`
}

const redirectTo = () => `${window.location.origin}${import.meta.env.BASE_URL}admin`

/** Supabase-backed implementation. Authorisation is enforced server-side by RLS + RPCs. */
async function supabaseApi(): Promise<AdminApi> {
  const sb = (await getSupabase())!
  const must = <T>(r: { data: T; error: { message: string } | null }) => {
    if (r.error) throw new Error(r.error.message)
    return r.data
  }
  const bucket = () => sb.storage.from('media')
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
    async sendMagicLink(email) {
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo() } })
      if (error) throw new Error(error.message)
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async getRole() {
      await sb.rpc('claim_invite')
      const { data, error } = await sb.rpc('my_role')
      return error ? null : ((data as Role | null) ?? null)
    },
    async listEnquiries({ status = 'all', search = '' } = {}) {
      let q = sb.from('enquiries').select('*').order('created_at', { ascending: false }).limit(1000)
      if (status !== 'all') q = q.eq('status', status)
      const term = search.trim().replace(/[%,()*]/g, ' ')
      if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,destination.ilike.%${term}%,departure.ilike.%${term}%,phone.ilike.%${term}%`)
      return must(await q) as EnquiryRow[]
    },
    async updateEnquiry(id, patch) {
      must(await sb.from('enquiries').update(patch).eq('id', id))
    },
    async deleteEnquiry(id) {
      must(await sb.from('enquiries').delete().eq('id', id))
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
    async getSetting<T>(key: SettingsKey) {
      const r = await sb.from('site_settings').select('value').eq('key', key).maybeSingle()
      return (r.data?.value as T) ?? null
    },
    async setSetting(key, value) {
      must(await sb.from('site_settings').upsert({ key, value }))
    },
    async listMedia() {
      const data = must(await bucket().list('uploads', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } })) as {
        name: string
        created_at?: string
        metadata?: { size?: number }
      }[]
      return data
        .filter((f) => f.name && !f.name.startsWith('.'))
        .map((f) => {
          const path = `uploads/${f.name}`
          return { path, name: f.name, url: bucket().getPublicUrl(path).data.publicUrl, size: f.metadata?.size, created_at: f.created_at }
        })
    },
    async uploadMedia(file) {
      const blob = await prepareImage(file)
      const ext = blob.type === 'image/gif' ? 'gif' : 'webp'
      const path = `uploads/${fileName(file.name)}.${ext}`
      must(await bucket().upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false }))
      return { path, name: path.slice(8), url: bucket().getPublicUrl(path).data.publicUrl, size: blob.size }
    },
    async deleteMedia(path) {
      must(await bucket().remove([path]))
    },
    async listTeam() {
      return must(await sb.rpc('list_team')) as TeamMember[]
    },
    async inviteMember(email, role) {
      must(await sb.rpc('invite_member', { p_email: email, p_role: role }))
      // Email them a sign-in link (creates their login if it doesn't exist yet).
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo() } })
      if (error) throw new Error(`Invite saved, but the email could not be sent: ${error.message}. Ask them to use “Email me a sign-in link” on the admin page.`)
    },
    async removeMember(email) {
      must(await sb.rpc('remove_member', { p_email: email }))
    },
  }
}

/**
 * DEVELOPMENT-ONLY preview: in-memory data, no authentication, nothing persisted.
 * Exists so the admin UI can be reviewed before Supabase is configured.
 * Excluded from production builds (see the DEV guard in getAdminApi).
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
  const toRows = (t: ContentTable) =>
    localFor(t).map((d, i) => ({ id: id(), slug: d.slug, data: structuredClone(d) as unknown as Record<string, unknown>, published: d.published ?? true, sort: i }))
  const content: Record<ContentTable, ContentRow[]> = { services: toRows('services'), destinations: toRows('destinations'), packages: toRows('packages') }
  const settings: Record<string, unknown> = structuredClone(settingsDefaults)
  let media: MediaItem[] = []
  let team: TeamMember[] = [{ user_id: 'me', email: 'preview@localhost', role: 'admin', pending: false, created_at: days(-10) }]
  const wait = () => new Promise((r) => setTimeout(r, 120))
  return {
    mode: 'preview',
    async getUser() {
      return { email: 'preview@localhost' }
    },
    async signIn() {},
    async sendMagicLink() {},
    async signOut() {},
    async getRole() {
      return 'admin'
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
    async deleteEnquiry(eid) {
      await wait()
      enquiries = enquiries.filter((e) => e.id !== eid)
    },
    async listContent(table) {
      await wait()
      return [...content[table]].sort((a, b) => a.sort - b.sort)
    },
    async saveContent(table, row) {
      await wait()
      if (content[table].some((r) => r.slug === row.slug && r.id !== row.id)) throw new Error('That URL (slug) is already used by another item.')
      if (row.id) content[table] = content[table].map((r) => (r.id === row.id ? { ...r, ...row, id: r.id } : r))
      else content[table].push({ ...row, id: id() })
    },
    async deleteContent(table, rid) {
      await wait()
      content[table] = content[table].filter((r) => r.id !== rid)
    },
    async getSetting<T>(key: SettingsKey) {
      return structuredClone(settings[key]) as T
    },
    async setSetting(key, value) {
      await wait()
      settings[key] = value
    },
    async listMedia() {
      return media
    },
    async uploadMedia(file) {
      const blob = await prepareImage(file)
      const item = { path: `uploads/${fileName(file.name)}.webp`, name: file.name, url: URL.createObjectURL(blob), size: blob.size, created_at: new Date().toISOString() }
      media = [item, ...media]
      return item
    },
    async deleteMedia(path) {
      media = media.filter((m) => m.path !== path)
    },
    async listTeam() {
      return team
    },
    async inviteMember(email, role) {
      await wait()
      if (team.some((t) => t.email === email)) throw new Error('That person is already on the team.')
      team = [...team, { user_id: null, email, role, pending: true, created_at: new Date().toISOString() }]
    },
    async removeMember(email) {
      if (email === 'preview@localhost') throw new Error('You can’t remove yourself.')
      team = team.filter((t) => t.email !== email)
    },
  }
}

let preview: AdminApi | null = null
export async function getAdminApi(mode: 'supabase' | 'preview'): Promise<AdminApi> {
  // The DEV guard lets the bundler drop the preview implementation from production builds.
  if (mode === 'preview' && import.meta.env.DEV) return (preview ??= previewApi())
  return supabaseApi()
}

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
