import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Mail, MapPin, MessageCircle, Phone, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EnquiryForm } from '../components/sections/EnquiryForm'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Reveal, SectionLabel, SplitHeading } from '../components/ui/Motion'
import { Seo } from '../components/ui/Seo'
import { company } from '../config/site'
import { useContent } from '../hooks/useContent'
import { track } from '../services/analytics'
import { enquiryServices } from '../services/enquirySchema'
import { whatsappLink } from '../services/enquiry'
import type { EnquiryService } from '../types/content'
import { cn } from '../utils/cn'

const faqs = [
  { q: 'Is there any charge for an enquiry?', a: 'No. Enquiries are free and carry no obligation. We never ask for payment details through this website.' },
  { q: 'How soon will I hear back?', a: 'We aim to respond within one business day during working hours. Complex itineraries or freight requests may need a little longer to price accurately.' },
  { q: 'Are the services already operational?', a: 'Skyhigh is a newly incorporated company. Services are marked as “proposed” until they are confirmed and live — we’ll always tell you clearly what we can deliver today.' },
  { q: 'Can you plan trips that aren’t listed?', a: 'Absolutely. Destinations and packages on this site are illustrative. Tell us where you want to go and we will build the plan around you.' },
  { q: 'What information should I avoid sharing?', a: 'Please don’t send passport numbers, card details or other sensitive identifiers through the form. If documents are needed, we’ll arrange a secure method.' },
]

export default function Contact() {
  const { contact } = useContent()
  const [params] = useSearchParams()
  const raw = params.get('service') as EnquiryService | null
  const service = raw && enquiryServices.some((s) => s.id === raw) ? raw : undefined
  const [open, setOpen] = useState<number | null>(0)

  const channels = [
    contact.whatsapp && { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: whatsappLink(contact.whatsapp, 'Hello Skyhigh, I would like to plan a journey.'), ev: () => track('whatsapp_click', { from: 'contact_page' }), external: true },
    contact.phone && { icon: Phone, label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}`, ev: () => track('contact_click', { channel: 'phone', from: 'contact_page' }) },
    contact.email && { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}`, ev: () => track('contact_click', { channel: 'email', from: 'contact_page' }) },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string; ev: () => void; external?: boolean }[]

  return (
    <>
      <Seo title="Contact & Plan Your Journey" description="Plan a trip, transfer, shipment or corporate travel with Skyhigh. Send an enquiry in two minutes." breadcrumbs={[{ name: 'Contact', path: '/contact' }]} />

      <section className="relative overflow-hidden bg-cloud pb-16 pt-36 sm:pt-44">
        <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 text-navy opacity-40 [mask-image:radial-gradient(70%_60%_at_80%_20%,#000,transparent)]" />
        <div className="container-x relative">
          <Breadcrumbs items={[{ name: 'Contact' }]} />
          <SplitHeading as="h1" immediate lines={['Let’s plan', 'what’s next.']} className="mt-8 text-display-xl text-navy" />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c) => (
              <a key={c.label} href={c.href} onClick={c.ev} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined} className="group rounded-[1.4rem] border border-line bg-white p-6 transition-colors hover:border-navy">
                <c.icon className="h-5 w-5 text-orange" />
                <p className="label-mono mt-8 text-muted">{c.label}</p>
                <p className="mt-1 break-all font-display text-lg font-medium text-navy">{c.value}</p>
              </a>
            ))}
            <div className="rounded-[1.4rem] border border-line bg-white p-6">
              <Clock className="h-5 w-5 text-orange" />
              <p className="label-mono mt-8 text-muted">Hours</p>
              <p className="mt-1 font-display text-lg font-medium text-navy">{contact.hours}</p>
            </div>
            <div className="rounded-[1.4rem] border border-line bg-white p-6">
              <MapPin className="h-5 w-5 text-orange" />
              <p className="label-mono mt-8 text-muted">Registered company</p>
              <p className="mt-1 font-display text-lg font-medium leading-snug text-navy">{contact.address || 'Uttar Pradesh, India'}</p>
              <p className="label-mono mt-2 !text-[0.6rem] text-muted">CIN {company.cin}</p>
            </div>
            {channels.length === 0 && (
              <div className="rounded-[1.4rem] border border-dashed border-line p-6 sm:col-span-2">
                <p className="label-mono text-muted">Direct channels</p>
                <p className="mt-2 text-navy">Phone, email and WhatsApp details will be published here soon. In the meantime, the enquiry form below is the best way to reach us.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="plan" className="scroll-mt-24 bg-cloud pb-28">
        <div className="container-x">
          <div className="rounded-[2rem] border border-line bg-white p-6 shadow-[0_40px_80px_-50px_rgba(7,29,54,0.35)] sm:p-12">
            <SectionLabel index="05">Arrive — Plan your journey</SectionLabel>
            <div className="mt-8">
              <EnquiryForm defaultService={service} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel>FAQ</SectionLabel>
            <SplitHeading lines={['Good to', 'know.']} className="mt-6 text-display-md text-navy" />
          </div>
          <div className="lg:col-span-8">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.04} className="border-t border-line last:border-b">
                <h3>
                  <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left">
                    <span className="font-display text-xl font-medium text-navy sm:text-2xl">{f.q}</span>
                    <Plus className={cn('h-5 w-5 shrink-0 transition-transform duration-500', open === i && 'rotate-45')} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <p className="max-w-2xl pb-6 text-muted">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
