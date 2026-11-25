import type { CompanyCopy, FaqItem, HomeCopy, LegalCopy, PagesCopy } from '../types/content'

/**
 * Default website copy. Every value here can be edited from
 * Admin → Website content; saved values override these defaults.
 * Image fields accept a bundled path ("images/goa.webp") or an uploaded URL.
 */

export const defaultCompany: CompanyCopy = {
  tagline: 'Your Journey, Our Responsibility – Taking You Higher!',
  about: [
    'Skyhigh Travel Bird Technology Private Limited is a modern, customer-focused company committed to providing reliable, convenient and innovative travel, transportation and tourism solutions.',
    'The company aims to make every journey comfortable, safe, affordable and memorable by combining technology, professional services and customer satisfaction.',
    'Skyhigh believes that travel is more than reaching a destination; it is about creating experiences, building connections and making every journey worthwhile.',
  ],
  mission:
    'To deliver dependable, affordable and technology-enabled travel and transportation solutions while maintaining high standards of customer service, safety and professionalism.',
  vision:
    'To become a trusted and recognized name in the travel and tourism industry by connecting people, places and opportunities through innovation and excellent service.',
  values: [
    { title: 'Customer satisfaction', text: 'Every decision starts with the traveller — listening first, then planning.' },
    { title: 'Honesty and transparency', text: 'Clear information, clear terms and no hidden surprises.' },
    { title: 'Safety and reliability', text: 'Dependable arrangements and careful choices at every stage.' },
    { title: 'Innovation and technology', text: 'Smart tools that make planning simpler and journeys smoother.' },
    { title: 'Professionalism', text: 'Courteous, responsive and accountable service.' },
    { title: 'Quality service', text: 'Attention to detail that turns a trip into an experience.' },
  ],
}

export const defaultHome: HomeCopy = {
  heroEyebrow: 'Travel. Transport. Technology.',
  heroTitle: ['The World Is', 'Closer Than Ever.'],
  heroText: 'Connecting people, places and possibilities through smarter travel and transportation solutions.',
  heroPrimaryCta: 'Explore our services',
  heroSecondaryCta: 'Plan your journey',
  heroImage: 'images/hero-plane.webp',
  introLabel: 'Who we are',
  introStatement:
    'Travel is more than reaching a destination. It is about creating experiences, building connections and making every journey worthwhile — and we combine technology with genuinely professional service to make that happen.',
  pillars: [
    { title: 'Travel', text: 'Tours, bookings and packages shaped around the way you want to see the world.' },
    { title: 'Transport', text: 'People and goods moved with the same care — from city transfers to freight.' },
    { title: 'Technology', text: 'Smart planning tools that make every step clearer, faster and more reliable.' },
  ],
  servicesTitle: ['Six ways we', 'move you forward.'],
  servicesText:
    'One partner for the whole journey — from the first idea to the last mile. Services marked “proposed” will be confirmed as they launch.',
  exploreTitle: ['Mountains, coasts,', 'cities & stories.'],
  exploreText: 'A glimpse of the places we love to plan for. Destinations shown are illustrative — every itinerary is tailored on request.',
  connectTitle: ['One network.', 'Every direction.'],
  connectText: 'Connecting people, places and opportunities. Drag the globe to explore the destinations we plan for — tap a marker to open it.',
  moveTitle: ['Transport & logistics,', 'handled with care.'],
  moveText: 'Beyond holidays, Skyhigh plans to coordinate the movement of people and goods — dependable, transparent and on schedule.',
  moveBanner: 'Every route planned. Every handover confirmed.',
  moveImage: 'images/move-trucks.webp',
  moveItems: [
    { title: 'Passenger transportation', text: 'Airport transfers, outstation trips and event fleets — vehicles matched to the group, drivers briefed on the plan.' },
    { title: 'Goods transportation', text: 'Parcels, cargo and commercial goods moved point to point with careful handling and clear updates.' },
    { title: 'Logistics coordination', text: 'Full and part truck loads, routing and scheduling handled through a single, accountable point of contact.' },
  ],
  valuesTitle: ['Principles', 'before promises.'],
  valuesText: 'We’re a new company, so we won’t dress up numbers we haven’t earned yet. Instead, here is what you can hold us to on every journey.',
  missionImage: 'images/mountains-night.webp',
  planTitle: ['Plan your', 'journey.'],
  planText: 'Share a few details and we’ll shape a plan around you. It takes about two minutes — no payment, no obligation.',
}

export const defaultPages: PagesCopy = {
  about: {
    title: ['Your journey,', 'our responsibility.'],
    intro: defaultCompany.about[0],
    note: '',
    image: 'images/hero-plane.webp',
    storyTitle: ['A new company,', 'built on an old', 'idea: care.'],
    gallery: ['images/ladakh-2.webp', 'images/dubai.webp', 'images/road-trip.webp'],
  },
  services: {
    title: ['Everything that', 'moves you.'],
    intro: 'Six connected services for travellers, teams and businesses — planned with care and coordinated end to end.',
    note: 'Services marked “proposed” are planned offerings. Availability, coverage and terms are confirmed as each service launches.',
    image: 'images/svc-booking.webp',
  },
  destinations: {
    title: ['Where will', 'you go next?'],
    intro: 'From Himalayan passes to tropical coastlines — a showcase of places we love to plan journeys around.',
    note: 'Illustrative destinations. Itineraries, availability and pricing are tailored on request.',
    image: 'images/bali-2.webp',
  },
  packages: {
    title: ['Journeys,', 'ready to shape.'],
    intro: 'Sample itineraries that show how we structure a trip. Every package is customised — dates, stays, pace and budget.',
    note: 'Sample itineraries for illustration. Prices are quoted on request; inclusions are confirmed at booking.',
    image: 'images/kerala-2.webp',
  },
  contact: {
    title: ['Let’s plan', 'what’s next.'],
    formTitle: 'Arrive — Plan your journey',
  },
}

export const defaultFaqs: FaqItem[] = [
  { q: 'Is there any charge for an enquiry?', a: 'No. Enquiries are free and carry no obligation. We never ask for payment details through this website.' },
  { q: 'How soon will I hear back?', a: 'We aim to respond within one business day during working hours. Complex itineraries or freight requests may need a little longer to price accurately.' },
  { q: 'Are the services already operational?', a: 'Skyhigh is a newly incorporated company. Services are marked as “proposed” until they are confirmed and live — we’ll always tell you clearly what we can deliver today.' },
  { q: 'Can you plan trips that aren’t listed?', a: 'Absolutely. Destinations and packages on this site are illustrative. Tell us where you want to go and we will build the plan around you.' },
  { q: 'What information should I avoid sharing?', a: 'Please don’t send passport numbers, card details or other sensitive identifiers through the form. If documents are needed, we’ll arrange a secure method.' },
]

const LEGAL_ENTITY = 'Skyhigh Travel Bird Technology Private Limited (CIN U79110UP2026PTC241002)'

export const defaultLegal: LegalCopy = {
  updated: '25 November 2026',
  draftNotice: true,
  privacy: [
    { h: 'Who we are', body: `This website is operated by ${LEGAL_ENTITY}, referred to as “Skyhigh”, “we” or “us”.` },
    {
      h: 'Information we collect',
      body: 'When you submit an enquiry we collect the details you choose to share: your name, email address, phone number, the service you are interested in, travel or shipment details (such as locations, dates, number of travellers, goods type and approximate weight), an optional budget range and any notes you add.\n\nWe do not collect payment card details, passport numbers or other government identifiers through this website. Please do not include them in your message.',
    },
    { h: 'How we use your information', body: 'We use enquiry information only to respond to you, prepare proposals or quotations, and provide the services you request. We do not sell your personal information.' },
    { h: 'Legal basis and consent', body: 'We process enquiry data on the basis of the consent you give when submitting the form, in line with applicable Indian law including the Digital Personal Data Protection Act, 2023. You may withdraw consent at any time by contacting us.' },
    { h: 'Cookies and analytics', body: 'Essential storage is used to remember preferences such as your cookie choice. Optional analytics and advertising tools (such as Google Analytics, Google Tag Manager or Meta Pixel) are only loaded if they are enabled by us and you have accepted analytics cookies.' },
    { h: 'Storage and security', body: 'Enquiries may be stored with our infrastructure provider using access controls restricted to authorised staff. We retain enquiry information only as long as necessary for the purposes above or as required by law.' },
    { h: 'Your rights', body: 'You may request access to, correction of, or deletion of your personal data by contacting us using the details on our contact page.' },
    { h: 'Changes', body: 'We may update this policy from time to time. The latest version will always be available on this page.' },
  ],
  terms: [
    { h: 'About these terms', body: `These terms govern your use of this website operated by ${LEGAL_ENTITY}. By using the website you agree to them.` },
    {
      h: 'Information on this website',
      body: 'Services described on this website are proposed offerings unless explicitly marked as available. Destinations and packages are illustrative examples intended to show how journeys can be structured; they are not offers capable of acceptance.\n\nItineraries, availability, inclusions and prices are confirmed only in a written quotation or booking confirmation.',
    },
    { h: 'Enquiries', body: 'Submitting an enquiry does not create a booking or contract. We will respond with options and, where relevant, a quotation that sets out the applicable terms.' },
    { h: 'Third-party providers', body: 'Where we arrange flights, rail, accommodation, transport or other services provided by third parties, those services are subject to the provider’s own terms, fares and policies.' },
    { h: 'Acceptable use', body: 'You agree not to misuse the website, submit false information, attempt to gain unauthorised access, or interfere with its operation.' },
    { h: 'Intellectual property', body: 'The Skyhigh name, logo, design and content of this website belong to the company and may not be reused without permission.' },
    { h: 'Liability', body: 'The website is provided on an “as is” basis. To the extent permitted by law, we are not liable for losses arising from reliance on illustrative content on this website.' },
    { h: 'Governing law', body: 'These terms are governed by the laws of India. Courts in Uttar Pradesh shall have jurisdiction, subject to applicable law.' },
  ],
}
