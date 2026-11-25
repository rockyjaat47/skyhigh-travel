import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { sceneState } from '../../animations/gsap'
import { Aircraft } from './Aircraft'
import { CloudField, SkyDome } from './Atmosphere'

const HEADING = -2.5 // yaw: nose toward camera-right (up-and-right, like the brand mark)
const FLOW = new THREE.Vector3(Math.sin(HEADING), 0, Math.cos(HEADING)).negate().normalize()

const DECK_BOX: [[number, number], [number, number], [number, number]] = [[-90, 90], [-16, -9], [-120, 30]]
const MID_BOX: [[number, number], [number, number], [number, number]] = [[-60, 60], [-6, 5], [-90, 10]]
const NEAR_BOX: [[number, number], [number, number], [number, number]] = [[-34, 34], [-7, -2], [6, 26]]

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function Rig({ mobile, reduced, onReady }: { mobile: boolean; reduced: boolean; onReady?: () => void }) {
  const plane = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const start = useRef<number | null>(null)
  const look = useMemo(() => new THREE.Vector3(), [])
  const smoothPointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    onReady?.()
  }, [onReady])

  // composition per breakpoint
  const base = mobile
    ? { planePos: new THREE.Vector3(0.6, 7.2, -4), cam: new THREE.Vector3(0, 0.8, 34), scale: 0.8 }
    : { planePos: new THREE.Vector3(5.8, 2.6, 0), cam: new THREE.Vector3(0, 0.6, 33), scale: 1 }

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (start.current === null) start.current = t
    const intro = reduced ? 1 : Math.min(1, (t - start.current) / 3.6)
    const e = easeOutCubic(intro)
    if (intro >= 1) sceneState.introDone = true

    const p = sceneState.heroProgress // 0 → 1 while hero scrolls away
    const sp = smoothPointer.current
    sp.x += (sceneState.pointerX - sp.x) * Math.min(1, dt * 2.5)
    sp.y += (sceneState.pointerY - sp.y) * Math.min(1, dt * 2.5)

    // Camera: pushes out of the cloud bank, then drifts with the pointer; scroll tilts up.
    const camZ = THREE.MathUtils.lerp(base.cam.z + 16, base.cam.z, e) + p * 4
    camera.position.set(base.cam.x + sp.x * 0.9, base.cam.y + sp.y * 0.5 + (1 - e) * -1.5 + p * 1.5, camZ)
    look.set(base.planePos.x * 0.35 + sp.x * 0.3, base.planePos.y * 0.3 + p * 4, 0)
    camera.lookAt(look)

    const g = plane.current
    if (!g) return
    // Aircraft: enters from behind-left, settles, then climbs away on scroll.
    const enter = 1 - e
    const bob = reduced ? 0 : Math.sin(t * 0.7) * 0.18
    g.position.set(
      base.planePos.x - enter * 14 + p * 9,
      base.planePos.y + bob - enter * 3 + p * 7,
      base.planePos.z - enter * 24 - p * 22,
    )
    g.rotation.set(
      -0.1 - p * 0.25 + (reduced ? 0 : Math.sin(t * 0.5) * 0.02), // pitch (nose up = negative about X after yaw)
      HEADING + sp.x * 0.06,
      (reduced ? 0 : Math.sin(t * 0.45) * 0.06) - enter * 0.35 + p * 0.3 - sp.x * 0.05, // roll
      'YXZ',
    )
    g.scale.setScalar(base.scale)
  })

  return <Aircraft ref={plane} detail={mobile ? 'low' : 'high'} />
}

export default function HeroScene({ active, mobile, reduced }: { active: boolean; mobile: boolean; reduced: boolean }) {
  const [dpr, setDpr] = useState(mobile ? 1.25 : 1.6)
  const sunDir = useMemo(() => new THREE.Vector3(0.75, 0.1, -0.65), [])

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: mobile ? 42 : 30, near: 0.1, far: 900, position: [0, 0.4, 33] }}
      gl={{ antialias: !mobile, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.25 : 1.6)} />
      <fog attach="fog" args={['#e7d9cf', 40, 170]} />
      <SkyDome sunDir={sunDir} />

      <hemisphereLight args={['#d6e8ff', '#f0c9a8', 0.9]} />
      <directionalLight position={[30, 12, -20]} intensity={2.6} color="#ffe2c2" />
      <directionalLight position={[-20, 8, 20]} intensity={0.7} color="#9cc4ff" />

      {/* Local studio-style environment for reflections — no HDR download */}
      <Environment resolution={mobile ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#ffe0c0" position={[20, 6, -15]} scale={[30, 8, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#8fbfff" position={[0, 20, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#f2d4be" position={[0, -12, 0]} rotation-x={-Math.PI / 2} scale={[60, 60, 1]} />
        <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[-10, 4, 12]} scale={6} />
      </Environment>

      <CloudField count={mobile ? 40 : 90} box={DECK_BOX} scale={[18, 34]} flow={FLOW} speed={4.5} opacity={0.95} tint="#fff7f0" seed={3} />
      <CloudField count={mobile ? 14 : 30} box={MID_BOX} scale={[8, 18]} flow={FLOW} speed={6.5} opacity={0.6} seed={7} />
      {!reduced && <CloudField count={mobile ? 6 : 14} box={NEAR_BOX} scale={[6, 12]} flow={FLOW} speed={9} opacity={0.32} seed={13} />}

      <Rig mobile={mobile} reduced={reduced} />
    </Canvas>
  )
}
