import * as THREE from 'three'
import { BRAND_COLORS, MARK_DOT, MARK_PATH } from '../../config/brandMark'
import { rng } from '../../utils/cn'

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** Soft puffy cloud sprite built from layered radial gradients. */
export function makeCloudTexture(seed: number) {
  const size = 256
  const [c, g] = canvas(size, size)
  const r = rng(seed)
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2
    const d = Math.pow(r(), 0.7) * size * 0.26
    const x = size / 2 + Math.cos(a) * d * 1.35
    const y = size / 2 + Math.sin(a) * d * 0.7 + 10
    const rad = size * (0.1 + r() * 0.16)
    const grad = g.createRadialGradient(x, y - rad * 0.25, 0, x, y, rad)
    grad.addColorStop(0, 'rgba(255,255,255,0.55)')
    grad.addColorStop(0.55, 'rgba(255,255,255,0.22)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, rad, 0, Math.PI * 2)
    g.fill()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Fuselage livery painted onto the lathe UVs.
 * u = angle around the body (0 = top, 0.25 = right side, 0.5 = belly, 0.75 = left side)
 * v = position along the body (0 = tail, 1 = nose); canvas y = (1 - v).
 */
export function makeFuselageTexture() {
  const W = 2048
  const H = 1024
  const [c, g] = canvas(W, H)
  g.fillStyle = '#f4f6f9'
  g.fillRect(0, 0, W, H)

  // soft belly shading
  const belly = g.createLinearGradient(0.38 * W, 0, 0.62 * W, 0)
  belly.addColorStop(0, 'rgba(206,214,224,0)')
  belly.addColorStop(0.5, 'rgba(206,214,224,0.9)')
  belly.addColorStop(1, 'rgba(206,214,224,0)')
  g.fillStyle = belly
  g.fillRect(0.38 * W, 0, 0.24 * W, H)

  const y = (v: number) => (1 - v) * H
  const sides = [
    { win: 0.205, line: 0.272, accent: 0.3, logo: 0.155 },
    { win: 0.795, line: 0.728, accent: 0.7, logo: 0.845 },
  ]

  for (const s of sides) {
    // sky-blue cheatline + thin orange accent
    g.fillStyle = BRAND_COLORS.sky
    g.fillRect(s.line * W - 22, y(0.97), 44, y(0.06) - y(0.97))
    g.fillStyle = BRAND_COLORS.orange
    g.fillRect(s.accent * W - 5, y(0.9), 10, y(0.12) - y(0.9))
    // navy tail cone wash
    const tail = g.createLinearGradient(0, y(0.18), 0, y(0))
    tail.addColorStop(0, 'rgba(7,29,54,0)')
    tail.addColorStop(1, 'rgba(7,29,54,0.9)')
    g.fillStyle = tail
    g.fillRect(s.line * W - 140, y(0.18), 280, y(0) - y(0.18))

    // cabin windows
    g.fillStyle = '#1b2a3d'
    for (let v = 0.2; v < 0.84; v += 0.0215) {
      if (Math.abs(v - 0.52) < 0.012) continue // over-wing exit gap
      const cy = y(v)
      g.beginPath()
      g.roundRect(s.win * W - 26, cy - 9, 52, 18, 8)
      g.fill()
    }
    // doors
    g.strokeStyle = 'rgba(40,60,85,0.35)'
    g.lineWidth = 3
    for (const v of [0.86, 0.18]) {
      g.beginPath()
      g.roundRect(s.win * W - 40, y(v) - 18, 120, 36, 10)
      g.stroke()
    }
  }

  // cockpit windows (wrap the front)
  g.fillStyle = '#132235'
  for (const u of [0.13, 0.19, 0.81, 0.87]) {
    g.beginPath()
    g.roundRect(u * W - 34, y(0.935) - 10, 68, 22, 6)
    g.fill()
  }

  // SKYHIGH titles along each side (text runs along the body)
  g.save()
  g.fillStyle = BRAND_COLORS.navy
  g.font = '700 44px "Space Grotesk Variable", "Space Grotesk", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  // right side: nose is "up" on the canvas, reading tail→nose
  g.translate(0.155 * W, y(0.62))
  g.rotate(-Math.PI / 2)
  g.scale(1, 3.2)
  g.fillText('S K Y H I G H', 0, 0)
  g.restore()
  g.save()
  g.fillStyle = BRAND_COLORS.navy
  g.font = '700 44px "Space Grotesk Variable", "Space Grotesk", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.translate(0.845 * W, y(0.62))
  g.rotate(Math.PI / 2)
  g.scale(1, 3.2)
  g.fillText('S K Y H I G H', 0, 0)
  g.restore()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Navy tail fin with the swift mark. Mapped via the extrude shape UVs. */
export function makeFinTexture() {
  const S = 512
  const [c, g] = canvas(S, S)
  const grad = g.createLinearGradient(0, S, S, 0)
  grad.addColorStop(0, '#0b2747')
  grad.addColorStop(1, BRAND_COLORS.navy)
  g.fillStyle = grad
  g.fillRect(0, 0, S, S)
  // orange leading stripe
  g.fillStyle = BRAND_COLORS.orange
  g.fillRect(0, S * 0.84, S, S * 0.03)
  // mark
  g.save()
  g.translate(S * 0.52, S * 0.42)
  g.scale(3.4, 3.4)
  g.translate(-32, -34)
  g.translate(32, 34)
  g.rotate((35 * Math.PI) / 180)
  g.translate(-32, -34)
  g.fillStyle = '#ffffff'
  g.fill(new Path2D(MARK_PATH))
  g.restore()
  g.save()
  g.translate(S * 0.52, S * 0.42)
  g.scale(3.4, 3.4)
  g.translate(-32, -34)
  g.fillStyle = BRAND_COLORS.orange
  g.beginPath()
  g.arc(MARK_DOT.cx, MARK_DOT.cy, MARK_DOT.r, 0, Math.PI * 2)
  g.fill()
  g.restore()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
