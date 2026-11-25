// Downloads the photos listed in src/data/photos.json from the Unsplash CDN as
// optimised WebP in two sizes: public/images/<name>.webp (1600w) and <name>-sm.webp (800w).
//   node scripts/fetch-photos.mjs            (skips files that already exist)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const { photos } = JSON.parse(readFileSync(new URL('../src/data/photos.json', import.meta.url), 'utf8'))
const dir = new URL('../public/images/', import.meta.url)
mkdirSync(dir, { recursive: true })

const sizes = [
  ['', 1600, Number(process.env.Q || 70)],
  ['-sm', 800, 65],
]
let total = 0
for (const [name, p] of Object.entries(photos)) {
  for (const [suffix, w, q] of sizes) {
    const file = new URL(`${name}${suffix}.webp`, dir)
    if (existsSync(file)) continue
    const url = `https://images.unsplash.com/${p.id}?w=${w}&q=${q}&fm=webp&fit=max`
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`✗ ${name}${suffix}: HTTP ${res.status}`)
      process.exitCode = 1
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(file, buf)
    total += buf.length
    console.log(`✓ ${name}${suffix}.webp ${(buf.length / 1024).toFixed(0)} KB`)
  }
}
console.log(`done — ${(total / 1024 / 1024).toFixed(1)} MB downloaded`)
