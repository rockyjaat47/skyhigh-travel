import { useLocation } from 'react-router-dom'
import { env } from '../../config/env'
import { company } from '../../config/site'
import { useContent } from '../../hooks/useContent'

interface SeoProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
  noindex?: boolean
  breadcrumbs?: { name: string; path: string }[]
  jsonLd?: Record<string, unknown>[]
}

export const absUrl = (path: string) => `${env.siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`

/**
 * Per-page metadata. React 19 hoists <title>/<meta>/<link> into <head>.
 * JSON-LD is rendered inline (valid anywhere in the document).
 */
export function Seo({ title, description, image, type = 'website', noindex, breadcrumbs, jsonLd = [] }: SeoProps) {
  const { pathname } = useLocation()
  const { seo } = useContent()
  const fullTitle = title ? seo.titleTemplate.replace('%s', title) : seo.defaultTitle
  const desc = description ?? seo.defaultDescription
  const url = absUrl(pathname === '/' ? '/' : pathname.replace(/\/$/, ''))
  const img = absUrl(image ?? seo.ogImage)

  const ld: Record<string, unknown>[] = [...jsonLd]
  if (breadcrumbs?.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Home', path: '/' }, ...breadcrumbs].map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: absUrl(b.path),
      })),
    })
  }

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content={company.brand} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj).replace(/</g, '\\u003c') }} />
      ))}
    </>
  )
}

export const organizationLd = (contact: { email: string; phone: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: company.legalName,
  alternateName: company.brand,
  url: absUrl('/'),
  logo: absUrl('/brand/skyhigh-icon.svg'),
  slogan: company.tagline,
  description: company.about[0],
  ...(contact.email ? { email: contact.email } : {}),
  ...(contact.phone ? { telephone: contact.phone } : {}),
  identifier: { '@type': 'PropertyValue', propertyID: 'CIN', value: company.cin },
})
