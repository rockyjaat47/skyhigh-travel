import type { Service } from '../types/content'

/**
 * All six services are currently PROPOSED (planned offerings).
 * Change `status` to 'operational' once a service is confirmed and live —
 * the UI label updates automatically. Editable via the admin panel.
 */
export const services: Service[] = [
  {
    slug: 'tour-travel',
    index: '01',
    title: 'Tour & Travel',
    short: 'Tours',
    kicker: 'Journeys, curated end to end',
    summary:
      'Guided and independent tours planned around how you like to travel — routes, stays, transfers and local experiences arranged as one seamless journey.',
    description: [
      'Every good trip starts with a conversation. We listen to where you want to go, how fast you like to move and what you hope to bring home, then shape an itinerary around it.',
      'From weekend escapes to multi-city holidays, we coordinate the moving parts — transport, accommodation, sightseeing and on-ground support — so the journey feels effortless.',
    ],
    offerings: [
      { title: 'Domestic tours', text: 'Hill stations, coastlines, heritage circuits and pilgrimage routes across India.' },
      { title: 'International holidays', text: 'Assistance with planning trips abroad, from routing to on-ground arrangements.' },
      { title: 'Group departures', text: 'Coordinated travel for families, friends, schools and community groups.' },
      { title: 'Local experiences', text: 'Guides, cultural visits and day excursions arranged at the destination.' },
    ],
    process: ['Share your idea', 'Receive a tailored plan', 'Refine together', 'Travel with support'],
    forWhom: ['Families', 'Couples', 'Solo travellers', 'Groups'],
    status: 'proposed',
    art: { scene: 'mountains', tone: 'golden', alt: 'Illustration of layered mountain ridges at golden hour' },
    enquiryType: 'tour',
    seo: {
      title: 'Tour & Travel Services',
      description: 'Curated domestic and international tours planned end to end by Skyhigh — routes, stays, transfers and local experiences.',
    },
  },
  {
    slug: 'transportation',
    index: '02',
    title: 'Passenger & Goods Transportation',
    short: 'Transport',
    kicker: 'Moving people and goods, reliably',
    summary:
      'Comfortable passenger transfers and dependable goods movement, coordinated with clear communication from pickup to drop.',
    description: [
      'Whether it is an airport transfer, an outstation trip for a group or a consignment that must arrive on schedule, transportation is about trust.',
      'Skyhigh plans to coordinate vehicles matched to each requirement and keep you informed at every step of the trip.',
    ],
    offerings: [
      { title: 'Airport & station transfers', text: 'Punctual pickups and drops for individuals and groups.' },
      { title: 'Outstation travel', text: 'Cars, tempo travellers and coaches for intercity journeys.' },
      { title: 'Event transportation', text: 'Fleet coordination for weddings, conferences and gatherings.' },
      { title: 'Goods movement', text: 'Point-to-point transport for parcels, cargo and commercial goods.' },
    ],
    process: ['Tell us the route', 'Choose the right vehicle', 'Confirm the schedule', 'Track to arrival'],
    forWhom: ['Travellers', 'Event planners', 'Small businesses', 'Institutions'],
    status: 'proposed',
    art: { scene: 'road', tone: 'dawn', alt: 'Illustration of a highway stretching toward the horizon at dawn' },
    enquiryType: 'transport-passenger',
    seo: {
      title: 'Passenger & Goods Transportation',
      description: 'Passenger transfers, outstation travel and goods transportation coordinated by Skyhigh with clear communication.',
    },
  },
  {
    slug: 'logistics',
    index: '03',
    title: 'Truck & Logistics',
    short: 'Logistics',
    kicker: 'Freight, coordinated with care',
    summary:
      'Truck transportation and logistics coordination for businesses that need goods to move safely, predictably and on time.',
    description: [
      'Logistics is the quiet engine behind every business. Skyhigh intends to coordinate truck transportation — full and part loads — with planning that respects your timelines.',
      'We focus on clear documentation, careful handling and proactive updates so you can focus on running your business.',
    ],
    offerings: [
      { title: 'Full truck load (FTL)', text: 'Dedicated vehicles for larger consignments.' },
      { title: 'Part truck load (PTL)', text: 'Cost-efficient movement for smaller shipments.' },
      { title: 'Route planning', text: 'Practical routing and scheduling for recurring movement.' },
      { title: 'Logistics coordination', text: 'Single point of contact for pickups, transit and delivery.' },
    ],
    process: ['Share shipment details', 'Get a movement plan', 'Pickup & transit', 'Delivery confirmation'],
    forWhom: ['Manufacturers', 'Traders', 'Retailers', 'E-commerce sellers'],
    status: 'proposed',
    art: { scene: 'road', tone: 'dusk', alt: 'Illustration of a freight highway under a dusk sky' },
    enquiryType: 'logistics',
    seo: {
      title: 'Truck & Logistics Services',
      description: 'Full and part truck load transportation with logistics coordination from Skyhigh.',
    },
  },
  {
    slug: 'travel-booking',
    index: '04',
    title: 'Travel & Accommodation Booking',
    short: 'Bookings',
    kicker: 'The right ticket, the right room',
    summary:
      'Assistance with flights, trains, buses and hotel stays — compared, explained and arranged around your plans.',
    description: [
      'Booking travel should not feel like a puzzle. Our team helps you compare options, understand fares and policies, and choose what genuinely suits your trip.',
      'Skyhigh provides booking assistance; final fares, availability and policies are those of the respective airline, operator or property.',
    ],
    offerings: [
      { title: 'Flight booking assistance', text: 'Domestic and international routing support.' },
      { title: 'Rail & bus bookings', text: 'Help with tickets for intercity rail and coach travel.' },
      { title: 'Hotel & stays', text: 'Hotels, resorts and homestays matched to budget and purpose.' },
      { title: 'Itinerary changes', text: 'Support when plans shift — rebooking and alternatives.' },
    ],
    process: ['Share dates & preferences', 'Compare options', 'Confirm bookings', 'Receive documents'],
    forWhom: ['Leisure travellers', 'Students', 'Business travellers', 'Families'],
    status: 'proposed',
    art: { scene: 'sky', tone: 'day', alt: 'Illustration of an aircraft crossing a clear sky above clouds' },
    enquiryType: 'booking',
    seo: {
      title: 'Travel & Accommodation Booking',
      description: 'Flight, rail, bus and hotel booking assistance from Skyhigh — compared, explained and arranged around your plans.',
    },
  },
  {
    slug: 'corporate-travel',
    index: '05',
    title: 'Corporate Travel',
    short: 'Corporate',
    kicker: 'Business travel without friction',
    summary:
      'Travel management for teams and organisations — trips, events and offsites coordinated with policy and budget in mind.',
    description: [
      'Business travel has different stakes: tight schedules, approvals and budgets. Skyhigh plans to provide a dependable single point of coordination for your organisation.',
      'From a single executive trip to a company offsite, we align with your travel policy and keep every stakeholder informed.',
    ],
    offerings: [
      { title: 'Business trips', text: 'Flights, stays and ground transport for employees.' },
      { title: 'Conferences & MICE', text: 'Meetings, incentives, conferences and events logistics.' },
      { title: 'Team offsites', text: 'Venue, travel and activity planning for teams.' },
      { title: 'Consolidated coordination', text: 'One contact and clear documentation for finance teams.' },
    ],
    process: ['Understand your policy', 'Plan & approve', 'Travel & support', 'Consolidated records'],
    forWhom: ['Startups', 'SMEs', 'Enterprises', 'Institutions'],
    status: 'proposed',
    art: { scene: 'city-night', tone: 'night', alt: 'Illustration of a city skyline at night with lit windows' },
    enquiryType: 'corporate',
    seo: {
      title: 'Corporate Travel Management',
      description: 'Corporate travel, conferences and team offsites coordinated by Skyhigh with policy and budget in mind.',
    },
  },
  {
    slug: 'custom-packages',
    index: '06',
    title: 'Customized Travel Packages',
    short: 'Custom',
    kicker: 'Designed around you',
    summary:
      'Packages built from scratch around your dates, interests and budget — honeymoons, family holidays, adventures and pilgrimages.',
    description: [
      'No two travellers are the same, so no two packages should be. Tell us what a perfect trip looks like and we will design it with you.',
      'Packages combine transport, stays, experiences and support into one plan you can understand at a glance.',
    ],
    offerings: [
      { title: 'Honeymoons', text: 'Unhurried, romantic itineraries with thoughtful touches.' },
      { title: 'Family holidays', text: 'Comfortable pacing for all ages.' },
      { title: 'Adventure trips', text: 'Treks, road trips and outdoor experiences.' },
      { title: 'Spiritual journeys', text: 'Pilgrimage circuits planned with care.' },
    ],
    process: ['Describe your ideal trip', 'Receive a proposal', 'Personalise details', 'Depart with confidence'],
    forWhom: ['Couples', 'Families', 'Adventurers', 'Pilgrims'],
    status: 'proposed',
    art: { scene: 'beach', tone: 'dusk', alt: 'Illustration of a calm beach at dusk' },
    enquiryType: 'custom-package',
    seo: {
      title: 'Customized Travel Packages',
      description: 'Tailor-made honeymoon, family, adventure and spiritual travel packages designed with you by Skyhigh.',
    },
  },
]

export const values = [
  { title: 'Customer satisfaction', text: 'Every decision starts with the traveller — listening first, then planning.' },
  { title: 'Honesty and transparency', text: 'Clear information, clear terms and no hidden surprises.' },
  { title: 'Safety and reliability', text: 'Dependable arrangements and careful choices at every stage.' },
  { title: 'Innovation and technology', text: 'Smart tools that make planning simpler and journeys smoother.' },
  { title: 'Professionalism', text: 'Courteous, responsive and accountable service.' },
  { title: 'Quality service', text: 'Attention to detail that turns a trip into an experience.' },
]
