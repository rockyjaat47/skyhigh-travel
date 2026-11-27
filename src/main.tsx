import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/manrope'
import '@fontsource/jetbrains-mono/500.css'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ContentProvider } from './hooks/useContent'
import { CustomerProvider } from './hooks/useCustomer'
import { initAnalytics } from './services/analytics'

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <ContentProvider>
        <CustomerProvider>
          <App />
        </CustomerProvider>
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
)
