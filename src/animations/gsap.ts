import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)
gsap.defaults({ ease: 'expo.out', duration: 1.1 })

export const EASE = {
  out: 'expo.out',
  inOut: 'power3.inOut',
  soft: 'power2.out',
} as const

/** Shared mutable store read inside R3F frame loops (avoids React re-renders). */
export const sceneState = {
  heroProgress: 0, // 0 → 1 as the hero scrolls out
  introDone: false,
  pointerX: 0,
  pointerY: 0,
}

export { gsap, ScrollTrigger, useGSAP }
