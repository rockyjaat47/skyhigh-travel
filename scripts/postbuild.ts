/**
 * Runs after `vite build`:
 *  1. dist/<route>/index.html for every known route (HTTP 200), and dist/404.html as the
 *     SPA fallback for anything else
 *  2. dist/sitemap.xml — every public route, generated from the content data
 *  3. dist/robots.txt — points crawlers at the sitemap, keeps /admin out
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { destinations } from '../src/data/destinations.ts'
import { packages, tourCategories } from '../src/data/packages.ts'
import { services } from '../src/data/services.ts'

try {
  process.loadEnvFile(resolve(import.meta.dirname, '../.env'))
} catch {
  /* no .env — rely on the environment (CI) */
}

const dist = resolve(import.meta.dirname, '../dist')
if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('postbuild: dist/index.html not found — run vite build first')
  process.exit(1)
}

const site = (process.env.VITE_SITE_URL || 'https://example.github.io/skyhigh-travel').replace(/\/$/, '')
const today = new Date().toISOString().slice(0, 10)

const routes: [string, number][] = [
  ['/', 1.0],
  ['/about', 0.7],
  ['/services', 0.9],
  ...services.map((s) => [`/services/${s.slug}`, 0.8] as [string, number]),
  ['/destinations', 0.8],
  ...destinations.filter((d) => d.published).map((d) => [`/destinations/${d.slug}`, 0.6] as [string, number]),
  ['/packages', 0.8],
  ...packages.filter((p) => p.published).map((p) => [`/packages/${p.slug}`, 0.6] as [string, number]),
  ...tourCategories.map((c) => [`/tours/${c.slug}`, 0.7] as [string, number]),
  ['/agents', 0.5],
  ['/contact', 0.8],
  ['/privacy-policy', 0.2],
  ['/terms-and-conditions', 0.2],
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(([p, pr]) => `  <url><loc>${site}${p === '/' ? '/' : `${p}/`}</loc><lastmod>${today}</lastmod><priority>${pr.toFixed(1)}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(resolve(dist, 'sitemap.xml'), xml)
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /login\n\nSitemap: ${site}/sitemap.xml\n`)
copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
// Give every known route its own index.html so static hosts answer HTTP 200
// (search engines may skip pages served through the 404 fallback).
for (const p of [...routes.map(([r]) => r), '/admin', '/login', '/account']) {
  if (p === '/') continue
  const dir = resolve(dist, p.slice(1))
  mkdirSync(dir, { recursive: true })
  copyFileSync(resolve(dist, 'index.html'), resolve(dir, 'index.html'))
}
// GitHub Pages: don't run Jekyll over the build output
writeFileSync(resolve(dist, '.nojekyll'), '')

console.log(`postbuild: sitemap (${routes.length} urls), robots.txt, 404.html → ${site}`)
