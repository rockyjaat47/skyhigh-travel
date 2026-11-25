import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// VITE_BASE controls the public path. GitHub Pages project sites live at
// https://<user>.github.io/skyhigh-travel/ so CI sets VITE_BASE=/skyhigh-travel/.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE || '/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'skyhigh-site-url',
        transformIndexHtml: (html: string) => html.replaceAll('%SITE_URL%', (env.VITE_SITE_URL || 'https://example.github.io/skyhigh-travel').replace(/\/$/, '')),
      },
    ],
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/three/')) return 'three'
            if (id.includes('@react-three')) return 'r3f'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('gsap') || id.includes('lenis')) return 'motion'
            return undefined
          },
        },
      },
    },
  }
})
