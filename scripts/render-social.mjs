// Renders raster brand assets (OG image, apple-touch-icon) from the SVG logo set.
//   CHROME_PATH=... node scripts/render-social.mjs
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
const svg = (f) => readFileSync(new URL(`../public/brand/${f}`, import.meta.url), 'utf8')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(`<html><body style="margin:0;width:1200px;height:630px;overflow:hidden;font-family:system-ui;background:radial-gradient(120% 90% at 85% 10%,#ffb46b 0%,#c98a73 22%,#2f5383 55%,#071D36 100%);position:relative">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,15,28,.0),rgba(8,15,28,.55))"></div>
  <div style="position:absolute;left:72px;top:64px;width:420px">${svg('skyhigh-logo-white.svg')}</div>
  <div style="position:absolute;left:72px;bottom:150px;color:#fff;font-size:84px;line-height:.95;letter-spacing:-3px;font-weight:600">The World Is<br/>Closer Than Ever.</div>
  <div style="position:absolute;left:72px;bottom:72px;color:rgba(255,255,255,.8);font-size:24px;letter-spacing:.5px">Travel · Transport · Technology</div>
  <div style="position:absolute;right:72px;bottom:72px;width:14px;height:14px;background:#FF7900"></div>
</body></html>`)
await page.screenshot({ path: 'public/brand/og-image.png' })
await page.setViewportSize({ width: 180, height: 180 })
await page.setContent(`<html><body style="margin:0;width:180px;height:180px;background:#071D36;display:grid;place-items:center"><div style="width:130px">${svg('skyhigh-icon-white.svg')}</div></body></html>`)
await page.screenshot({ path: 'public/brand/apple-touch-icon.png' })
await browser.close()
console.log('rendered og-image.png, apple-touch-icon.png')
