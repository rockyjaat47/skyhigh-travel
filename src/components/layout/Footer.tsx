import { ArrowUp, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { company } from '../../config/site'
import { useContent } from '../../hooks/useContent'
import { track } from '../../services/analytics'
import { whatsappLink } from '../../services/enquiry'
import { LogoMark, Logo } from '../ui/Logo'

export function Footer() {
  const { services, contact, company: copy } = useContent()
  const year = new Date().getFullYear()
  const hasContact = contact.email || contact.phone || contact.whatsapp || contact.address

  return (
    <footer className="relative overflow-hidden bg-midnight text-white">
      <div className="container-x pt-20 pb-10 sm:pt-28">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo tone="white" />
            <p className="mt-8 max-w-sm font-display text-2xl leading-tight tracking-tight text-white/90 sm:text-3xl">{copy.tagline}</p>
            <div className="mt-8 space-y-3 text-sm text-white/70">
              {contact.email && (
                <a href={`mailto:${contact.email}`} onClick={() => track('contact_click', { channel: 'email', from: 'footer' })} className="flex items-center gap-3 hover:text-white">
                  <Mail className="h-4 w-4" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} onClick={() => track('contact_click', { channel: 'phone', from: 'footer' })} className="flex items-center gap-3 hover:text-white">
                  <Phone className="h-4 w-4" /> {contact.phone}
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={whatsappLink(contact.whatsapp, 'Hello Skyhigh, I would like to plan a journey.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('whatsapp_click', { from: 'footer' })}
                  className="flex items-center gap-3 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {contact.address && (
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {contact.address}
                </p>
              )}
              {!hasContact && <p className="text-white/50">Direct contact details will be published soon. Use the enquiry form to reach us.</p>}
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="label-mono text-white/40">Company</p>
              <ul className="mt-5 space-y-3 text-sm text-white/80">
                {[
                  ['About', '/about'],
                  ['Destinations', '/destinations'],
                  ['Packages', '/packages'],
                  ['Contact', '/contact'],
                ].map(([l, to]) => (
                  <li key={to}>
                    <Link className="hover:text-white" to={to}>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-mono text-white/40">Services</p>
              <ul className="mt-5 space-y-3 text-sm text-white/80">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link className="hover:text-white" to={`/services/${s.slug}`}>
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-mono text-white/40">Legal</p>
              <ul className="mt-5 space-y-3 text-sm text-white/80">
                <li>
                  <Link className="hover:text-white" to="/privacy-policy">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-white" to="/terms-and-conditions">
                    Terms & conditions
                  </Link>
                </li>
              </ul>
              {contact.social.length > 0 && (
                <>
                  <p className="label-mono mt-10 text-white/40">Social</p>
                  <ul className="mt-5 space-y-3 text-sm text-white/80">
                    {contact.social.map((s) => (
                      <li key={s.url}>
                        <a className="hover:text-white" href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Oversized wordmark */}
        <div className="relative mt-20 select-none" aria-hidden="true">
          <div className="flex items-end gap-[2vw]">
            <LogoMark tone="white" className="h-[13vw] w-[13vw] opacity-90" />
            <span className="font-display text-[19vw] font-bold leading-[0.78] tracking-[-0.04em] text-white">SKYHIGH</span>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>
              © {year} {company.legalName}. All rights reserved.
            </p>
            <p className="label-mono !text-[0.62rem]">CIN: {company.cin}</p>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="label-mono inline-flex items-center gap-2 self-start text-white/70 hover:text-white md:self-auto"
          >
            Back to top <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  )
}
