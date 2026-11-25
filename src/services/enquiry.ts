import { env, hasSupabase } from '../config/env'
import type { Enquiry } from './enquirySchema'
import { enquiryServices } from './enquirySchema'
import { getSupabase } from './supabase'

export type SubmitResult =
  | { ok: true; channel: 'supabase' | 'endpoint' }
  | { ok: false; reason: 'unavailable' | 'rate-limited' | 'error'; message: string }

/** True when at least one live submission channel is configured. */
export const canSubmitLive = hasSupabase || Boolean(env.enquiryEndpoint)

const LAST_KEY = 'skyhigh-last-enquiry'
const MIN_INTERVAL_MS = 60_000

export async function submitEnquiry(data: Enquiry, meta: { startedAt: number; page: string }): Promise<SubmitResult> {
  if (!canSubmitLive) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Online submissions are not connected yet. Please reach us directly using the options below.',
    }
  }
  // Basic client-side spam friction — the server enforces its own limits.
  if (data.website) return { ok: false, reason: 'error', message: 'Submission blocked.' }
  if (Date.now() - meta.startedAt < 3000) {
    return { ok: false, reason: 'error', message: 'That was quick! Please review your details and submit again.' }
  }
  const last = Number(localStorage.getItem(LAST_KEY) || 0)
  if (Date.now() - last < MIN_INTERVAL_MS) {
    return { ok: false, reason: 'rate-limited', message: 'You have just sent an enquiry. Please wait a minute before sending another.' }
  }

  const details = {
    vehicle: data.vehicle,
    tripType: data.tripType,
    goodsType: data.goodsType || undefined,
    weightKg: data.weightKg,
    loadType: data.loadType,
    companyName: data.companyName || undefined,
    employees: data.employees,
  }

  try {
    if (hasSupabase) {
      const sb = await getSupabase()
      const { error } = await sb!.from('enquiries').insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        service: data.service,
        departure: data.departure,
        destination: data.destination,
        travel_date: data.travelDate,
        travellers: data.travellers ?? null,
        budget: data.budget ?? null,
        details,
        message: data.message || null,
        consent: true,
        source_page: meta.page.slice(0, 200),
      })
      if (error) {
        if (error.message.toLowerCase().includes('rate')) {
          return { ok: false, reason: 'rate-limited', message: 'Too many enquiries from this email recently. Please try again later.' }
        }
        throw error
      }
      localStorage.setItem(LAST_KEY, String(Date.now()))
      return { ok: true, channel: 'supabase' }
    }

    const res = await fetch(env.enquiryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, details, website: undefined, consent: true, page: meta.page }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    localStorage.setItem(LAST_KEY, String(Date.now()))
    return { ok: true, channel: 'endpoint' }
  } catch {
    return {
      ok: false,
      reason: 'error',
      message: 'We could not send your enquiry right now. Please try again, or contact us directly.',
    }
  }
}

/** Plain-text summary used for WhatsApp / email fallbacks. */
export function enquirySummary(d: Partial<Enquiry>): string {
  const label = enquiryServices.find((s) => s.id === d.service)?.label ?? 'General enquiry'
  const lines = [
    `Enquiry: ${label}`,
    d.fullName && `Name: ${d.fullName}`,
    d.departure && `From: ${d.departure}`,
    d.destination && `To: ${d.destination}`,
    d.travelDate && `Date: ${d.travelDate}`,
    d.travellers && `Travellers: ${d.travellers}`,
    d.budget && `Budget: ${d.budget}`,
    d.vehicle && `Vehicle: ${d.vehicle}`,
    d.goodsType && `Goods: ${d.goodsType}`,
    d.weightKg && `Weight: ${d.weightKg} kg`,
    d.loadType && `Load: ${d.loadType}`,
    d.companyName && `Company: ${d.companyName}`,
    d.message && `Notes: ${d.message}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export const whatsappLink = (number: string, text: string) =>
  number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : ''

export const mailtoLink = (email: string, subject: string, body: string) =>
  email ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : ''
