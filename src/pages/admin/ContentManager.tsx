import { Eye, EyeOff, Plus, Trash2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Artwork } from '../../components/ui/Artwork'
import { useContent } from '../../hooks/useContent'
import { localFor, type ContentRow, type ContentTable } from '../../services/adminApi'
import type { ArtScene, ArtTone } from '../../types/content'
import { cn } from '../../utils/cn'
import { useAdminApi } from './AdminApp'
import { Btn, Notice, PageTitle, Panel } from './ui'

const SCENES: ArtScene[] = ['mountains', 'snow', 'beach', 'backwaters', 'city', 'city-night', 'desert', 'forest', 'river', 'road', 'sky']
const TONES: ArtTone[] = ['dawn', 'day', 'golden', 'dusk', 'night']

const META: Record<ContentTable, { title: string; nameKey: string; sub: string; required: string[] }> = {
  destinations: { title: 'Destinations', nameKey: 'name', sub: 'Showcase destinations and their detail pages.', required: ['name', 'country', 'category', 'summary', 'coordinates', 'art'] },
  packages: { title: 'Packages', nameKey: 'title', sub: 'Sample itineraries and packages.', required: ['title', 'theme', 'durationDays', 'summary', 'itinerary', 'art'] },
  services: { title: 'Services', nameKey: 'title', sub: 'Service pages. Mark a service operational once it’s live.', required: ['title', 'index', 'summary', 'status', 'art', 'enquiryType', 'seo'] },
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

type Draft = { id?: string; slug: string; published: boolean; sort: number; data: Record<string, unknown> }

function Editor({ table, draft, onCancel, onSave }: { table: ContentTable; draft: Draft; onCancel: () => void; onSave: (d: Draft) => Promise<void> }) {
  const meta = META[table]
  const [d, setD] = useState<Draft>(draft)
  const [json, setJson] = useState(() => JSON.stringify(draft.data, null, 2))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const setField = (k: string, v: unknown) => {
    const data = { ...d.data, [k]: v }
    setD({ ...d, data })
    setJson(JSON.stringify(data, null, 2))
  }
  const art = (d.data.art ?? { scene: 'mountains', tone: 'golden', alt: '' }) as { scene: ArtScene; tone: ArtTone; alt: string; image?: string }

  const save = async () => {
    setErr('')
    let data: Record<string, unknown>
    try {
      data = JSON.parse(json)
    } catch {
      return setErr('Advanced JSON is not valid.')
    }
    if (!SLUG.test(d.slug)) return setErr('Slug must be lowercase letters, numbers and hyphens (e.g. "kerala-backwaters").')
    const missing = meta.required.filter((k) => data[k] === undefined || data[k] === '')
    if (missing.length) return setErr(`Missing required fields: ${missing.join(', ')}`)
    setBusy(true)
    try {
      await onSave({ ...d, data: { ...data, slug: d.slug, published: d.published } })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const text = (k: string, label: string, area = false) => (
    <label className="block">
      <span className="label-mono text-muted">{label}</span>
      {area ? (
        <textarea rows={3} value={(d.data[k] as string) ?? ''} onChange={(e) => setField(k, e.target.value)} className="mt-2 w-full rounded-2xl border border-line p-3 text-sm outline-none focus:border-navy" />
      ) : (
        <input value={(d.data[k] as string) ?? ''} onChange={(e) => setField(k, e.target.value)} className="field-input" />
      )}
    </label>
  )

  return (
    <Panel className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-navy">{d.id ? `Edit ${String(d.data[meta.nameKey] ?? d.slug)}` : `New ${meta.title.slice(0, -1).toLowerCase()}`}</h2>
        <button type="button" onClick={onCancel} className="label-mono text-muted hover:text-navy">
          Cancel
        </button>
      </div>
      {err && (
        <div className="mt-4">
          <Notice kind="error">{err}</Notice>
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label-mono text-muted">Slug (URL)</span>
            <input value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="field-input" />
          </label>
          <label className="block">
            <span className="label-mono text-muted">Sort order</span>
            <input type="number" value={d.sort} onChange={(e) => setD({ ...d, sort: Number(e.target.value) || 0 })} className="field-input" />
          </label>
          {text(meta.nameKey, meta.nameKey === 'name' ? 'Name' : 'Title')}
          {table === 'destinations' && text('tagline', 'Tagline')}
          {table === 'packages' && (
            <label className="block">
              <span className="label-mono text-muted">Duration (days)</span>
              <input type="number" min={1} value={(d.data.durationDays as number) ?? 1} onChange={(e) => setField('durationDays', Number(e.target.value) || 1)} className="field-input" />
            </label>
          )}
          {table === 'services' && (
            <label className="block">
              <span className="label-mono text-muted">Status</span>
              <select value={(d.data.status as string) ?? 'proposed'} onChange={(e) => setField('status', e.target.value)} className="field-input">
                <option value="proposed">Proposed (planned)</option>
                <option value="operational">Operational (live)</option>
              </select>
            </label>
          )}
          <div className="sm:col-span-2">{text('summary', 'Summary', true)}</div>
          {table !== 'services' && (
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={(d.data.illustrative as boolean) ?? true} onChange={(e) => setField('illustrative', e.target.checked)} className="h-4 w-4 accent-[#FF7900]" />
              Label as illustrative / sample content
            </label>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={d.published} onChange={(e) => setD({ ...d, published: e.target.checked })} className="h-4 w-4 accent-[#FF7900]" />
            Published (visible on the website)
          </label>
        </div>
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-navy">
            <Artwork art={art} seed={d.slug} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select aria-label="Artwork scene" value={art.scene} onChange={(e) => setField('art', { ...art, scene: e.target.value })} className="h-9 rounded-full border border-line px-3 text-xs font-semibold">
              {SCENES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select aria-label="Artwork tone" value={art.tone} onChange={(e) => setField('art', { ...art, tone: e.target.value })} className="h-9 rounded-full border border-line px-3 text-xs font-semibold">
              {TONES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <input
            aria-label="Photo path (optional)"
            placeholder="Photo path, e.g. images/goa.avif"
            value={art.image ?? ''}
            onChange={(e) => setField('art', { ...art, image: e.target.value.trim() || undefined })}
            className="mt-2 h-9 w-full rounded-full border border-line px-3 text-xs"
          />
          <input aria-label="Image alt text" placeholder="Alt text (accessibility)" value={art.alt ?? ''} onChange={(e) => setField('art', { ...art, alt: e.target.value })} className="mt-2 h-9 w-full rounded-full border border-line px-3 text-xs" />
        </div>
      </div>
      <details className="mt-8 rounded-2xl border border-line p-4">
        <summary className="label-mono cursor-pointer text-navy">Advanced — full record (JSON)</summary>
        <p className="mt-2 text-xs text-muted">Edit lists such as highlights, itinerary, inclusions or offerings here. The quick fields above stay in sync.</p>
        <textarea
          value={json}
          onChange={(e) => {
            setJson(e.target.value)
            try {
              setD((x) => ({ ...x, data: JSON.parse(e.target.value) }))
            } catch {
              /* keep editing */
            }
          }}
          spellCheck={false}
          rows={16}
          className="mt-3 w-full rounded-xl border border-line bg-cloud p-3 font-mono text-xs outline-none focus:border-navy"
        />
      </details>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="light" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn variant="orange" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Btn>
      </div>
    </Panel>
  )
}

export function ContentManager({ table }: { table: ContentTable }) {
  const api = useAdminApi()
  const { refresh } = useContent()
  const meta = META[table]
  const [rows, setRows] = useState<ContentRow[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const load = useCallback(() => {
    api
      .listContent(table)
      .then(setRows)
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setRows([])))
  }, [api, table])

  useEffect(() => {
    setRows(null)
    setDraft(null)
    setMsg(null)
    load()
  }, [load])

  const after = (text: string) => {
    setMsg({ kind: 'success', text })
    load()
    refresh()
  }

  const importBundled = async () => {
    const existing = new Set(rows?.map((r) => r.slug))
    const items = localFor(table).filter((x) => !existing.has(x.slug))
    if (!items.length) return setMsg({ kind: 'success', text: 'Everything bundled is already in the database.' })
    try {
      for (const [i, x] of items.entries()) await api.saveContent(table, { slug: x.slug, data: x as unknown as Record<string, unknown>, published: x.published ?? true, sort: (rows?.length ?? 0) + i })
      after(`Imported ${items.length} item(s).`)
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  const blank = (): Draft => {
    const base = localFor(table)[0] as unknown as Record<string, unknown>
    return { slug: '', published: false, sort: rows?.length ?? 0, data: { ...structuredClone(base), slug: '', [meta.nameKey]: '' } }
  }

  return (
    <>
      <PageTitle
        title={meta.title}
        sub={meta.sub}
        actions={
          <>
            <Btn variant="light" onClick={importBundled}>
              <UploadCloud className="h-4 w-4" /> Import bundled content
            </Btn>
            <Btn onClick={() => setDraft(blank())}>
              <Plus className="h-4 w-4" /> New
            </Btn>
          </>
        }
      />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {rows && rows.length === 0 && !draft && (
        <Notice kind="info">The database has no {meta.title.toLowerCase()} yet, so the website is showing bundled content. Use “Import bundled content” to start managing it here.</Notice>
      )}

      {draft ? (
        <Editor
          table={table}
          draft={draft}
          onCancel={() => setDraft(null)}
          onSave={async (d) => {
            await api.saveContent(table, d)
            setDraft(null)
            after('Saved.')
          }}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {!rows ? (
              <li className="p-6 text-sm text-muted">Loading…</li>
            ) : (
              rows.map((r) => (
                <li key={r.id} className="flex items-center gap-4 p-4">
                  <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-navy">
                    <Artwork art={(r.data.art as never) ?? { scene: 'sky', tone: 'day', alt: '' }} seed={r.slug} decorative />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy">{String(r.data[meta.nameKey] ?? r.slug)}</p>
                    <p className="truncate text-xs text-muted">
                      /{table}/{r.slug} · sort {r.sort}
                      {table === 'services' && ` · ${String(r.data.status)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    title={r.published ? 'Unpublish' : 'Publish'}
                    aria-label={r.published ? `Unpublish ${r.slug}` : `Publish ${r.slug}`}
                    onClick={async () => {
                      try {
                        await api.saveContent(table, { ...r, published: !r.published, data: { ...r.data, published: !r.published } })
                        after(r.published ? 'Unpublished.' : 'Published.')
                      } catch (e) {
                        setMsg({ kind: 'error', text: (e as Error).message })
                      }
                    }}
                    className={cn('label-mono inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 !text-[0.6rem]', r.published ? 'bg-[#16a34a]/10 text-[#15803d]' : 'bg-grey text-muted')}
                  >
                    {r.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {r.published ? 'Live' : 'Hidden'}
                  </button>
                  <Btn variant="light" onClick={() => setDraft({ id: r.id, slug: r.slug, published: r.published, sort: r.sort, data: r.data })}>
                    Edit
                  </Btn>
                  <button
                    type="button"
                    aria-label={`Delete ${r.slug}`}
                    onClick={async () => {
                      if (!window.confirm(`Delete “${String(r.data[meta.nameKey] ?? r.slug)}” permanently? This cannot be undone.`)) return
                      try {
                        await api.deleteContent(table, r.id)
                        after('Deleted.')
                      } catch (e) {
                        setMsg({ kind: 'error', text: (e as Error).message })
                      }
                    }}
                    className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-[#c2410c]/10 hover:text-[#c2410c]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </Panel>
      )}
    </>
  )
}
