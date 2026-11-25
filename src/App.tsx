import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import Home from './pages/Home'

// Route-based code splitting (home is eager for the fastest first paint)
const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'))
const Destinations = lazy(() => import('./pages/Destinations'))
const DestinationDetail = lazy(() => import('./pages/DestinationDetail'))
const Packages = lazy(() => import('./pages/Packages'))
const PackageDetail = lazy(() => import('./pages/PackageDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const Legal = lazy(() => import('./pages/Legal'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="grid min-h-svh place-items-center label-mono text-muted">Loading admin…</div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:slug" element={<ServiceDetail />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:slug" element={<DestinationDetail />} />
        <Route path="packages" element={<Packages />} />
        <Route path="packages/:slug" element={<PackageDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy-policy" element={<Legal kind="privacy" />} />
        <Route path="terms-and-conditions" element={<Legal kind="terms" />} />
        <Route path="404" element={<NotFound />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
