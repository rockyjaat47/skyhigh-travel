import { AlertTriangle } from 'lucide-react'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Seo } from '../components/ui/Seo'
import { company } from '../config/site'
import { useContent } from '../hooks/useContent'

type Section = { h: string; p: string[] }

const LAST_UPDATED = '25 November 2026'

const privacy = (email: string): Section[] => [
  {
    h: 'Who we are',
    p: [`This website is operated by ${company.legalName} (CIN ${company.cin}), referred to as “Skyhigh”, “we” or “us”.`],
  },
  {
    h: 'Information we collect',
    p: [
      'When you submit an enquiry we collect the details you choose to share: your name, email address, phone number, the service you are interested in, travel or shipment details (such as locations, dates, number of travellers, goods type and approximate weight), an optional budget range and any notes you add.',
      'We do not collect payment card details, passport numbers or other government identifiers through this website. Please do not include them in your message.',
    ],
  },
  {
    h: 'How we use your information',
    p: ['We use enquiry information only to respond to you, prepare proposals or quotations, and provide the services you request. We do not sell your personal information.'],
  },
  {
    h: 'Legal basis and consent',
    p: ['We process enquiry data on the basis of the consent you give when submitting the form, in line with applicable Indian law including the Digital Personal Data Protection Act, 2023. You may withdraw consent at any time by contacting us.'],
  },
  {
    h: 'Cookies and analytics',
    p: ['Essential storage is used to remember preferences such as your cookie choice. Optional analytics and advertising tools (such as Google Analytics, Google Tag Manager or Meta Pixel) are only loaded if they are enabled by us and you have accepted analytics cookies. You can change your choice by clearing site data in your browser.'],
  },
  {
    h: 'Storage and security',
    p: ['Enquiries may be stored with our infrastructure provider using access controls restricted to authorised staff. We retain enquiry information only as long as necessary for the purposes above or as required by law.'],
  },
  {
    h: 'Your rights',
    p: [`You may request access to, correction of, or deletion of your personal data${email ? ` by writing to ${email}` : ' by contacting us through the enquiry form'}.`],
  },
  { h: 'Changes', p: ['We may update this policy from time to time. The latest version will always be available on this page.'] },
]

const terms = (): Section[] => [
  { h: 'About these terms', p: [`These terms govern your use of this website operated by ${company.legalName} (CIN ${company.cin}). By using the website you agree to them.`] },
  {
    h: 'Information on this website',
    p: [
      'Services described on this website are proposed offerings unless explicitly marked as available. Destinations and packages are illustrative examples intended to show how journeys can be structured; they are not offers capable of acceptance.',
      'Itineraries, availability, inclusions and prices are confirmed only in a written quotation or booking confirmation.',
    ],
  },
  { h: 'Enquiries', p: ['Submitting an enquiry does not create a booking or contract. We will respond with options and, where relevant, a quotation that sets out the applicable terms.'] },
  { h: 'Third-party providers', p: ['Where we arrange flights, rail, accommodation, transport or other services provided by third parties, those services are subject to the provider’s own terms, fares and policies.'] },
  { h: 'Acceptable use', p: ['You agree not to misuse the website, submit false information, attempt to gain unauthorised access, or interfere with its operation.'] },
  { h: 'Intellectual property', p: ['The Skyhigh name, logo, design and content of this website belong to the company and may not be reused without permission.'] },
  { h: 'Liability', p: ['The website is provided on an “as is” basis. To the extent permitted by law, we are not liable for losses arising from reliance on illustrative content on this website.'] },
  { h: 'Governing law', p: ['These terms are governed by the laws of India. Courts in Uttar Pradesh shall have jurisdiction, subject to applicable law.'] },
]

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const { contact } = useContent()
  const isPrivacy = kind === 'privacy'
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'
  const sections = isPrivacy ? privacy(contact.email) : terms()
  const path = isPrivacy ? '/privacy-policy' : '/terms-and-conditions'

  return (
    <>
      <Seo title={title} description={`${title} for the Skyhigh Travel Bird Technology website.`} breadcrumbs={[{ name: title, path }]} />
      <article className="bg-cloud pb-28 pt-36 sm:pt-44">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <header className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Breadcrumbs items={[{ name: title }]} />
              <h1 className="mt-8 text-display-md text-navy">{title}</h1>
              <p className="label-mono mt-6 text-muted">Last updated · {LAST_UPDATED}</p>
              <div role="note" className="mt-8 flex gap-3 rounded-2xl border border-orange/30 bg-orange/5 p-4 text-sm text-navy">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                <p>
                  <strong>Draft for business review.</strong> This document is a working draft and must be reviewed by the company and its legal advisers before publication.
                </p>
              </div>
              <nav aria-label="On this page" className="mt-8 hidden lg:block">
                <ol className="space-y-2 text-sm text-muted">
                  {sections.map((s, i) => (
                    <li key={s.h}>
                      <a href={`#s-${i}`} className="hover:text-navy">
                        {String(i + 1).padStart(2, '0')} · {s.h}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </header>
          <div className="space-y-12 lg:col-span-7 lg:col-start-6">
            {sections.map((s, i) => (
              <section key={s.h} id={`s-${i}`} className="scroll-mt-28 border-t border-line pt-8">
                <h2 className="flex gap-4 text-2xl font-medium text-navy">
                  <span className="font-display text-sm text-orange">{String(i + 1).padStart(2, '0')}</span>
                  {s.h}
                </h2>
                {s.p.map((p, j) => (
                  <p key={j} className="mt-4 leading-relaxed text-muted">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </article>
    </>
  )
}
