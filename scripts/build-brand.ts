/**
 * Generates the Skyhigh SVG logo system into public/brand.
 * Text is converted to outlines (paths) so files render identically
 * everywhere without the font installed.
 *
 *   npm run brand
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import opentype, { type Font } from 'opentype.js'
import {
  BRAND_COLORS as C,
  MARK_DOT,
  MARK_FACET_PATH,
  MARK_PATH,
  MARK_TRANSFORM,
} from '../src/config/brandMark.ts'

const root = resolve(import.meta.dirname, '..')
const out = resolve(root, 'public/brand')
mkdirSync(out, { recursive: true })

const fontFile = (w: number) =>
  resolve(root, `node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-${w}-normal.woff`)
const toAB = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
const bold = opentype.parse(toAB(readFileSync(fontFile(700))))
const medium = opentype.parse(toAB(readFileSync(fontFile(500))))

/** Lays out text glyph-by-glyph with custom tracking; returns path data + width. */
/**
 * Converts raw glyph outline commands (font units, y-up) to SVG path data.
 * Done by hand because opentype.js 2.x mis-orients WOFF glyph paths.
 */
type Cmd = { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number }
function glyphPath(commands: Cmd[], ox: number, baseline: number, scale: number) {
  const X = (v = 0) => +(ox + v * scale).toFixed(2)
  const Y = (v = 0) => +(baseline - v * scale).toFixed(2)
  return commands
    .map((c) => {
      switch (c.type) {
        case 'M': return `M${X(c.x)} ${Y(c.y)}`
        case 'L': return `L${X(c.x)} ${Y(c.y)}`
        case 'Q': return `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`
        case 'C': return `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`
        case 'Z': return 'Z'
        default: return ''
      }
    })
    .join('')
}

function textPath(font: Font, text: string, x: number, y: number, size: number, tracking: number) {
  const scale = size / font.unitsPerEm
  let cursor = x
  const parts: string[] = []
  for (const ch of text) {
    const g = font.charToGlyph(ch)
    parts.push(glyphPath(g.path.commands, cursor, y, scale))
    cursor += (g.advanceWidth ?? 0) * scale + tracking
  }
  return { d: parts.join(''), width: cursor - tracking - x }
}

type Palette = { mark: string; facet: string; dot: string; word: string; sub: string; bg?: string }

const palettes: Record<string, Palette> = {
  primary: { mark: C.navy, facet: C.sky, dot: C.orange, word: C.navy, sub: '#4A5D73' },
  white: { mark: '#FFFFFF', facet: 'rgba(255,255,255,0.72)', dot: C.orange, word: '#FFFFFF', sub: 'rgba(255,255,255,0.7)' },
  dark: { mark: C.midnight, facet: C.midnight, dot: C.orange, word: C.midnight, sub: C.midnight },
  mono: { mark: '#000000', facet: '#000000', dot: '#000000', word: '#000000', sub: '#000000' },
}

const mark = (p: Palette, tx = 0, ty = 0, s = 1) => `
  <g transform="translate(${tx} ${ty}) scale(${s})">
    <g transform="${MARK_TRANSFORM}">
      <path d="${MARK_PATH}" fill="${p.mark}"/>
      ${p.facet !== p.mark ? `<path d="${MARK_FACET_PATH}" fill="${p.facet}"/>` : ''}
    </g>
    <circle cx="${MARK_DOT.cx}" cy="${MARK_DOT.cy}" r="${MARK_DOT.r}" fill="${p.dot}"/>
  </g>`

const svg = (w: number, h: number, body: string, title: string, bg?: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="${title}">
  <title>${title}</title>${bg ? `\n  <rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}
</svg>\n`

const write = (name: string, content: string) => {
  writeFileSync(resolve(out, name), content)
  console.log('  ✓', name)
}

const WORD = 'SKYHIGH'
const SUB = 'TRAVEL BIRD TECHNOLOGY'

function horizontal(p: Palette, withSub = true) {
  const markSize = 64
  const gap = 14
  const word = textPath(bold, WORD, markSize + gap, withSub ? 38 : 44, 34, 1.2)
  let sub = { d: '', width: 0 }
  if (withSub) {
    // stretch tracking so the sub-line spans the wordmark exactly
    const raw = textPath(medium, SUB, 0, 0, 7.6, 0)
    const tracking = (word.width - raw.width) / (SUB.length - 1)
    sub = textPath(medium, SUB, markSize + gap + 1, 54, 7.6, tracking)
  }
  const w = markSize + gap + word.width + 4
  return svg(
    w,
    64,
    `${mark(p)}
  <path d="${word.d}" fill="${p.word}"/>${withSub ? `\n  <path d="${sub.d}" fill="${p.sub}"/>` : ''}`,
    'Skyhigh — Travel Bird Technology',
    p.bg,
  )
}

function vertical(p: Palette) {
  const word = textPath(bold, WORD, 0, 0, 30, 2)
  const raw = textPath(medium, SUB, 0, 0, 6.4, 0)
  const width = Math.max(word.width, 120)
  const tracking = (word.width - raw.width) / (SUB.length - 1)
  const wx = (width - word.width) / 2
  const w2 = textPath(bold, WORD, wx, 112, 30, 2)
  const s2 = textPath(medium, SUB, wx, 128, 6.4, tracking)
  const markScale = 1.25
  const mx = (width - 64 * markScale) / 2
  return svg(
    width,
    136,
    `${mark(p, mx, 0, markScale)}
  <path d="${w2.d}" fill="${p.word}"/>
  <path d="${s2.d}" fill="${p.sub}"/>`,
    'Skyhigh — Travel Bird Technology',
  )
}

console.log('Building Skyhigh brand assets → public/brand')
write('skyhigh-logo-horizontal.svg', horizontal(palettes.primary))
write('skyhigh-logo-vertical.svg', vertical(palettes.primary))
write('skyhigh-icon.svg', svg(64, 64, mark(palettes.primary), 'Skyhigh'))
write('skyhigh-logo-white.svg', horizontal(palettes.white))
write('skyhigh-logo-dark.svg', horizontal(palettes.dark))
write('skyhigh-logo-mono.svg', horizontal(palettes.mono))
write('skyhigh-logo-mobile.svg', horizontal(palettes.primary, false))
write('skyhigh-icon-white.svg', svg(64, 64, mark(palettes.white), 'Skyhigh'))

// Favicon: white swift on navy tile with rounded corners — legible at 16px.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${C.navy}"/>${mark(palettes.white, 7, 8, 0.78)}
</svg>\n`
write('favicon.svg', favicon)
writeFileSync(resolve(root, 'public/favicon.svg'), favicon)
console.log('Done.')
