import { destinationCategories } from '../../data/destinations'
import { packageThemes } from '../../data/packages'
import { enquiryServices } from '../../services/enquirySchema'
import type { SettingsKey } from '../../services/content'
import type { Field, Section } from './fields'

const SCENES = ['mountains', 'snow', 'beach', 'backwaters', 'city', 'city-night', 'desert', 'forest', 'river', 'road', 'sky']
const TONES = ['dawn', 'day', 'golden', 'dusk', 'night']
const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1).replace('-', ' ') }))

const art: Field = {
  key: 'art',
  label: 'Main photo',
  type: 'group',
  fields: [
    { key: 'image', label: 'Photo', type: 'image', hint: 'Shown on cards and at the top of the page.' },
    { key: 'alt', label: 'Photo description (for accessibility & Google)', type: 'text', wide: true, required: true },
    { key: 'scene', label: 'Fallback illustration', type: 'select', options: opt(SCENES), hint: 'Used only if no photo is set.' },
    { key: 'tone', label: 'Illustration mood', type: 'select', options: opt(TONES) },
  ],
}

const titleLines = (label: string): Field => ({ key: 'title', label, type: 'lines', required: true, hint: 'One line per row — each row becomes a line of the big heading.' })

/* ── Content types ────────────────────────────────────────────────── */

export const contentSchemas: Record<'destinations' | 'packages' | 'services', { nameKey: string; singular: string; fields: Field[] }> = {
  destinations: {
    nameKey: 'name',
    singular: 'Destination',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: destinationCategories.filter((c) => c.id !== 'all').map((c) => ({ value: c.id, label: c.label })) },
      { key: 'region', label: 'Region / state', type: 'text' },
      { key: 'country', label: 'Country', type: 'text', required: true },
      { key: 'tagline', label: 'Tagline', type: 'text', wide: true, hint: 'One short sentence shown on the card.' },
      { key: 'summary', label: 'Overview', type: 'textarea', required: true },
      art,
      { key: 'gallery', label: 'More photos', type: 'images', hint: 'Shown lower on the destination page.' },
      { key: 'highlights', label: 'Highlights', type: 'lines', hint: 'One per line.' },
      { key: 'idealFor', label: 'Ideal for', type: 'lines', hint: 'One per line, e.g. Families' },
      { key: 'bestTime', label: 'Best time to visit', type: 'text' },
      { key: 'coordinates', label: 'Map position (latitude, longitude)', type: 'coords', hint: 'Places the marker on the globe. Find it on Google Maps → right-click → copy coordinates.' },
      { key: 'illustrative', label: 'Show “Illustrative destination” label', type: 'toggle' },
    ],
  },
  packages: {
    nameKey: 'title',
    singular: 'Package',
    fields: [
      { key: 'title', label: 'Package name', type: 'text', required: true },
      { key: 'theme', label: 'Theme', type: 'select', options: packageThemes.filter((t) => t.id !== 'all').map((t) => ({ value: t.id, label: t.label })) },
      { key: 'durationDays', label: 'Duration (days)', type: 'number', required: true },
      { key: 'destinationSlugs', label: 'Destinations', type: 'multi', source: 'destinations' },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      art,
      {
        key: 'itinerary',
        label: 'Day-by-day plan',
        type: 'list',
        itemLabel: 'Day',
        titleKey: 'title',
        fields: [
          { key: 'day', label: 'Day label', type: 'text', hint: 'e.g. Day 1–2' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Description', type: 'textarea' },
        ],
      },
      { key: 'inclusions', label: 'Includes', type: 'lines', hint: 'One per line.' },
      { key: 'exclusions', label: 'Not included', type: 'lines', hint: 'One per line.' },
      { key: 'priceNote', label: 'Price text', type: 'textarea', hint: 'e.g. “From ₹24,999 per person” or “Quoted on request”.' },
      { key: 'illustrative', label: 'Show “Sample itinerary” label', type: 'toggle' },
    ],
  },
  services: {
    nameKey: 'title',
    singular: 'Service',
    fields: [
      { key: 'title', label: 'Service name', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', options: [{ value: 'proposed', label: 'Proposed (coming soon)' }, { value: 'operational', label: 'Available now' }] },
      { key: 'index', label: 'Number shown', type: 'text', hint: 'e.g. 01' },
      { key: 'short', label: 'Short name', type: 'text', hint: 'Used in small links, e.g. “Tours”.' },
      { key: 'kicker', label: 'Kicker line', type: 'text', wide: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      art,
      { key: 'description', label: 'Main description', type: 'paragraphs', hint: 'Leave an empty line between paragraphs.' },
      {
        key: 'offerings',
        label: 'What’s offered',
        type: 'list',
        itemLabel: 'Offering',
        titleKey: 'title',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Description', type: 'textarea' },
        ],
      },
      { key: 'process', label: 'How it works (steps)', type: 'lines', hint: 'One step per line.' },
      { key: 'forWhom', label: 'Ideal for', type: 'lines', hint: 'One per line.' },
      { key: 'enquiryType', label: 'Enquiry form pre-selects', type: 'select', options: enquiryServices.map((s) => ({ value: s.id, label: s.label })) },
      {
        key: 'seo',
        label: 'Google search text',
        type: 'group',
        fields: [
          { key: 'title', label: 'Page title', type: 'text', wide: true },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },
}

/* ── Website content (site_settings) ──────────────────────────────── */

const pageHero = (key: string, title: string): Field => ({
  key,
  label: title,
  type: 'group',
  fields: [
    titleLines('Big heading'),
    { key: 'intro', label: 'Intro text', type: 'textarea' },
    { key: 'note', label: 'Small note (right side)', type: 'textarea' },
    { key: 'image', label: 'Background photo', type: 'image' },
  ],
})

export const settingsSchemas: Partial<Record<SettingsKey, { title: string; description: string; sections: Section[]; wrapKey?: string }>> = {
  home: {
    title: 'Home page',
    description: 'Every heading, paragraph and photo on the home page.',
    sections: [
      {
        title: 'Hero (top of page)',
        fields: [
          { key: 'heroEyebrow', label: 'Small line above heading', type: 'text' },
          { key: 'heroTitle', label: 'Main heading', type: 'lines', required: true, hint: 'One line per row.' },
          { key: 'heroText', label: 'Supporting text', type: 'textarea' },
          { key: 'heroPrimaryCta', label: 'Orange button text', type: 'text' },
          { key: 'heroSecondaryCta', label: 'Second button text', type: 'text' },
          { key: 'heroImage', label: 'Photo for phones without 3D', type: 'image', hint: 'Most visitors see the 3D aircraft; this photo is the fallback.' },
        ],
      },
      {
        title: 'Introduction',
        fields: [
          { key: 'introLabel', label: 'Label', type: 'text' },
          { key: 'introStatement', label: 'Statement', type: 'textarea', required: true },
          { key: 'pillars', label: 'Three pillars', type: 'list', itemLabel: 'Pillar', titleKey: 'title', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }] },
        ],
      },
      {
        title: 'Section headings',
        description: 'Headings and intro text for each home page section.',
        fields: [
          { key: 'servicesTitle', label: 'Services heading', type: 'lines' },
          { key: 'servicesText', label: 'Services text', type: 'textarea' },
          { key: 'exploreTitle', label: 'Destinations heading', type: 'lines' },
          { key: 'exploreText', label: 'Destinations text', type: 'textarea' },
          { key: 'connectTitle', label: 'Globe heading', type: 'lines' },
          { key: 'connectText', label: 'Globe text', type: 'textarea' },
          { key: 'valuesTitle', label: '“Why Skyhigh” heading', type: 'lines' },
          { key: 'valuesText', label: '“Why Skyhigh” text', type: 'textarea' },
          { key: 'planTitle', label: 'Enquiry heading', type: 'lines' },
          { key: 'planText', label: 'Enquiry text', type: 'textarea' },
        ],
      },
      {
        title: 'Transport & logistics section',
        fields: [
          { key: 'moveTitle', label: 'Heading', type: 'lines' },
          { key: 'moveText', label: 'Text', type: 'textarea' },
          { key: 'moveImage', label: 'Wide photo', type: 'image' },
          { key: 'moveBanner', label: 'Line on the photo', type: 'text', wide: true },
          { key: 'moveItems', label: 'Three cards', type: 'list', itemLabel: 'Card', titleKey: 'title', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }] },
        ],
      },
      { title: 'Mission & vision background', fields: [{ key: 'missionImage', label: 'Background photo', type: 'image' }] },
    ],
  },
  company: {
    title: 'Company & values',
    description: 'About text, mission, vision, tagline and core values (used on Home and About).',
    sections: [
      {
        title: 'Company',
        fields: [
          { key: 'tagline', label: 'Tagline', type: 'text', wide: true, required: true },
          { key: 'about', label: 'About the company', type: 'paragraphs', hint: 'Leave an empty line between paragraphs.' },
          { key: 'mission', label: 'Mission', type: 'textarea', required: true },
          { key: 'vision', label: 'Vision', type: 'textarea', required: true },
        ],
      },
      { title: 'Core values', fields: [{ key: 'values', label: 'Values', type: 'list', itemLabel: 'Value', titleKey: 'title', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }] }] },
    ],
  },
  pages: {
    title: 'Other pages',
    description: 'Top-of-page headings, text and photos for inner pages.',
    sections: [
      {
        title: 'About page',
        fields: [
          {
            key: 'about',
            label: 'About',
            type: 'group',
            fields: [
              titleLines('Big heading'),
              { key: 'intro', label: 'Intro text', type: 'textarea' },
              { key: 'image', label: 'Background photo', type: 'image' },
              { key: 'storyTitle', label: '“Our story” heading', type: 'lines' },
              { key: 'gallery', label: 'Photo collage (3 photos)', type: 'images' },
            ],
          },
        ],
      },
      { title: 'Services page', fields: [pageHero('services', 'Services')] },
      { title: 'Destinations page', fields: [pageHero('destinations', 'Destinations')] },
      { title: 'Packages page', fields: [pageHero('packages', 'Packages')] },
      {
        title: 'Contact page',
        fields: [
          {
            key: 'contact',
            label: 'Contact',
            type: 'group',
            fields: [titleLines('Big heading'), { key: 'formTitle', label: 'Form label', type: 'text' }],
          },
        ],
      },
    ],
  },
  faqs: {
    title: 'FAQ',
    description: 'Questions shown on the Contact page.',
    wrapKey: 'items',
    sections: [{ title: 'Questions', fields: [{ key: 'items', label: 'FAQ', type: 'list', itemLabel: 'Question', titleKey: 'q', fields: [{ key: 'q', label: 'Question', type: 'text', wide: true }, { key: 'a', label: 'Answer', type: 'textarea' }] }] }],
  },
  legal: {
    title: 'Privacy & terms',
    description: 'Legal pages. Have them reviewed by a legal adviser before turning the draft notice off.',
    sections: [
      {
        title: 'Settings',
        fields: [
          { key: 'updated', label: '“Last updated” date', type: 'text' },
          { key: 'draftNotice', label: 'Show “draft for review” notice', type: 'toggle' },
        ],
      },
      { title: 'Privacy policy', fields: [{ key: 'privacy', label: 'Sections', type: 'list', itemLabel: 'Section', titleKey: 'h', fields: [{ key: 'h', label: 'Heading', type: 'text', wide: true }, { key: 'body', label: 'Text', type: 'longtext' }] }] },
      { title: 'Terms & conditions', fields: [{ key: 'terms', label: 'Sections', type: 'list', itemLabel: 'Section', titleKey: 'h', fields: [{ key: 'h', label: 'Heading', type: 'text', wide: true }, { key: 'body', label: 'Text', type: 'longtext' }] }] },
    ],
  },
  contact: {
    title: 'Contact details',
    description: 'Shown in the footer, contact page, enquiry form and WhatsApp buttons. Empty fields are hidden.',
    sections: [
      {
        title: 'How customers reach you',
        fields: [
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'phone', label: 'Phone', type: 'text', hint: 'e.g. +91 98765 43210' },
          { key: 'whatsapp', label: 'WhatsApp number', type: 'text', hint: 'With country code, digits only, e.g. 919876543210' },
          { key: 'hours', label: 'Working hours', type: 'text' },
          { key: 'address', label: 'Address', type: 'textarea' },
          { key: 'social', label: 'Social media', type: 'list', itemLabel: 'Link', titleKey: 'label', fields: [{ key: 'label', label: 'Name (e.g. Instagram)', type: 'text' }, { key: 'url', label: 'Link (https://…)', type: 'text' }] },
        ],
      },
    ],
  },
  seo: {
    title: 'Google & sharing',
    description: 'How the site appears in Google results and when shared on WhatsApp / social media.',
    sections: [
      {
        title: 'Search & social',
        fields: [
          { key: 'defaultTitle', label: 'Home page title', type: 'text', wide: true, required: true },
          { key: 'titleTemplate', label: 'Other pages title format', type: 'text', wide: true, hint: '%s is replaced by the page name, e.g. “%s · Skyhigh”.' },
          { key: 'defaultDescription', label: 'Description', type: 'textarea', hint: 'Around 150 characters works best.' },
          { key: 'ogImage', label: 'Share image (1200×630)', type: 'image' },
        ],
      },
    ],
  },
}

/** Extra validation per settings key. Returns an error message or null. */
export function validateSetting(key: SettingsKey, v: Record<string, unknown>): string | null {
  if (key === 'contact') {
    const email = String(v.email ?? '').trim()
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Please enter a valid email address.'
    const social = (v.social as { label: string; url: string }[]) ?? []
    const bad = social.find((s) => s.url && !/^https:\/\/\S+$/.test(s.url))
    if (bad) return `Social links must start with https:// — check “${bad.label || bad.url}”.`
  }
  if (key === 'seo' && !String(v.titleTemplate ?? '').includes('%s')) return 'The title format must contain %s.'
  return null
}

/** Normalises values before saving. */
export function normaliseSetting(key: SettingsKey, v: Record<string, unknown>) {
  if (key === 'contact') {
    return {
      ...v,
      email: String(v.email ?? '').trim(),
      whatsapp: String(v.whatsapp ?? '').replace(/[^\d]/g, ''),
      social: ((v.social as { label: string; url: string }[]) ?? []).filter((s) => s.label && s.url),
    }
  }
  return v
}
