import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { LogoMark } from '../components/ui/Logo'
import { Seo } from '../components/ui/Seo'

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" noindex />
      <section className="relative flex min-h-svh items-center overflow-hidden bg-cloud pt-28">
        <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 text-navy opacity-40" />
        <motion.div
          aria-hidden="true"
          className="absolute right-[-10%] top-1/4 w-[60vw] max-w-3xl opacity-[0.06]"
          initial={{ x: -80, y: 60, rotate: -6 }}
          animate={{ x: 0, y: 0, rotate: 0 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        >
          <LogoMark tone="dark" className="h-full w-full" />
        </motion.div>
        <div className="container-x relative">
          <p className="label-mono text-muted">Error 404 — Off course</p>
          <h1 className="mt-6 text-display-xl text-navy">
            This route
            <br />
            isn’t on our map.
          </h1>
          <p className="mt-8 max-w-md text-lg text-muted">The page you’re looking for may have moved, or the link might be outdated. Let’s get you back on track.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button to="/" variant="dark">
              Back to home
            </Button>
            <Button to="/destinations" variant="outline">
              Explore destinations
            </Button>
          </div>
          <nav aria-label="Popular pages" className="mt-16 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-navy">
            {[
              ['Services', '/services'],
              ['Packages', '/packages'],
              ['About', '/about'],
              ['Contact', '/contact'],
            ].map(([l, to]) => (
              <Link key={to} to={to} className="underline-offset-4 hover:underline">
                {l}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  )
}
