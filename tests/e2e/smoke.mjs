// End-to-end smoke test against a running server (dev or preview).
//   npm run dev   (in another terminal)
//   CHROME_PATH=<optional chrome binary> node tests/e2e/smoke.mjs [baseUrl]
// Checks: every route renders a heading without console errors, nav links resolve,
// mobile menu opens, enquiry validation blocks empty steps, filters work, WebGL fallback renders.
import { chromium } from '@playwright/test'

const BASE = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '')
const routes = [
  '/', '/about', '/services', '/services/tour-travel', '/services/transportation', '/services/logistics',
  '/services/travel-booking', '/services/corporate-travel', '/services/custom-packages', '/destinations',
  '/destinations/ladakh', '/destinations/goa', '/packages', '/packages/ladakh-high-roads', '/contact',
  '/privacy-policy', '/terms-and-conditions', '/404', '/this-does-not-exist', '/services/unknown', '/admin',
]

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] })
let failures = 0
const fail = (m) => (failures++, console.log('  ✗', m))
const ok = (m) => console.log('  ✓', m)
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad))

async function page(width = 1440, height = 900) {
  const p = await browser.newPage({ viewport: { width, height } })
  p.errors = []
  p.on('console', (m) => m.type() === 'error' && p.errors.push(m.text()))
  p.on('pageerror', (e) => p.errors.push(String(e)))
  return p
}

console.log('Routes')
for (const r of routes) {
  const p = await page()
  await p.goto(BASE + r, { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  const h1 = await p.locator('h1').first().textContent().catch(() => null)
  const title = await p.title()
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  if (!h1) fail(`${r}: no <h1>`)
  else if (p.errors.length) fail(`${r}: console errors → ${p.errors.join(' | ').slice(0, 200)}`)
  else if (overflow) fail(`${r}: horizontal overflow`)
  else ok(`${r} — "${h1.trim().replace(/\s+/g, ' ').slice(0, 40)}" · ${title}`)
  await p.close()
}

console.log('Internal links')
{
  const p = await page()
  const seen = new Set()
  for (const r of ['/', '/services', '/destinations', '/packages']) {
    await p.goto(BASE + r, { waitUntil: 'networkidle' })
    for (const href of await p.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')))) seen.add(href.split('#')[0].split('?')[0])
  }
  for (const href of seen) {
    await p.goto(BASE + href, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(250)
    const text = await p.locator('h1').first().textContent().catch(() => '')
    if (/isn’t on our map/.test(text) && href !== '/404') fail(`link ${href} → 404`)
  }
  ok(`${seen.size} unique internal links resolve`)
  await p.close()
}

console.log('Mobile menu (375px)')
{
  const p = await page(375, 812)
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: 'Open menu' }).click()
  await p.waitForTimeout(900)
  check(await p.getByRole('dialog', { name: 'Menu' }).isVisible(), 'menu opens', 'menu did not open')
  await p.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: /Destinations/ }).first().click()
  await p.waitForURL('**/destinations')
  ok('menu link navigates')
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  check(!overflow, 'no horizontal overflow at 375px', 'mobile horizontal overflow')
  await p.close()
}

console.log('Enquiry form')
{
  const p = await page()
  await p.goto(BASE + '/contact', { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /Continue/ }).click()
  check(await p.getByText('Choose the service you need').isVisible(), 'step 1 requires a service', 'service validation missing')
  await p.getByText('Truck & logistics', { exact: true }).click()
  await p.getByRole('button', { name: /Continue/ }).click()
  await p.waitForTimeout(800) // step transition
  await p.getByRole('button', { name: /Continue/ }).click()
  await p.waitForTimeout(500)
  const msgs = await p.locator('[role=alert]').allTextContents()
  check(msgs.some((m) => /shipping/.test(m)) && msgs.some((m) => /load type/i.test(m)), 'logistics conditional fields validated', `conditional validation: ${msgs.join(', ')}`)
  const note = await p.getByText(/Online submissions aren’t connected yet/).count()
  ok(note ? 'shows "submissions not connected" notice (no backend configured)' : 'live submission channel configured')
  await p.close()
}

console.log('Filters')
{
  const p = await page()
  await p.goto(BASE + '/destinations?category=beaches', { waitUntil: 'networkidle' })
  const n = await p.locator('a[href^="/destinations/"]').count()
  check(n === 2, 'beaches filter → 2 results', `beaches filter → ${n}`)
  await p.goto(BASE + '/destinations?q=zzzz', { waitUntil: 'networkidle' })
  check(await p.getByText('No destinations match').isVisible(), 'empty state', 'no empty state')
  await p.goto(BASE + '/packages?theme=honeymoon', { waitUntil: 'networkidle' })
  const k = await p.locator('a[href^="/packages/"]').count()
  check(k === 2, 'honeymoon filter → 2 packages', `honeymoon filter → ${k}`)
  await p.close()
}

console.log('WebGL fallback')
{
  const p = await page()
  await p.goto(BASE + '/?nowebgl', { waitUntil: 'networkidle' })
  const canvases = await p.locator('canvas').count()
  check(canvases === 0 && !p.errors.length, 'static fallback renders without canvas or errors', `fallback: ${canvases} canvases, errors ${p.errors.length}`)
  await p.close()
}

console.log('Reduced motion')
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })
  const p = await ctx.newPage()
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  const lenis = await p.evaluate(() => document.documentElement.classList.contains('lenis'))
  check(!lenis, 'smooth scroll disabled under reduced motion', 'lenis active under reduced motion')
  await ctx.close()
}

await browser.close()
console.log(failures ? `\n${failures} failure(s)` : '\nAll smoke checks passed')
process.exit(failures ? 1 : 0)
