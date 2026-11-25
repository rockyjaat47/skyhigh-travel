import { memo, useId, useMemo } from 'react'
import type { Artwork as ArtworkT, ArtScene, ArtTone } from '../../types/content'
import { asset, cn, hashString, rng } from '../../utils/cn'

/**
 * Procedural, art-directed landscape posters (SVG).
 * Deterministic per `seed`, resolution-independent, ~3–8 KB of DOM each,
 * and fully original — no licensing concerns. If `art.image` is set
 * (a real photograph), it is rendered instead.
 */

const W = 800
const H = 1000

interface Palette {
  top: string
  mid: string
  bottom: string
  sun: string
  glow: string
  layers: [string, string, string, string]
  water: [string, string]
  stars?: boolean
  lights?: string
}

const TONES: Record<ArtTone, Palette> = {
  dawn: {
    top: '#24406e', mid: '#9a8fb5', bottom: '#f7c9a9', sun: '#fff1df', glow: '#ffd6b5',
    layers: ['#a5aecb', '#7f8bb0', '#566690', '#2c3b5e'], water: ['#c9b9c9', '#4e5f86'],
  },
  day: {
    top: '#0a5fa3', mid: '#3d94cf', bottom: '#cdeaf8', sun: '#fffaf0', glow: '#e9f7ff',
    layers: ['#a9cbe2', '#77a5c9', '#3f729b', '#143c5e'], water: ['#8fc6e6', '#0d4f80'],
  },
  golden: {
    top: '#2f5383', mid: '#c98a73', bottom: '#ffc27a', sun: '#fff3d1', glow: '#ffd39b',
    layers: ['#e0a37a', '#b9765f', '#7d4c4a', '#3a2633'], water: ['#f2b884', '#5b3b45'],
  },
  dusk: {
    top: '#151c44', mid: '#7a3f78', bottom: '#ff8a4c', sun: '#ffd7a8', glow: '#ff9d62',
    layers: ['#94557a', '#653d68', '#3d2a55', '#1a1532'], water: ['#d77b6a', '#2a1f45'],
    lights: '#ffc78a',
  },
  night: {
    top: '#040914', mid: '#0d1f3c', bottom: '#1f3c66', sun: '#eef4ff', glow: '#4f7bb8',
    layers: ['#22406a', '#172f51', '#0f213c', '#081426'], water: ['#1d3a63', '#050c18'],
    stars: true, lights: '#ffd28f',
  },
}

/* ── geometry helpers ─────────────────────────────────────────── */

/** Midpoint-displacement ridge line → closed path filling to the bottom. */
function ridge(r: () => number, baseY: number, amp: number, rough = 0.55, sharp = false) {
  const n = 64
  const pts = new Array(n + 1).fill(0)
  pts[0] = (r() - 0.5) * amp
  pts[n] = (r() - 0.5) * amp
  let step = n
  let scale = amp
  while (step > 1) {
    const half = step / 2
    for (let i = half; i < n; i += step) {
      pts[i] = (pts[i - half] + pts[i + half]) / 2 + (r() - 0.5) * scale
    }
    step = half
    scale *= rough
  }
  const dx = W / n
  let d = `M0 ${H} L0 ${(baseY + pts[0]).toFixed(1)}`
  for (let i = 1; i <= n; i++) {
    const y = baseY + (sharp ? -Math.abs(pts[i]) : pts[i])
    d += ` L${(i * dx).toFixed(1)} ${y.toFixed(1)}`
  }
  return d + ` L${W} ${H} Z`
}

/** Smooth dune / hill curve. */
function dune(r: () => number, baseY: number, amp: number, waves = 2) {
  const p1 = r() * Math.PI * 2
  const p2 = r() * Math.PI * 2
  let d = `M0 ${H}`
  for (let x = 0; x <= W; x += 10) {
    const t = x / W
    const y = baseY + Math.sin(t * Math.PI * waves + p1) * amp + Math.sin(t * Math.PI * waves * 2.3 + p2) * amp * 0.3
    d += ` L${x} ${y.toFixed(1)}`
  }
  return d + ` L${W} ${H} Z`
}

function skyline(r: () => number, baseY: number, minH: number, maxH: number, minW = 26, maxW = 70) {
  const rects: { x: number; y: number; w: number; h: number; spire: boolean }[] = []
  let x = -10
  while (x < W + 10) {
    const w = minW + r() * (maxW - minW)
    const center = 1 - Math.abs((x + w / 2) / W - 0.55) * 1.3
    const h = minH + r() * (maxH - minH) * Math.max(0.35, center)
    rects.push({ x, y: baseY - h, w, h, spire: r() > 0.82 })
    x += w + r() * 4
  }
  return rects
}

function palm(x: number, y: number, s: number, lean: number, color: string, key: string | number) {
  const topX = x + lean * s
  const topY = y - 150 * s
  const fronds = [-150, -115, -70, -30, 15, 50, 160].map((a, i) => {
    const rad = (a * Math.PI) / 180
    const len = (70 + (i % 3) * 14) * s
    const ex = topX + Math.cos(rad) * len
    const ey = topY + Math.sin(rad) * len * 0.55 + 22 * s
    const cx = topX + Math.cos(rad) * len * 0.5
    const cy = topY - 18 * s
    return `M${topX} ${topY} Q${cx} ${cy} ${ex} ${ey} Q${cx} ${cy + 10 * s} ${topX} ${topY + 4 * s}Z`
  })
  return (
    <g key={key} fill={color}>
      <path d={`M${x - 4 * s} ${y} Q${x + lean * s * 0.3} ${y - 80 * s} ${topX - 2 * s} ${topY} L${topX + 3 * s} ${topY} Q${x + lean * s * 0.35 + 5 * s} ${y - 80 * s} ${x + 5 * s} ${y}Z`} />
      {fronds.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  )
}

function pines(r: () => number, baseY: number, count: number, size: number, color: string, amp = 30) {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (i / count) * W + r() * (W / count)
    const y = baseY + Math.sin(x / 90) * amp + r() * 8
    const h = size * (0.7 + r() * 0.6)
    const w = h * 0.34
    out.push(`M${x} ${y - h} L${x + w} ${y} L${x - w} ${y}Z`)
  }
  return <path d={out.join('')} fill={color} />
}

/* ── scene composition ─────────────────────────────────────────── */

function Scene({ scene, tone, seed, uid }: { scene: ArtScene; tone: ArtTone; seed: number; uid: string }) {
  const p = TONES[tone]
  const r = rng(seed)
  const id = (s: string) => `${uid}-${s}`
  const sunX = 180 + r() * 440
  const horizon = scene === 'beach' || scene === 'backwaters' || scene === 'river' ? 600 : 640
  const isNight = tone === 'night'

  const stars = p.stars
    ? Array.from({ length: 90 }, () => [r() * W, r() * 520, r() * 1.4 + 0.3, r()] as const)
    : []

  const sunY = tone === 'day' ? 230 + r() * 80 : tone === 'night' ? 180 + r() * 60 : horizon - 70 - r() * 120
  const sunR = tone === 'night' ? 26 : tone === 'day' ? 48 : 64

  const layers: React.ReactNode[] = []

  switch (scene) {
    case 'mountains':
    case 'snow': {
      const snow = scene === 'snow'
      const L = snow ? ['#e7eef7', '#c8d6e8', '#8fa6c3', p.layers[3]] : p.layers
      layers.push(<path key="m0" d={ridge(r, 470, 320, 0.56, true)} fill={`url(#${id('fade0')})`} />)
      if (snow) layers.push(<path key="snowcap" d={ridge(rng(seed + 7), 520, 260, 0.5, true)} fill="#ffffff" opacity="0.65" />)
      layers.push(<path key="m1" d={ridge(r, 600, 260, 0.55, true)} fill={L[1]} />)
      layers.push(<rect key="mist1" x="0" y="560" width={W} height="200" fill={`url(#${id('mist')})`} />)
      layers.push(<path key="m2" d={ridge(r, 740, 200, 0.5, true)} fill={L[2]} />)
      layers.push(<rect key="mist2" x="0" y="700" width={W} height="160" fill={`url(#${id('mist')})`} />)
      layers.push(<path key="m3" d={ridge(r, 880, 120, 0.45)} fill={L[3]} />)
      break
    }
    case 'forest': {
      layers.push(<path key="f0" d={dune(r, 520, 50, 1.6)} fill={p.layers[0]} />)
      layers.push(<path key="f1" d={dune(r, 620, 60, 2)} fill={p.layers[1]} />)
      layers.push(<g key="p1">{pines(r, 640, 34, 60, p.layers[1], 50)}</g>)
      layers.push(<rect key="mist" x="0" y="600" width={W} height="200" fill={`url(#${id('mist')})`} />)
      layers.push(<path key="f2" d={dune(r, 760, 50, 2.4)} fill={p.layers[2]} />)
      layers.push(<g key="p2">{pines(r, 780, 22, 120, p.layers[2], 40)}</g>)
      layers.push(<path key="river" d={`M330 ${H} C380 900 470 860 430 800 C400 760 480 740 520 730 L540 732 C500 750 450 770 470 805 C510 870 450 930 470 ${H}Z`} fill={p.water[0]} opacity="0.85" />)
      layers.push(<g key="p3">{pines(r, 960, 12, 220, p.layers[3], 20)}</g>)
      break
    }
    case 'desert': {
      layers.push(<path key="d0" d={dune(r, 640, 22, 1.2)} fill={p.layers[0]} />)
      // fort silhouette on the far ridge
      const fx = 420 + r() * 160
      const fort = `M${fx} 640 v-70 h18 v-12 h10 v12 h20 v-36 h14 v-10 h10 v10 h14 v36 h22 v-14 h10 v14 h18 v70Z`
      layers.push(<path key="fort" d={fort} fill={p.layers[1]} />)
      layers.push(<path key="d1" d={dune(r, 720, 38, 1.6)} fill={p.layers[1]} />)
      layers.push(<path key="d2" d={dune(r, 810, 46, 1.3)} fill={p.layers[2]} />)
      layers.push(<path key="d3" d={dune(r, 920, 40, 1.1)} fill={p.layers[3]} />)
      break
    }
    case 'beach':
    case 'backwaters': {
      const back = scene === 'backwaters'
      // sea
      layers.push(<rect key="sea" x="0" y={horizon} width={W} height={H - horizon} fill={`url(#${id('water')})`} />)
      layers.push(<ellipse key="refl" cx={sunX} cy={horizon + 120} rx="60" ry="160" fill={p.glow} opacity={tone === 'day' ? 0.25 : 0.45} />)
      for (let i = 0; i < 18; i++) {
        const y = horizon + 12 + i * i * 1.6
        const w = 30 + i * 8 + r() * 40
        layers.push(<rect key={`w${i}`} x={sunX - w / 2 + (r() - 0.5) * 60} y={y} width={w} height={1 + i * 0.12} rx="1" fill={p.sun} opacity={0.5 - i * 0.022} />)
      }
      if (back) {
        // far tree line + reflections
        const trees: string[] = []
        for (let x = -20; x < W + 20; x += 14 + r() * 10) trees.push(`M${x} ${horizon} q8 ${-26 - r() * 20} 18 0Z`)
        layers.push(<path key="tl" d={trees.join('')} fill={p.layers[2]} />)
        layers.push(<path key="tlr" d={trees.join('')} fill={p.layers[2]} opacity="0.35" transform={`translate(0 ${horizon * 2}) scale(1 -1)`} />)
        // houseboat
        const bx = 250 + r() * 200
        layers.push(
          <g key="boat" fill={p.layers[3]}>
            <path d={`M${bx} ${horizon + 70} h150 l-14 18 h-122Z`} />
            <path d={`M${bx + 18} ${horizon + 70} q60 -44 118 0Z`} opacity="0.9" />
          </g>,
        )
        layers.push(palm(70, H, 2.2, 40, p.layers[3], 'p1'))
        layers.push(palm(720, H, 1.6, -60, p.layers[3], 'p2'))
      } else {
        layers.push(<path key="sand" d={`M0 ${H} L0 860 Q300 800 800 880 L800 ${H}Z`} fill={p.layers[3]} />)
        layers.push(<path key="foam" d={`M0 862 Q300 802 800 882`} stroke={p.sun} strokeOpacity="0.5" strokeWidth="2" fill="none" />)
        layers.push(palm(110, 900, 2.1, 70, p.layers[3], 'p1'))
        layers.push(palm(200, 890, 1.4, 40, p.layers[3], 'p2'))
      }
      break
    }
    case 'river': {
      layers.push(<rect key="water" x="0" y={horizon} width={W} height={H - horizon} fill={`url(#${id('water')})`} />)
      // temples & ghats skyline
      const bits = skyline(r, horizon, 40, 150, 30, 80)
      const temple = bits.map((b) => {
        const dome = b.spire
          ? `M${b.x + b.w * 0.2} ${b.y} L${b.x + b.w / 2} ${b.y - b.h * 0.6} L${b.x + b.w * 0.8} ${b.y}Z`
          : `M${b.x + b.w * 0.15} ${b.y} Q${b.x + b.w / 2} ${b.y - b.w * 0.6} ${b.x + b.w * 0.85} ${b.y}Z`
        return `M${b.x} ${horizon} V${b.y} H${b.x + b.w} V${horizon}Z ${dome}`
      })
      layers.push(<path key="tmp" d={temple.join(' ')} fill={p.layers[2]} />)
      layers.push(<path key="tmpr" d={temple.join(' ')} fill={p.layers[2]} opacity="0.3" transform={`translate(0 ${horizon * 2}) scale(1 -1)`} />)
      for (let i = 0; i < 6; i++) layers.push(<rect key={`st${i}`} x="0" y={horizon - 6 + i * 3} width={W} height="1.2" fill={p.layers[3]} opacity="0.5" />)
      for (let i = 0; i < 3; i++) {
        const x = 120 + r() * 560
        const y = horizon + 90 + i * 70
        layers.push(<path key={`b${i}`} d={`M${x} ${y} q40 14 80 0 l-8 8 h-64Z`} fill={p.layers[3]} />)
      }
      break
    }
    case 'city':
    case 'city-night': {
      const far = skyline(r, horizon, 80, 260, 30, 64)
      const near = skyline(r, horizon + 60, 120, 420, 40, 96)
      layers.push(<path key="far" d={far.map((b) => `M${b.x} ${horizon} V${b.y} H${b.x + b.w} V${horizon}Z`).join('')} fill={p.layers[1]} />)
      layers.push(<rect key="mist" x="0" y={horizon - 120} width={W} height="200" fill={`url(#${id('mist')})`} />)
      layers.push(
        <path
          key="near"
          d={near
            .map((b) => `M${b.x} ${horizon + 60} V${b.y} H${b.x + b.w} V${horizon + 60}Z${b.spire ? `M${b.x + b.w / 2 - 2} ${b.y} v-60 h4 v60Z` : ''}`)
            .join('')}
          fill={p.layers[3]}
        />,
      )
      if (p.lights) {
        const wins: string[] = []
        near.forEach((b) => {
          for (let y = b.y + 14; y < horizon + 50; y += 16)
            for (let x = b.x + 8; x < b.x + b.w - 8; x += 12) if (r() > 0.62) wins.push(`M${x} ${y}h5v7h-5Z`)
        })
        layers.push(<path key="wins" d={wins.join('')} fill={p.lights} opacity="0.85" />)
      }
      layers.push(<rect key="water" x="0" y={horizon + 60} width={W} height={H - horizon} fill={`url(#${id('water')})`} />)
      layers.push(
        <path
          key="nearR"
          d={near.map((b) => `M${b.x} ${horizon + 60} V${b.y} H${b.x + b.w} V${horizon + 60}Z`).join('')}
          fill={p.layers[3]}
          opacity="0.35"
          transform={`translate(0 ${(horizon + 60) * 2}) scale(1 -1)`}
        />,
      )
      break
    }
    case 'road': {
      layers.push(<path key="h0" d={ridge(r, 600, 120, 0.5)} fill={p.layers[0]} />)
      layers.push(<path key="h1" d={dune(r, 650, 24, 1.4)} fill={p.layers[1]} />)
      layers.push(<path key="ground" d={`M0 ${H} L0 690 L800 690 L800 ${H}Z`} fill={p.layers[2]} />)
      const vx = 380 + r() * 40
      layers.push(<path key="road" d={`M${vx - 6} 690 L${vx + 6} 690 L640 ${H} L160 ${H}Z`} fill={p.layers[3]} />)
      for (let i = 0; i < 10; i++) {
        const t0 = Math.pow(i / 10, 2)
        const t1 = Math.pow((i + 0.45) / 10, 2)
        const y0 = 690 + t0 * 310
        const y1 = 690 + t1 * 310
        const w0 = 1 + t0 * 8
        const w1 = 1 + t1 * 8
        const x0 = vx + (400 - vx) * t0
        const x1 = vx + (400 - vx) * t1
        layers.push(<path key={`ln${i}`} d={`M${x0 - w0 / 2} ${y0} L${x0 + w0 / 2} ${y0} L${x1 + w1 / 2} ${y1} L${x1 - w1 / 2} ${y1}Z`} fill={p.sun} opacity="0.75" />)
      }
      // freight truck seen from behind, heading toward the horizon
      const tx = vx + 6
      layers.push(
        <g key="truck">
          <rect x={tx - 34} y={748} width="68" height="56" rx="3" fill={p.layers[1]} />
          <rect x={tx - 34} y={748} width="68" height="6" fill={p.layers[0]} opacity="0.6" />
          <path d={`M${tx} 752 V800`} stroke={p.layers[3]} strokeOpacity="0.35" strokeWidth="1.5" />
          <rect x={tx - 30} y={804} width="60" height="6" fill={p.layers[3]} />
          <rect x={tx - 28} y={810} width="12" height="9" rx="2" fill={p.layers[3]} />
          <rect x={tx + 16} y={810} width="12" height="9" rx="2" fill={p.layers[3]} />
          <rect x={tx - 31} y={796} width="7" height="5" rx="1" fill="#ff4b3a" />
          <rect x={tx + 24} y={796} width="7" height="5" rx="1" fill="#ff4b3a" />
          <ellipse cx={tx} cy={822} rx="44" ry="5" fill={p.layers[3]} opacity="0.5" />
        </g>,
      )
      break
    }
    case 'sky': {
      const clouds: React.ReactNode[] = []
      for (let i = 0; i < 9; i++) {
        const cx = r() * W
        const cy = 520 + r() * 460
        const s = 0.7 + r() * 1.4
        clouds.push(
          <g key={`c${i}`} opacity={0.55 + r() * 0.4} fill="#ffffff">
            <ellipse cx={cx} cy={cy} rx={140 * s} ry={34 * s} />
            <ellipse cx={cx - 50 * s} cy={cy - 20 * s} rx={60 * s} ry={34 * s} />
            <ellipse cx={cx + 30 * s} cy={cy - 30 * s} rx={70 * s} ry={44 * s} />
          </g>,
        )
      }
      layers.push(<g key="clouds" filter={`url(#${id('blur')})`}>{clouds}</g>)
      // aircraft silhouette (top view), climbing
      layers.push(
        <g key="plane" transform={`translate(${sunX > 400 ? 250 : 520} 360) rotate(-28) scale(1.2)`} fill={p.layers[3]}>
          <path d="M0 -70 C6 -64 7 -50 7 -36 L7 40 L22 58 L22 64 L4 56 L0 66 L-4 56 L-22 64 L-22 58 L-7 40 L-7 -36 C-7 -50 -6 -64 0 -70Z" />
          <path d="M7 -10 L78 22 L78 30 L7 10Z M-7 -10 L-78 22 L-78 30 L-7 10Z" />
        </g>,
      )
      break
    }
  }

  return (
    <>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.top} />
          <stop offset="0.55" stopColor={p.mid} />
          <stop offset="1" stopColor={p.bottom} />
        </linearGradient>
        <radialGradient id={id('sun')}>
          <stop offset="0" stopColor={p.sun} />
          <stop offset="0.2" stopColor={p.sun} />
          <stop offset="0.21" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('mist')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bottom} stopOpacity="0" />
          <stop offset="0.5" stopColor={p.bottom} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.bottom} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('fade0')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.3" stopColor={p.layers[0]} />
          <stop offset="0.8" stopColor={p.bottom} />
        </linearGradient>
        <linearGradient id={id('water')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.water[0]} />
          <stop offset="1" stopColor={p.water[1]} />
        </linearGradient>
        <filter id={id('blur')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={`url(#${id('sky')})`} />
      {stars.map(([x, y, s, o], i) => (
        <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={0.3 + o * 0.6} />
      ))}
      <circle cx={sunX} cy={sunY} r={sunR * 4.5} fill={`url(#${id('sun')})`} opacity={isNight ? 0.6 : 1} />
      {layers}
    </>
  )
}

export interface ArtworkProps {
  art: ArtworkT
  seed?: string
  className?: string
  /** Decorative usage hides it from assistive tech. */
  decorative?: boolean
  priority?: boolean
  /** Vertical anchor when cropped by a wide container. */
  align?: 'top' | 'center' | 'bottom'
}

export const Artwork = memo(function Artwork({ art, seed, className, decorative, priority, align = 'center' }: ArtworkProps) {
  const uid = useId().replace(/:/g, '')
  const seedNum = useMemo(() => hashString(seed ?? art.alt), [seed, art.alt])

  if (art.image) {
    return (
      <img
        src={asset(art.image)}
        alt={decorative ? '' : art.alt}
        className={cn('h-full w-full object-cover', className)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    )
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={`xMid${align === 'top' ? 'YMin' : align === 'bottom' ? 'YMax' : 'YMid'} slice`}
      className={cn('h-full w-full', className)}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : art.alt}
      aria-hidden={decorative || undefined}
    >
      <Scene scene={art.scene} tone={art.tone} seed={seedNum} uid={uid} />
    </svg>
  )
})
