import type { TravelPackage } from '../types/content'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatINR = (n: number) => inr.format(n)

/** True when the admin has entered a usable public price. */
export const hasPrice = (p: Pick<TravelPackage, 'pricePerPerson'>) => typeof p.pricePerPerson === 'number' && p.pricePerPerson > 0

/** Whole-number % off when a higher “original” price is set, else 0. */
export function discountPercent(p: Pick<TravelPackage, 'pricePerPerson' | 'originalPrice'>) {
  if (!hasPrice(p) || !p.originalPrice || p.originalPrice <= p.pricePerPerson!) return 0
  return Math.round((1 - p.pricePerPerson! / p.originalPrice) * 100)
}

export const isOffer = (p: TravelPackage) => discountPercent(p) > 0 || !!p.offerLabel?.trim()

/** “4N 5D” style duration label. */
export const nightsDays = (days: number) => (days > 1 ? `${days - 1}N ${days}D` : '1 day')

/** “12 Dec 2026” for a yyyy-mm-dd date. */
export const fmtDay = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
