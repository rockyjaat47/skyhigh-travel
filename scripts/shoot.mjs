// Visual QA helper: node scripts/shoot.mjs <path> [width] [height] [waitMs] [scrollY] [name]
import { chromium } from '@playwright/test'
const [path = '/', w = '1440', h = '900', wait = '5000', scrollY = '0', name = 'shot'] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' })
await page.waitForTimeout(+wait)
if (+scrollY) {
  await page.evaluate((y) => window.scrollTo(0, y), +scrollY)
  await page.waitForTimeout(1800)
}
await page.screenshot({ path: `tests/shots/${name}.png` })
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'))
else console.log('no console errors')
await browser.close()
