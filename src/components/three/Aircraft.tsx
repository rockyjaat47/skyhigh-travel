import { useFrame } from '@react-three/fiber'
import { forwardRef, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { makeFinTexture, makeFuselageTexture } from './textures'

/**
 * Procedural twin-engine commercial airliner (~12 units long, nose → −Z).
 * Built from a lathe fuselage, extruded swept wings/stabilisers, nacelles
 * and a painted livery — no external model download required.
 */

const LEN = 12
const HALF = LEN / 2

/** Fuselage radius along its length (t: 0 tail → 1 nose). */
function radiusAt(t: number) {
  const R = 0.72
  if (t > 0.86) {
    // ogive nose
    const k = (t - 0.86) / 0.14
    return R * Math.sqrt(Math.max(0, 1 - Math.pow(k, 2.1))) * (1 - 0.04 * k)
  }
  if (t < 0.26) {
    // tapering tail cone
    const k = 1 - t / 0.26
    return R * (1 - Math.pow(k, 1.7) * 0.9)
  }
  return R
}

function buildFuselage() {
  const pts: THREE.Vector2[] = []
  const N = 90
  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push(new THREE.Vector2(Math.max(0.001, radiusAt(t)), -HALF + t * LEN))
  }
  const geo = new THREE.LatheGeometry(pts, 72)
  geo.rotateX(-Math.PI / 2) // lathe +Y → −Z (nose forward)
  // upswept tail + slightly flattened, drooped nose
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i)
    let y = pos.getY(i)
    if (z > 2.2) y += Math.pow(z - 2.2, 1.6) * 0.075
    if (z < -4.9) y -= Math.pow(-z - 4.9, 2) * 0.06
    pos.setY(i, y)
  }
  geo.computeVertexNormals()
  return geo
}

function planform(points: [number, number][], depth: number) {
  const s = new THREE.Shape()
  points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)))
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.45, bevelSize: depth * 0.5, bevelSegments: 3, curveSegments: 4 })
  geo.rotateX(Math.PI / 2) // shape y → world z, depth → world −y
  geo.translate(0, depth / 2, 0)
  geo.computeVertexNormals()
  return geo
}

function mirrorX(geo: THREE.BufferGeometry) {
  const g = geo.clone()
  g.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1))
  // restore winding after the mirror
  const idx = g.index
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i)
      idx.setX(i, idx.getX(i + 2))
      idx.setX(i + 2, a)
    }
  } else {
    const p = g.attributes.position
    const n = g.attributes.normal
    const uv = g.attributes.uv
    for (let i = 0; i < p.count; i += 3) {
      for (const attr of [p, n, uv]) {
        if (!attr) continue
        for (let c = 0; c < attr.itemSize; c++) {
          const t = attr.getComponent(i, c)
          attr.setComponent(i, c, attr.getComponent(i + 2, c))
          attr.setComponent(i + 2, c, t)
        }
      }
    }
  }
  g.computeVertexNormals()
  return g
}

export interface AircraftProps {
  detail?: 'high' | 'low'
}

export const Aircraft = forwardRef<THREE.Group, AircraftProps>(function Aircraft({ detail = 'high' }, ref) {
  const strobe = useRef<THREE.Mesh>(null)
  const beacon = useRef<THREE.Mesh>(null)

  const parts = useMemo(() => {
    const fuselage = buildFuselage()
    // main wing — swept planform (x span, z chord; +z = aft)
    const wingR = planform(
      [
        [0.4, -1.05],
        [6.5, 1.95],
        [6.5, 2.5],
        [2.3, 1.55],
        [0.4, 1.75],
      ],
      0.13,
    )
    const wingL = mirrorX(wingR)
    const stabR = planform(
      [
        [0.15, 3.9],
        [2.45, 5.35],
        [2.45, 5.7],
        [0.15, 5.6],
      ],
      0.07,
    )
    const stabL = mirrorX(stabR)
    // winglet
    const wingletShape = new THREE.Shape()
    wingletShape.moveTo(0, 0)
    wingletShape.lineTo(0.55, 0.95)
    wingletShape.lineTo(0.85, 0.95)
    wingletShape.lineTo(0.62, 0)
    wingletShape.closePath()
    const winglet = new THREE.ExtrudeGeometry(wingletShape, { depth: 0.05, bevelEnabled: false })
    winglet.rotateY(-Math.PI / 2)
    // vertical fin (shape coords: x = z-position, y = height)
    const finShape = new THREE.Shape()
    finShape.moveTo(3.25, 0.45)
    finShape.lineTo(5.25, 3.05)
    finShape.lineTo(5.95, 3.05)
    finShape.lineTo(6.15, 0.55)
    finShape.closePath()
    const fin = new THREE.ExtrudeGeometry(finShape, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 })
    fin.rotateY(-Math.PI / 2)
    fin.translate(0.045, 0, 0)

    const nacelle = new THREE.CylinderGeometry(0.46, 0.38, 2.1, detail === 'high' ? 40 : 20, 1, true)
    nacelle.rotateX(Math.PI / 2)
    const intake = new THREE.CircleGeometry(0.43, detail === 'high' ? 40 : 20)
    const spinner = new THREE.ConeGeometry(0.13, 0.3, 20)
    spinner.rotateX(-Math.PI / 2)
    const pylon = new THREE.BoxGeometry(0.1, 0.45, 1.4)

    const fuselageTex = makeFuselageTexture()
    const finTex = makeFinTexture()
    // map fin shape-UVs (x 3.25→6.15, y 0.45→3.05) into 0..1
    finTex.repeat.set(1 / 2.9, 1 / 2.6)
    finTex.offset.set(-3.25 / 2.9, -0.45 / 2.6)
    finTex.wrapS = finTex.wrapT = THREE.ClampToEdgeWrapping

    const mats = {
      body: new THREE.MeshPhysicalMaterial({ map: fuselageTex, roughness: 0.32, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.12 }),
      wing: new THREE.MeshPhysicalMaterial({ color: '#d5dce5', roughness: 0.38, metalness: 0.55, clearcoat: 0.5 }),
      fin: new THREE.MeshPhysicalMaterial({ map: finTex, roughness: 0.3, metalness: 0.2, clearcoat: 1 }),
      nacelle: new THREE.MeshPhysicalMaterial({ color: '#eef1f5', roughness: 0.25, metalness: 0.3, clearcoat: 1, side: THREE.DoubleSide }),
      intake: new THREE.MeshStandardMaterial({ color: '#0d141f', roughness: 0.6, metalness: 0.6 }),
      spinner: new THREE.MeshStandardMaterial({ color: '#9aa6b4', roughness: 0.3, metalness: 0.9 }),
      lip: new THREE.MeshStandardMaterial({ color: '#b9c3cf', roughness: 0.2, metalness: 1 }),
      accent: new THREE.MeshStandardMaterial({ color: '#071D36', roughness: 0.35, metalness: 0.3 }),
    }

    return { fuselage, wingR, wingL, stabR, stabL, winglet, fin, nacelle, intake, spinner, pylon, mats, textures: [fuselageTex, finTex] }
  }, [detail])

  useEffect(
    () => () => {
      Object.values(parts).forEach((p) => {
        if (p instanceof THREE.BufferGeometry) p.dispose()
      })
      Object.values(parts.mats).forEach((m) => m.dispose())
      parts.textures.forEach((t) => t.dispose())
    },
    [parts],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (strobe.current) strobe.current.visible = t % 1.2 < 0.06
    if (beacon.current) (beacon.current.material as THREE.MeshBasicMaterial).opacity = t % 1.6 < 0.15 ? 1 : 0.15
  })

  const { mats } = parts
  const engineX = 2.35

  return (
    <group ref={ref} dispose={null}>
      <mesh geometry={parts.fuselage} material={mats.body} castShadow />
      {/* wings: low-mounted with dihedral */}
      <group position={[0, -0.42, -0.2]}>
        <mesh geometry={parts.wingR} material={mats.wing} rotation={[0, 0, 0.075]} />
        <mesh geometry={parts.wingL} material={mats.wing} rotation={[0, 0, -0.075]} />
        {/* wing-to-body fairing */}
        <mesh position={[0, -0.12, 0.45]} scale={[0.95, 0.42, 2.4]} material={mats.body}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        {/* winglets */}
        <mesh geometry={parts.winglet} material={mats.accent} position={[6.47, 0.47, 1.95]} rotation={[0, 0, -0.12]} />
        <mesh geometry={parts.winglet} material={mats.accent} position={[-6.42, 0.47, 1.95]} rotation={[0, 0, 0.12]} />
        {/* nav lights: red left, green right */}
        <mesh position={[-6.55, 0.5, 2.0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#ff2d2d" toneMapped={false} />
        </mesh>
        <mesh position={[6.55, 0.5, 2.0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#2dff7a" toneMapped={false} />
        </mesh>
        {/* engines */}
        {[engineX, -engineX].map((x) => (
          <group key={x} position={[x, -0.55 + Math.abs(x) * 0.075 * 0.1, -0.35]}>
            <mesh geometry={parts.pylon} material={mats.wing} position={[0, 0.42, 0.45]} />
            <mesh geometry={parts.nacelle} material={mats.nacelle} />
            <mesh geometry={parts.intake} material={mats.intake} position={[0, 0, -1.0]} rotation={[0, Math.PI, 0]} />
            <mesh geometry={parts.spinner} material={mats.spinner} position={[0, 0, -1.05]} />
            <mesh position={[0, 0, -1.05]} rotation={[Math.PI / 2, 0, 0]} material={mats.lip}>
              <torusGeometry args={[0.45, 0.035, 10, 40]} />
            </mesh>
            <mesh position={[0, 0, 1.08]} rotation={[Math.PI / 2, 0, 0]} material={mats.intake}>
              <cylinderGeometry args={[0.36, 0.22, 0.35, 24]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* tail */}
      <group position={[0, 0.32, 0]}>
        <mesh geometry={parts.stabR} material={mats.wing} rotation={[0, 0, 0.1]} />
        <mesh geometry={parts.stabL} material={mats.wing} rotation={[0, 0, -0.1]} />
      </group>
      <mesh geometry={parts.fin} material={mats.fin} position={[0, 0.25, 0]} />
      {/* beacon + tail strobe */}
      <mesh ref={beacon} position={[0, 0.74, -1.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ff3b30" transparent toneMapped={false} />
      </mesh>
      <mesh ref={strobe} position={[0, 0.95, 6.25]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
})
