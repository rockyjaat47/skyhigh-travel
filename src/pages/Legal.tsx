import { AlertTriangle } from 'lucide-react'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Seo } from '../components/ui/Seo'
import { useContent } from '../hooks/useContent'

/** Privacy policy / terms — fully editable from Admin → Website content → Legal. */
export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const { legal } = useContent()
  const isPrivacy = kind === 'privacy'
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'
  const sections = isPrivacy ? legal.privacy : legal.terms
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
              {legal.updated && <p className="label-mono mt-6 text-muted">Last updated · {legal.updated}</p>}
              {legal.draftNotice && (
                <div role="note" className="mt-8 flex gap-3 rounded-2xl border border-orange/30 bg-orange/5 p-4 text-sm text-navy">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                  <p>
                    <strong>Draft for business review.</strong> This document is a working draft and must be reviewed by the company and its legal advisers before publication.
                  </p>
                </div>
              )}
              <nav aria-label="On this page" className="mt-8 hidden lg:block">
                <ol className="space-y-2 text-sm text-muted">
                  {sections.map((s, i) => (
                    <li key={i}>
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
              <section key={i} id={`s-${i}`} className="scroll-mt-28 border-t border-line pt-8">
                <h2 className="flex gap-4 text-2xl font-medium text-navy">
                  <span className="font-display text-sm text-orange">{String(i + 1).padStart(2, '0')}</span>
                  {s.h}
                </h2>
                {s.body.split(/\n{2,}/).map((p, j) => (
                  <p key={j} className="mt-4 whitespace-pre-line leading-relaxed text-muted">
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
