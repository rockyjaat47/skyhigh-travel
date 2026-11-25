import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import land110 from 'world-atlas/land-110m.json'

export interface GlobeMarker {
  id: string
  label: string
  sub?: string
  lat: number
  lon: number
  hub?: boolean
}

const R = 2

export function latLonToVec(lat: number, lon: number, r = R) {
  const phi = (lat * Math.PI) / 180
  const lam = (lon * Math.PI) / 180
  return new THREE.Vector3(r * Math.cos(phi) * Math.cos(lam), r * Math.sin(phi), -r * Math.cos(phi) * Math.sin(lam))
}

/** Rasterise Natural Earth land polygons → sample dots on a Fibonacci sphere. */
function buildLandDots(count: number) {
  const W = 1024
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const topo = land110 as unknown as Topology<{ land: GeometryCollection }>
  const landGeo = feature(topo, topo.objects.land)
  const projection = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2])
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  geoPath(projection, ctx)(landGeo)
  ctx.fill()
  const data = ctx.getImageData(0, 0, W, H).data

  const positions: number[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    const x = Math.cos(th) * rad
    const z = Math.sin(th) * rad
    const lat = Math.asin(y) * (180 / Math.PI)
    const lon = Math.atan2(-z, x) * (180 / Math.PI)
    const px = Math.floor(((lon + 180) / 360) * W)
    const py = Math.floor(((90 - lat) / 180) * H)
    if (data[(py * W + px) * 4] > 128) positions.push(x * R, y * R, z * R)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geo
}

const dotMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uSize: { value: 3.2 * Math.min(window.devicePixelRatio, 2) }, uColor: { value: new THREE.Color('#bfe7ff') } },
    vertexShader: /* glsl */ `
      uniform float uSize;
      varying float vFacing;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normalize(position));
        vFacing = dot(n, normalize(-mv.xyz));
        gl_PointSize = uSize * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vFacing;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (dot(c, c) > 0.25) discard;
        float a = smoothstep(-0.1, 0.45, vFacing);
        gl_FragColor = vec4(uColor, 0.9 * a);
      }`,
  })

const atmosphereMaterial = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color('#1aa6ff') } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
      void main() {
        // back faces: dot ≈ -0.53 at the globe limb → 0 at the outer edge
        float i = pow(clamp(-dot(vN, vV) / 0.55, 0.0, 1.0), 3.0);
        gl_FragColor = vec4(uColor, i * 0.85);
      }`,
  })

/** Route arc as a thin tube with a travelling light pulse. */
function Arc({ from, to, delay, color }: { from: THREE.Vector3; to: THREE.Vector3; delay: number; color: string }) {
  const { geo, mat } = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5)
    const dist = from.distanceTo(to)
    mid.normalize().multiplyScalar(R + dist * 0.38)
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to)
    const geo = new THREE.TubeGeometry(curve, 64, 0.006, 6, false)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uDelay: { value: delay }, uColor: { value: new THREE.Color(color) } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uDelay; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          float head = fract((uTime + uDelay) * 0.22) * 1.6 - 0.2;
          float d = head - vUv.x;
          float trail = smoothstep(0.35, 0.0, d) * step(0.0, d);
          float base = 0.14;
          gl_FragColor = vec4(uColor, base + trail * 0.95);
        }`,
    })
    return { geo, mat }
  }, [from, to, delay, color])
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat])
  useFrame(({ clock }) => (mat.uniforms.uTime.value = clock.elapsedTime))
  return <mesh geometry={geo} material={mat} />
}

function Marker({ m, onSelect }: { m: GlobeMarker; onSelect?: (id: string) => void }) {
  const [hover, setHover] = useState(false)
  const ring = useRef<THREE.Mesh>(null)
  const pos = useMemo(() => latLonToVec(m.lat, m.lon, R * 1.005), [m.lat, m.lon])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos])
  useFrame(({ clock }) => {
    if (!ring.current) return
    const t = (clock.elapsedTime * 0.8 + m.lat * 0.01) % 1
    ring.current.scale.setScalar(1 + t * 1.8)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.7
  })
  const color = m.hub ? '#ff7900' : '#ffffff'
  return (
    <group position={pos} quaternion={quat}>
      <mesh
        onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = 'pointer'))}
        onPointerOut={() => (setHover(false), (document.body.style.cursor = ''))}
        onClick={(e) => (e.stopPropagation(), onSelect?.(m.id))}
      >
        <circleGeometry args={[m.hub ? 0.035 : 0.026, 20]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.034, 0.042, 32]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {hover && (
        <Html position={[0, 0, 0.05]} center={false} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="ml-3 -mt-3 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-navy shadow-xl">
            <p className="font-display text-sm font-semibold leading-none">{m.label}</p>
            {m.sub && <p className="label-mono mt-1 !text-[0.58rem] text-muted">{m.sub}</p>}
          </div>
        </Html>
      )}
    </group>
  )
}

function Globe({ markers, routes, mobile, onSelect }: { markers: GlobeMarker[]; routes: [string, string][]; mobile: boolean; onSelect?: (id: string) => void }) {
  const dots = useMemo(() => buildLandDots(mobile ? 9000 : 16000), [mobile])
  const dotMat = useMemo(dotMaterial, [])
  const atmoMat = useMemo(atmosphereMaterial, [])
  useEffect(() => () => (dots.dispose(), dotMat.dispose(), atmoMat.dispose()), [dots, dotMat, atmoMat])

  const byId = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers])
  const arcs = useMemo(
    () =>
      routes
        .map(([a, b], i) => {
          const A = byId.get(a)
          const B = byId.get(b)
          if (!A || !B) return null
          return { key: `${a}-${b}`, from: latLonToVec(A.lat, A.lon, R * 1.005), to: latLonToVec(B.lat, B.lon, R * 1.005), delay: i * 0.83 }
        })
        .filter(Boolean) as { key: string; from: THREE.Vector3; to: THREE.Vector3; delay: number }[],
    [routes, byId],
  )

  return (
    // rotate so India (≈78°E, 22°N) faces the camera
    <group rotation={[0.38, (-(90 + 78) * Math.PI) / 180, 0]}>
      <mesh>
        <sphereGeometry args={[R * 0.995, 64, 64]} />
        <meshStandardMaterial color="#0a2647" roughness={0.9} metalness={0.1} emissive="#061a33" emissiveIntensity={0.6} />
      </mesh>
      <points geometry={dots} material={dotMat} />
      <mesh material={atmoMat} scale={1.18}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>
      {arcs.map((a) => (
        <Arc key={a.key} from={a.from} to={a.to} delay={a.delay} color="#ffb067" />
      ))}
      {markers.map((m) => (
        <Marker key={m.id} m={m} onSelect={onSelect} />
      ))}
    </group>
  )
}

export default function GlobeScene({
  active,
  mobile,
  reduced,
  markers,
  routes,
  onSelect,
}: {
  active: boolean
  mobile: boolean
  reduced: boolean
  markers: GlobeMarker[]
  routes: [string, string][]
  onSelect?: (id: string) => void
}) {
  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 2]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 35, position: [0, 0, mobile ? 10.5 : 9.2], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#bfe2ff" />
      <Globe markers={markers} routes={routes} mobile={mobile} onSelect={onSelect} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        rotateSpeed={0.5}
        autoRotate={!reduced}
        autoRotateSpeed={0.35}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />
    </Canvas>
  )
}
