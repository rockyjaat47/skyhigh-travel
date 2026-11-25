import { z } from 'zod'
import type { EnquiryService } from '../types/content'

export const enquiryServices: { id: EnquiryService; label: string; hint: string }[] = [
  { id: 'tour', label: 'Tour & travel', hint: 'Holidays and guided trips' },
  { id: 'custom-package', label: 'Custom package', hint: 'Designed around you' },
  { id: 'booking', label: 'Booking assistance', hint: 'Flights, trains, hotels' },
  { id: 'transport-passenger', label: 'Passenger transport', hint: 'Transfers & outstation' },
  { id: 'transport-goods', label: 'Goods transport', hint: 'Parcels & cargo' },
  { id: 'logistics', label: 'Truck & logistics', hint: 'FTL / PTL freight' },
  { id: 'corporate', label: 'Corporate travel', hint: 'Teams, events, MICE' },
]

export const budgetOptions = [
  'Not sure yet',
  'Under ₹25,000',
  '₹25,000 – ₹75,000',
  '₹75,000 – ₹2,00,000',
  'Above ₹2,00,000',
] as const

export const vehicleOptions = ['Sedan', 'SUV', 'Tempo traveller', 'Mini bus', 'Coach', 'Not sure'] as const
export const loadOptions = ['Full truck load (FTL)', 'Part truck load (PTL)', 'Small parcel', 'Not sure'] as const

/** Strips control chars and angle brackets; React escapes output, this keeps stored data clean. */
export const clean = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()

const text = (max: number) => z.string().max(max, `Please keep this under ${max} characters`).transform(clean)
const optionalText = (max: number) => text(max).optional().or(z.literal(''))
/** Empty inputs ("") become undefined before numeric coercion. */
const optionalNumber = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v), schema.optional())

const isTravel = (s: EnquiryService) => ['tour', 'custom-package', 'booking', 'corporate'].includes(s)
const isGoods = (s: EnquiryService) => s === 'transport-goods' || s === 'logistics'

const SERVICE_IDS = ['tour', 'transport-passenger', 'transport-goods', 'logistics', 'booking', 'corporate', 'custom-package'] as const

const serviceShape = {
  service: z.enum(SERVICE_IDS, { message: 'Choose the service you need' }),
}

const detailsShape = {
  departure: text(120).pipe(z.string().min(2, 'Where are you starting from?')),
  destination: text(120).pipe(z.string().min(2, 'Where are you headed?')),
  travelDate: z
    .string()
    .min(1, 'Choose a date')
    .refine((v) => {
      const d = new Date(v + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !Number.isNaN(d.getTime()) && d >= today
    }, 'Choose today or a future date'),
  travellers: optionalNumber(z.coerce.number().int().min(1, 'At least 1').max(500, 'For groups over 500, mention it in the notes')),
  budget: z.enum(budgetOptions).optional().or(z.literal('').transform(() => undefined)),
  vehicle: z.enum(vehicleOptions).optional().or(z.literal('').transform(() => undefined)),
  tripType: z.enum(['One way', 'Round trip']).optional().or(z.literal('').transform(() => undefined)),
  goodsType: optionalText(120),
  weightKg: optionalNumber(z.coerce.number().min(1, 'Approximate weight').max(100000, 'Mention larger loads in the notes')),
  loadType: z.enum(loadOptions).optional().or(z.literal('').transform(() => undefined)),
  companyName: optionalText(120),
  employees: optionalNumber(z.coerce.number().int().min(1).max(5000)),
}

const contactShape = {
  fullName: text(80).pipe(z.string().min(2, 'Please enter your name')),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
  message: optionalText(2000),
  consent: z.literal(true, { message: 'Please agree so we can contact you' }),
  // Spam protection: honeypot must stay empty
  website: z.string().max(0).optional().or(z.literal('')),
}

type Conditional = {
  service: EnquiryService
  travellers?: number
  vehicle?: string
  goodsType?: string
  weightKg?: number
  loadType?: string
  companyName?: string
}

function conditional(v: Conditional, ctx: z.RefinementCtx) {
  if ((isTravel(v.service) || v.service === 'transport-passenger') && !v.travellers) {
    ctx.addIssue({ code: 'custom', path: ['travellers'], message: 'How many travellers?' })
  }
  if (v.service === 'transport-passenger' && !v.vehicle) {
    ctx.addIssue({ code: 'custom', path: ['vehicle'], message: 'Choose a vehicle type' })
  }
  if (isGoods(v.service)) {
    if (!v.goodsType || v.goodsType.length < 2) ctx.addIssue({ code: 'custom', path: ['goodsType'], message: 'What are you shipping?' })
    if (!v.weightKg) ctx.addIssue({ code: 'custom', path: ['weightKg'], message: 'Approximate weight in kg' })
  }
  if (v.service === 'logistics' && !v.loadType) {
    ctx.addIssue({ code: 'custom', path: ['loadType'], message: 'Choose a load type' })
  }
  if (v.service === 'corporate' && (!v.companyName || v.companyName.length < 2)) {
    ctx.addIssue({ code: 'custom', path: ['companyName'], message: 'Company name' })
  }
}

/** Full schema — used on final submit (and mirrored by database constraints). */
export const enquirySchema = z.object({ ...serviceShape, ...detailsShape, ...contactShape }).superRefine(conditional)

/** Per-step schemas so each step reports only its own (including conditional) errors. */
export const stepSchemas = [
  z.object(serviceShape),
  z.object({ ...serviceShape, ...detailsShape }).superRefine(conditional),
  z.object(contactShape),
  enquirySchema,
] as const

export type EnquiryInput = z.input<typeof enquirySchema>
export type Enquiry = z.output<typeof enquirySchema>

export const serviceFlags = (s: EnquiryService | undefined) => ({
  showTravellers: !!s && (isTravel(s) || s === 'transport-passenger'),
  showBudget: !!s && isTravel(s),
  showVehicle: s === 'transport-passenger',
  showGoods: !!s && isGoods(s),
  showLoad: s === 'logistics',
  showCorporate: s === 'corporate',
})
