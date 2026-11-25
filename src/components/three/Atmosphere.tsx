import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { rng } from '../../utils/cn'
import { makeCloudTexture } from './textures'

/** Gradient sky dome with a warm sun glow — cinematic golden hour above the clouds. */
export function SkyDome({ sunDir = new THREE.Vector3(0.6, 0.12, -0.8) }: { sunDir?: THREE.Vector3 }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color('#0e3a6e') },
          uMid: { value: new THREE.Color('#4f8fc9') },
          uHorizon: { value: new THREE.Color('#f6d2b4') },
          uBelow: { value: new THREE.Color('#c9d9ea') },
          uSun: { value: new THREE.Color('#ffb46b') },
          uSunDir: { value: sunDir.clone().normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop, uMid, uHorizon, uBelow, uSun, uSunDir;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.28, h));
            col = mix(col, uTop, smoothstep(0.25, 0.85, h));
            col = mix(col, uBelow, smoothstep(0.0, -0.25, h));
            float s = max(dot(normalize(vDir), uSunDir), 0.0);
            col += uSun * (pow(s, 6.0) * 0.55 + pow(s, 60.0) * 0.6);
            // subtle dithering to avoid banding
            float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
            col += (n - 0.5) / 255.0;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [sunDir],
  )
  useEffect(() => () => mat.dispose(), [mat])
  return (
    <mesh material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  )
}

interface CloudFieldProps {
  count: number
  /** World-space box the clouds live in: [minX, maxX], [minY, maxY], [minZ, maxZ] */
  box: [[number, number], [number, number], [number, number]]
  scale: [number, number]
  flow: THREE.Vector3
  speed: number
  opacity?: number
  tint?: string
  seed?: number
}

/**
 * Streaming sprite clouds. Sprites always face the camera, so layered soft
 * textures read as volume. Moving the clouds (not the plane) sells the flight.
 */
export function CloudField({ count, box, scale, flow, speed, opacity = 0.85, tint = '#ffffff', seed = 1 }: CloudFieldProps) {
  const group = useRef<THREE.Group>(null)
  const { textures, sprites } = useMemo(() => {
    const textures = [makeCloudTexture(seed * 11 + 1), makeCloudTexture(seed * 11 + 2), makeCloudTexture(seed * 11 + 3)]
    const r = rng(seed)
    const sprites = Array.from({ length: count }, (_, i) => {
      const s = scale[0] + r() * (scale[1] - scale[0])
      const mat = new THREE.SpriteMaterial({
        map: textures[i % 3],
        transparent: true,
        depthWrite: false,
        opacity: opacity * (0.6 + r() * 0.4),
        color: new THREE.Color(tint).lerp(new THREE.Color('#ffe9d6'), r() * 0.35),
        fog: true,
      })
      const sp = new THREE.Sprite(mat)
      sp.position.set(
        box[0][0] + r() * (box[0][1] - box[0][0]),
        box[1][0] + r() * (box[1][1] - box[1][0]),
        box[2][0] + r() * (box[2][1] - box[2][0]),
      )
      sp.scale.set(s * (1.4 + r() * 0.8), s, 1)
      sp.material.rotation = (r() - 0.5) * 0.3
      return sp
    })
    return { textures, sprites }
  }, [count, box, scale, opacity, tint, seed])

  useEffect(
    () => () => {
      sprites.forEach((s) => s.material.dispose())
      textures.forEach((t) => t.dispose())
    },
    [sprites, textures],
  )

  const step = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05) * speed
    step.copy(flow).multiplyScalar(d)
    for (const s of sprites) {
      s.position.add(step)
      // wrap around the box on each axis
      for (let a = 0; a < 3; a++) {
        const [min, max] = box[a]
        const v = s.position.getComponent(a)
        if (v < min) s.position.setComponent(a, max - (min - v))
        else if (v > max) s.position.setComponent(a, min + (v - max))
      }
    }
  })

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <primitive key={i} object={s} />
      ))}
    </group>
  )
}
