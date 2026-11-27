import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

/* Customer accounts, booking requests, reviews and agent rates.
 * Every rule (who can read/write what, prices on bookings) is enforced by the database —
 * see supabase/migrations/20261127000000_customers.sql. */

export type AgentStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface CustomerProfile {
  user_id: string
  full_name: string
  phone: string
  city: string
  agent_status: AgentStatus
  agency_name: string
  agency_gstin: string
  agency_note: string
}

export interface Booking {
  id: string
  user_id: string
  package_slug: string
  package_title: string
  travel_date: string
  adults: number
  children: number
  contact_name: string
  contact_phone: string
  contact_email: string | null
  notes: string | null
  price_per_person: number | null
  rate_type: 'public' | 'agent'
  status: BookingStatus
  admin_notes: string | null
  created_at: string
}

export interface Review {
  id: string
  package_slug: string
  rating: number
  title: string
  body: string
  author_name: string
  status: ReviewStatus
  created_at: string
}

export interface AgentRate {
  package_slug: string
  price_per_person: number
  note: string
}

/** Same storage key the Supabase client uses — lets us skip loading it when nobody is signed in. */
export const AUTH_STORAGE_KEY = 'skyhigh-admin-auth'
export const hasStoredSession = () => {
  try {
    return !!localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return false
  }
}

export const accountUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}account/`

async function sb(): Promise<SupabaseClient> {
  const c = await getSupabase()
  if (!c) throw new Error('Accounts are not available yet — please contact us to book.')
  return c
}

function must<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(friendly(r.error.message))
  return r.data
}

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.'
  if (/user already registered/i.test(msg)) return 'An account with this email already exists — please sign in.'
  if (/signups not allowed/i.test(msg)) return 'New sign-ups are closed right now. Please contact us to book.'
  if (/password should be at least/i.test(msg)) return 'Password must be at least 8 characters.'
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts — please wait a minute and try again.'
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first — check your inbox for our link.'
  return msg
}

export const customerApi = {
  async session() {
    const c = await sb()
    const { data } = await c.auth.getSession()
    return data.session?.user ? { id: data.session.user.id, email: data.session.user.email ?? '' } : null
  },
  async onChange(cb: (event: string) => void) {
    const c = await sb()
    const { data } = c.auth.onAuthStateChange((event) => cb(event))
    return () => data.subscription.unsubscribe()
  },
  async signUp(input: { email: string; password: string; fullName: string; phone: string }) {
    const c = await sb()
    const { data, error } = await c.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName, phone: input.phone }, emailRedirectTo: accountUrl() },
    })
    if (error) throw new Error(friendly(error.message))
    // With email confirmation on, Supabase returns no session until the link is clicked.
    return { needsConfirmation: !data.session }
  },
  async signIn(email: string, password: string) {
    const c = await sb()
    const { error } = await c.auth.signInWithPassword({ email, password })
    if (error) throw new Error(friendly(error.message))
  },
  async signOut() {
    await (await sb()).auth.signOut()
  },
  async sendPasswordReset(email: string) {
    const { error } = await (await sb()).auth.resetPasswordForEmail(email, { redirectTo: accountUrl() })
    if (error) throw new Error(friendly(error.message))
  },
  async updatePassword(password: string) {
    const { error } = await (await sb()).auth.updateUser({ password })
    if (error) throw new Error(friendly(error.message))
  },
  async getProfile(): Promise<CustomerProfile | null> {
    const c = await sb()
    const { data, error } = await c.from('customer_profiles').select('*').maybeSingle()
    if (error) throw new Error(friendly(error.message))
    return data as CustomerProfile | null
  },
  async updateProfile(userId: string, patch: Pick<CustomerProfile, 'full_name' | 'phone' | 'city'>) {
    must(await (await sb()).from('customer_profiles').update(patch).eq('user_id', userId))
  },
  async requestAgent(agency: string, gstin: string, note: string) {
    must(await (await sb()).rpc('request_agent_access', { p_agency: agency, p_gstin: gstin, p_note: note }))
  },
  async myBookings(): Promise<Booking[]> {
    return must(await (await sb()).from('bookings').select('*').order('created_at', { ascending: false })) as Booking[]
  },
  async createBooking(b: Pick<Booking, 'package_slug' | 'package_title' | 'travel_date' | 'adults' | 'children' | 'contact_name' | 'contact_phone' | 'notes'>) {
    must(await (await sb()).from('bookings').insert(b))
  },
  async cancelBooking(id: string) {
    must(await (await sb()).rpc('cancel_my_booking', { p_id: id }))
  },
  async reviewsFor(slug: string): Promise<Review[]> {
    const c = await sb()
    return must(
      await c.from('reviews').select('id, package_slug, rating, title, body, author_name, status, created_at').eq('package_slug', slug).eq('status', 'approved').order('created_at', { ascending: false }).limit(50),
    ) as Review[]
  },
  async myReview(slug: string): Promise<Review | null> {
    const c = await sb()
    const { data: u } = await c.auth.getUser()
    if (!u.user) return null
    const { data } = await c.from('reviews').select('*').eq('package_slug', slug).eq('user_id', u.user.id).maybeSingle()
    return data as Review | null
  },
  async createReview(r: Pick<Review, 'package_slug' | 'rating' | 'title' | 'body' | 'author_name'>) {
    must(await (await sb()).from('reviews').insert(r))
  },
  async agentRates(): Promise<AgentRate[]> {
    return must(await (await sb()).from('agent_rates').select('package_slug, price_per_person, note')) as AgentRate[]
  },
}

/* ── Admin-only (database refuses these for everyone else) ─────────── */

export interface CustomerRow extends CustomerProfile {
  email: string
  created_at: string
  last_sign_in_at: string | null
  bookings: number
  is_admin: boolean
}

export const adminCommerce = {
  async bookings(status: BookingStatus | 'all'): Promise<Booking[]> {
    let q = (await sb()).from('bookings').select('*').order('created_at', { ascending: false }).limit(500)
    if (status !== 'all') q = q.eq('status', status)
    return must(await q) as Booking[]
  },
  async updateBooking(id: string, patch: Partial<Pick<Booking, 'status' | 'admin_notes' | 'price_per_person'>>) {
    must(await (await sb()).from('bookings').update(patch).eq('id', id))
  },
  async deleteBooking(id: string) {
    must(await (await sb()).from('bookings').delete().eq('id', id))
  },
  async customers(): Promise<CustomerRow[]> {
    return must(await (await sb()).rpc('admin_list_customers')) as CustomerRow[]
  },
  async setAgentStatus(userId: string, status: AgentStatus) {
    must(await (await sb()).rpc('set_agent_status', { p_user: userId, p_status: status }))
  },
  async reviews(status: ReviewStatus | 'all'): Promise<Review[]> {
    let q = (await sb()).from('reviews').select('*').order('created_at', { ascending: false }).limit(500)
    if (status !== 'all') q = q.eq('status', status)
    return must(await q) as Review[]
  },
  async setReviewStatus(id: string, status: ReviewStatus) {
    must(await (await sb()).from('reviews').update({ status }).eq('id', id))
  },
  async deleteReview(id: string) {
    must(await (await sb()).from('reviews').delete().eq('id', id))
  },
  async agentRates(): Promise<AgentRate[]> {
    return must(await (await sb()).from('agent_rates').select('package_slug, price_per_person, note')) as AgentRate[]
  },
  async saveAgentRate(slug: string, price: number | null, note = '') {
    const c = await sb()
    if (price === null) must(await c.from('agent_rates').delete().eq('package_slug', slug))
    else must(await c.from('agent_rates').upsert({ package_slug: slug, price_per_person: price, note, updated_at: new Date().toISOString() }))
  },
}

export const BOOKING_STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-orange/10 text-[#b45200]' },
  confirmed: { label: 'Confirmed', cls: 'bg-[#16a34a]/10 text-[#15803d]' },
  completed: { label: 'Completed', cls: 'bg-sky/10 text-[#0074a6]' },
  cancelled: { label: 'Cancelled', cls: 'bg-grey text-muted' },
}
