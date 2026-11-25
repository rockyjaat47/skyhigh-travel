import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { track } from '../../services/analytics'
import { whatsappLink } from '../../services/enquiry'
import type { EnquiryService } from '../../types/content'
import { SectionLabel, SplitHeading } from '../ui/Motion'
import { EnquiryForm } from './EnquiryForm'

/** Scene 05 — Arrive. Conversion-focused enquiry. */
export function PlanJourney({ defaultService, defaultDestination, index = '05' }: { defaultService?: EnquiryService; defaultDestination?: string; index?: string }) {
  const { contact } = useContent()
  return (
    <section id="plan" aria-labelledby="plan-title" className="relative scroll-mt-24 bg-cloud py-28 sm:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index={index}>Arrive</SectionLabel>
            <SplitHeading as="h2" lines={['Plan your', 'journey.']} className="mt-6 text-display-lg text-navy" />
            <p className="mt-6 max-w-sm text-muted">
              Share a few details and we’ll shape a plan around you. It takes about two minutes — no payment, no obligation.
            </p>
            {(contact.whatsapp || contact.email || contact.phone) && (
              <div className="mt-10 space-y-3 text-sm">
                <p className="label-mono text-muted">Prefer to talk?</p>
                {contact.whatsapp && (
                  <a className="flex items-center gap-3 font-semibold text-navy hover:text-orange" target="_blank" rel="noopener noreferrer" href={whatsappLink(contact.whatsapp, 'Hello Skyhigh, I would like to plan a journey.')} onClick={() => track('whatsapp_click', { from: 'plan_section' })}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp us
                  </a>
                )}
                {contact.phone && (
                  <a className="flex items-center gap-3 font-semibold text-navy hover:text-orange" href={`tel:${contact.phone.replace(/\s/g, '')}`} onClick={() => track('contact_click', { channel: 'phone', from: 'plan_section' })}>
                    <Phone className="h-4 w-4" /> {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a className="flex items-center gap-3 font-semibold text-navy hover:text-orange" href={`mailto:${contact.email}`} onClick={() => track('contact_click', { channel: 'email', from: 'plan_section' })}>
                    <Mail className="h-4 w-4" /> {contact.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-[0_40px_80px_-50px_rgba(7,29,54,0.35)] sm:p-10 lg:col-span-8">
          <h3 id="plan-title" className="sr-only">
            Enquiry form
          </h3>
          <EnquiryForm defaultService={defaultService} defaultDestination={defaultDestination} />
        </div>
      </div>
    </section>
  )
}
