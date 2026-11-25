import { describe, expect, it } from 'vitest'
import { toCsv, type EnquiryRow } from '../src/services/adminApi'
import { clean, enquirySchema, stepSchemas } from '../src/services/enquirySchema'

const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
const base = {
  service: 'tour',
  departure: 'Lucknow',
  destination: 'Goa',
  travelDate: tomorrow,
  travellers: '2',
  fullName: 'Asha Rao',
  email: 'ASHA@Example.com ',
  phone: '+91 98765 43210',
  consent: true,
  website: '',
}

describe('enquiry schema', () => {
  it('accepts a valid tour enquiry and normalises values', () => {
    const r = enquirySchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.email).toBe('asha@example.com')
      expect(r.data.travellers).toBe(2)
    }
  })

  it('rejects past dates, bad email and missing consent', () => {
    const r = enquirySchema.safeParse({ ...base, travelDate: '2000-01-01', email: 'nope', consent: false })
    expect(r.success).toBe(false)
    const paths = r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['travelDate', 'email', 'consent']))
  })

  it('requires goods details for logistics on the journey step', () => {
    const r = stepSchemas[1].safeParse({ ...base, service: 'logistics', travellers: '' })
    expect(r.success).toBe(false)
    const paths = r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['goodsType', 'weightKg', 'loadType']))
    expect(paths).not.toContain('travellers')
  })

  it('requires vehicle for passenger transport and company for corporate', () => {
    const p = stepSchemas[1].safeParse({ ...base, service: 'transport-passenger' })
    expect(p.success ? [] : p.error.issues.map((i) => i.path[0])).toContain('vehicle')
    const c = stepSchemas[1].safeParse({ ...base, service: 'corporate' })
    expect(c.success ? [] : c.error.issues.map((i) => i.path[0])).toContain('companyName')
  })

  it('rejects a filled honeypot', () => {
    expect(enquirySchema.safeParse({ ...base, website: 'http://spam' }).success).toBe(false)
  })

  it('strips markup and control characters', () => {
    expect(clean('  <script>hi</script>\u0007 ')).toBe('scripthi/script')
  })
})

describe('CSV export', () => {
  it('escapes quotes and neutralises spreadsheet formulas', () => {
    const row = { created_at: '2026-11-25', status: 'new', service: 'tour', full_name: '=HYPERLINK("x")', email: 'a@b.co', phone: '+91 1', departure: 'A', destination: 'B "C"', travel_date: '2026-12-01', travellers: 2, budget: null, details: {}, message: null, admin_notes: null, source_page: '/' } as unknown as EnquiryRow
    const csv = toCsv([row])
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)
    expect(csv).toContain('"B ""C"""')
    expect(csv).toContain(`"'+91 1"`)
  })
})

describe('content helpers', async () => {
  const { mergeSetting } = await import('../src/services/content')
  const { safeImage, srcSetFor } = await import('../src/utils/cn')

  it('merges saved settings over defaults without losing new fields', () => {
    const def = { a: 1, b: 'x', nested: { p: 1, q: 2 }, list: [1, 2] }
    expect(mergeSetting(def, { b: 'y', nested: { q: 9 } })).toEqual({ a: 1, b: 'y', nested: { p: 1, q: 9 }, list: [1, 2] })
    expect(mergeSetting([1, 2], [])).toEqual([1, 2])
    expect(mergeSetting([1, 2], [3])).toEqual([3])
    expect(mergeSetting(def, null)).toEqual(def)
  })

  it('only allows safe image sources from editable content', () => {
    expect(safeImage('images/goa.webp')).toBe('images/goa.webp')
    expect(safeImage('https://x.supabase.co/storage/v1/object/public/media/a.webp')).toContain('https://')
    expect(safeImage('javascript:alert(1)')).toBe('')
    expect(safeImage('http://insecure.example/a.jpg')).toBe('')
  })

  it('builds responsive srcset for bundled photos only', () => {
    expect(srcSetFor('images/goa.webp')).toContain('goa-sm.webp 800w')
    expect(srcSetFor('https://cdn.example/a.webp')).toBeUndefined()
  })
})
