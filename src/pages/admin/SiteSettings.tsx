import { useEffect, useState } from 'react'
import { defaultContact, defaultSeo } from '../../config/site'
import { useContent } from '../../hooks/useContent'
import type { ContactSettings, SeoSettings } from '../../types/content'
import { useAdminApi } from './AdminApp'
import { Btn, Notice, PageTitle, Panel } from './ui'

export function SiteSettings() {
  const api = useAdminApi()
  const { refresh } = useContent()
  const [contact, setContact] = useState<ContactSettings>(defaultContact)
  const [seo, setSeo] = useState<SeoSettings>(defaultSeo)
  const [social, setSocial] = useState('')
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    api.getSetting<ContactSettings>('contact').then((c) => {
      const merged = { ...defaultContact, ...(c ?? {}) }
      setContact(merged)
      setSocial(merged.social.map((s) => `${s.label} | ${s.url}`).join('\n'))
    })
    api.getSetting<SeoSettings>('seo').then((s) => setSeo({ ...defaultSeo, ...(s ?? {}) }))
  }, [api])

  const saveContact = async () => {
    const links = social
      .split('\n')
      .map((l) => l.split('|').map((x) => x.trim()))
      .filter(([l, u]) => l && u)
    const bad = links.find(([, u]) => !/^https:\/\/[^\s]+$/.test(u))
    if (bad) return setMsg({ kind: 'error', text: `Social link must start with https:// — “${bad[1]}”` })
    if (contact.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) return setMsg({ kind: 'error', text: 'Enter a valid email address.' })
    const value: ContactSettings = { ...contact, whatsapp: contact.whatsapp.replace(/[^\d]/g, ''), social: links.map(([label, url]) => ({ label, url })) }
    try {
      await api.setSetting('contact', value)
      setMsg({ kind: 'success', text: 'Contact details saved.' })
      refresh()
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  const saveSeo = async () => {
    if (!seo.titleTemplate.includes('%s')) return setMsg({ kind: 'error', text: 'Title template must contain %s.' })
    try {
      await api.setSetting('seo', seo)
      setMsg({ kind: 'success', text: 'SEO settings saved.' })
      refresh()
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  const input = <T extends object>(obj: T, set: (v: T) => void, k: keyof T & string, label: string, hint?: string) => (
    <label className="block">
      <span className="label-mono text-muted">{label}</span>
      <input value={(obj[k] as string) ?? ''} onChange={(e) => set({ ...obj, [k]: e.target.value })} className="field-input" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )

  return (
    <>
      <PageTitle title="Contact & SEO" sub="Details shown in the footer, contact page and search results." />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-medium text-navy">Contact information</h2>
          <div className="mt-6 grid gap-5">
            {input(contact, setContact, 'email', 'Email')}
            {input(contact, setContact, 'phone', 'Phone', 'Shown as tap-to-call, e.g. +91 98765 43210')}
            {input(contact, setContact, 'whatsapp', 'WhatsApp number', 'Digits incl. country code, e.g. 919876543210. Leave empty to hide WhatsApp.')}
            {input(contact, setContact, 'address', 'Address')}
            {input(contact, setContact, 'hours', 'Working hours')}
            <label className="block">
              <span className="label-mono text-muted">Social links</span>
              <textarea rows={3} value={social} onChange={(e) => setSocial(e.target.value)} placeholder={'Instagram | https://instagram.com/…'} className="mt-2 w-full rounded-2xl border border-line p-3 text-sm outline-none focus:border-navy" />
              <span className="mt-1 block text-xs text-muted">One per line: Label | https://url</span>
            </label>
          </div>
          <Btn variant="orange" className="mt-6" onClick={saveContact}>
            Save contact details
          </Btn>
        </Panel>
        <Panel className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-medium text-navy">SEO metadata</h2>
          <div className="mt-6 grid gap-5">
            {input(seo, setSeo, 'defaultTitle', 'Homepage title')}
            {input(seo, setSeo, 'titleTemplate', 'Title template', 'Use %s for the page name, e.g. “%s · Skyhigh”')}
            <label className="block">
              <span className="label-mono text-muted">Default description</span>
              <textarea rows={3} maxLength={300} value={seo.defaultDescription} onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })} className="mt-2 w-full rounded-2xl border border-line p-3 text-sm outline-none focus:border-navy" />
              <span className="mt-1 block text-xs text-muted">{seo.defaultDescription.length}/160 recommended</span>
            </label>
            {input(seo, setSeo, 'ogImage', 'Social share image path')}
          </div>
          <div className="mt-6 rounded-2xl border border-line p-4">
            <p className="label-mono text-muted">Search preview</p>
            <p className="mt-2 truncate text-lg text-[#1a0dab]">{seo.defaultTitle}</p>
            <p className="line-clamp-2 text-sm text-muted">{seo.defaultDescription}</p>
          </div>
          <p className="mt-4 text-xs text-muted">Note: on static hosting, crawlers that don’t run JavaScript see the defaults compiled into index.html.</p>
          <Btn variant="orange" className="mt-6" onClick={saveSeo}>
            Save SEO settings
          </Btn>
        </Panel>
      </div>
    </>
  )
}
