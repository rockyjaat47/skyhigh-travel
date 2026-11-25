import { ExternalLink, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { useContent } from '../../hooks/useContent'
import { mergeSetting, settingsDefaults, type SettingsKey } from '../../services/content'
import { cn } from '../../utils/cn'
import { useAdminApi } from './AdminApp'
import { FormFields, missingRequired, SectionCard } from './fields'
import { normaliseSetting, settingsSchemas, validateSetting } from './schemas'
import { Btn, Notice, PageTitle } from './ui'

const PREVIEW_PATH: Partial<Record<SettingsKey, string>> = { home: '/', company: '/about', pages: '/about', faqs: '/contact', legal: '/privacy-policy', contact: '/contact', seo: '/' }

export const CONTENT_TABS: SettingsKey[] = ['home', 'company', 'pages', 'faqs', 'legal']
export const SETTINGS_TABS: SettingsKey[] = ['contact', 'seo']

type Obj = Record<string, unknown>

export function SettingsEditor({ group }: { group: 'content' | 'settings' }) {
  const tabs = group === 'content' ? CONTENT_TABS : SETTINGS_TABS
  const params = useParams()
  const key = (tabs.includes(params.key as SettingsKey) ? params.key : tabs[0]) as SettingsKey
  const schema = settingsSchemas[key]!
  const api = useAdminApi()
  const { refresh } = useContent()
  const [value, setValue] = useState<Obj | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const wrap = (v: unknown): Obj => (schema.wrapKey ? { [schema.wrapKey]: v } : (v as Obj))
  const unwrap = (v: Obj): unknown => (schema.wrapKey ? v[schema.wrapKey] : v)

  useEffect(() => {
    setValue(null)
    setDirty(false)
    setMsg(null)
    api
      .getSetting(key)
      .then((saved) => setValue(wrap(structuredClone(mergeSetting(settingsDefaults[key] as unknown, saved)))))
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setValue(wrap(structuredClone(settingsDefaults[key])))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, key])

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const save = async () => {
    if (!value) return
    const missing = schema.sections.flatMap((s) => missingRequired(s.fields, value))
    if (missing.length) return setMsg({ kind: 'error', text: `Please fill in: ${missing.join(', ')}` })
    const inner = unwrap(value)
    const err = !schema.wrapKey ? validateSetting(key, inner as Obj) : null
    if (err) return setMsg({ kind: 'error', text: err })
    setBusy(true)
    try {
      await api.setSetting(key, schema.wrapKey ? inner : normaliseSetting(key, inner as Obj))
      setDirty(false)
      setMsg({ kind: 'success', text: 'Saved — the website is updated.' })
      refresh()
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle
        title={group === 'content' ? 'Website content' : 'Settings'}
        sub={group === 'content' ? 'Edit any text or photo on the website. Changes go live as soon as you save.' : 'Contact details and how the site appears on Google.'}
      />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-white p-1 text-sm font-semibold shadow-[inset_0_0_0_1px_var(--color-line)]">
        {tabs.map((t) => (
          <NavLink
            key={t}
            to={`/admin/${group}/${t}`}
            className={() => cn('shrink-0 rounded-full px-4 py-2 transition-colors', t === key ? 'bg-navy text-white' : 'text-muted hover:text-navy')}
          >
            {settingsSchemas[t]!.title}
          </NavLink>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted">{schema.description}</p>
        <Link to={PREVIEW_PATH[key] ?? '/'} target="_blank" className="label-mono inline-flex items-center gap-1.5 text-navy hover:text-orange">
          View on website <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {!value ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-6 pb-28">
          {schema.sections.map((s) => (
            <SectionCard key={s.title} section={s}>
              <FormFields
                fields={s.fields}
                value={value}
                onChange={(v) => {
                  setValue(v)
                  setDirty(true)
                  setMsg(null)
                }}
              />
            </SectionCard>
          ))}
        </div>
      )}

      {/* sticky save bar */}
      <div className={cn('fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 backdrop-blur transition-transform duration-300 lg:left-64', dirty ? 'translate-y-0' : 'translate-y-full')}>
        <div className="flex items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <p className="text-sm font-semibold text-navy">You have unsaved changes</p>
          <div className="flex gap-2">
            <Btn
              variant="light"
              onClick={() => {
                setDirty(false)
                setValue(null)
                api.getSetting(key).then((saved) => setValue(wrap(structuredClone(mergeSetting(settingsDefaults[key] as unknown, saved)))))
              }}
            >
              <RotateCcw className="h-4 w-4" /> Discard
            </Btn>
            <Btn variant="orange" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Btn>
          </div>
        </div>
      </div>
    </>
  )
}
