import { Component, type ReactNode } from 'react'

/** Catches WebGL/context/shader failures and swaps in a static fallback. */
export class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.warn('[webgl] falling back to static artwork:', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
