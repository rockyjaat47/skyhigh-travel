import { Copy, ExternalLink, Eye, EyeOff, Plus, Search, Trash2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Artwork } from '../../components/ui/Artwork'
import { useContent } from '../../hooks/useContent'
import { localFor, type ContentRow, type ContentTable } from '../../services/adminApi'
import { cn } from '../../utils/cn'
import { useAdminApi, useRole } from './AdminApp'
import { FormFields, missingRequired, OptionsCtx } from './fields'
import { contentSchemas } from './schemas'
import { Btn, Notice, PageTitle, Panel } from './ui'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

const TITLES: Record<ContentTable, { title: string; sub: string }> = {
  destinations: { title: 'Destinations', sub: 'Places shown on the Destinations page, home carousel and globe.' },
  packages: { title: 'Packages', sub: 'Trip packages with itinerary, inclusions and price text.' },
  services: { title: 'Services', sub: 'The six service pages. Switch a service to “Available now” once it’s live.' },
}

type Draft = { id?: string; slug: string; published: boolean; sort: number; data: Record<string, unknown> }

function Editor({ table, draft, onCancel, onSave }: { table: ContentTable; draft: Draft; onCancel: () => void; onSave: (d: Draft) => Promise<void> }) {
  const schema = contentSchemas[table]
  const [d, setD] = useState<Draft>(draft)
  const [slugTouched, setSlugTouched] = useState(!!draft.id)
  const [json, setJson] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const art = (d.data.art ?? { scene: 'mountains', tone: 'golden', alt: '' }) as never

  const save = async () => {
    setErr('')
    if (!SLUG.test(d.slug)) return setErr('Page address must be lowercase letters, numbers and hyphens (e.g. “kerala-backwaters”).')
    const missing = missingRequired(schema.fields, d.data)
    if (missing.length) return setErr(`Please fill in: ${missing.join(', ')}`)
    setBusy(true)
    try {
      await onSave({ ...d, data: { ...d.data, slug: d.slug, published: d.published } })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <Panel className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-medium text-navy">{d.id ? `Edit: ${String(d.data[schema.nameKey] || d.slug)}` : `New ${schema.singular.toLowerCase()}`}</h2>
          {d.id && (
            <Link to={`/${table}/${d.slug}`} target="_blank" className="label-mono inline-flex items-center gap-1.5 text-navy hover:text-orange">
              View page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {err && (
          <div className="mt-4">
            <Notice kind="error">{err}</Notice>
          </div>
        )}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_15rem]">
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-navy">Page address</span>
              <span className="mt-0.5 block text-xs text-muted">
                yoursite/{table}/<strong>{d.slug || '…'}</strong>
              </span>
              <input
                value={d.slug}
                onChange={(e) => (setSlugTouched(true), setD({ ...d, slug: slugify(e.target.value) }))}
                className="mt-2 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-navy"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-navy">Order</span>
              <span className="mt-0.5 block text-xs text-muted">Lower shows first</span>
              <input type="number" value={d.sort} onChange={(e) => setD({ ...d, sort: Number(e.target.value) || 0 })} className="mt-2 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
            </label>
            <label className="flex items-center gap-3 sm:col-span-3">
              <button type="button" role="switch" aria-checked={d.published} onClick={() => setD({ ...d, published: !d.published })} className={cn('relative h-7 w-12 rounded-full transition-colors', d.published ? 'bg-[#16a34a]' : 'bg-line')}>
                <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', d.published ? 'left-6' : 'left-1')} />
              </button>
              <span className="text-sm font-semibold text-navy">{d.published ? 'Live on website' : 'Hidden (draft)'}</span>
            </label>
          </div>
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-navy">
            <Artwork art={art} seed={d.slug} sizes="15rem" />
          </div>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <FormFields
          fields={schema.fields}
          value={d.data}
          onChange={(data) => {
            const name = String(data[schema.nameKey] ?? '')
            setD((x) => ({ ...x, data, slug: !slugTouched && !x.id ? slugify(name) : x.slug }))
          }}
        />
      </Panel>

      <details className="rounded-2xl border border-line bg-white p-4" onToggle={(e) => (e.currentTarget.open ? setJson(JSON.stringify(d.data, null, 2)) : null)}>
        <summary className="label-mono cursor-pointer text-muted">Advanced — raw data (for developers)</summary>
        <textarea
          value={json}
          onChange={(e) => {
            setJson(e.target.value)
            try {
              setD((x) => ({ ...x, data: JSON.parse(e.target.value) }))
            } catch {
              /* keep typing */
            }
          }}
          spellCheck={false}
          rows={14}
          className="mt-3 w-full rounded-xl border border-line bg-cloud p-3 font-mono text-xs outline-none focus:border-navy"
        />
      </details>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 backdrop-blur lg:left-64">
        <div className="flex items-center justify-end gap-2 px-5 py-3 sm:px-8">
          <Btn variant="light" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn variant="orange" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : d.id ? 'Save changes' : `Create ${schema.singular.toLowerCase()}`}
          </Btn>
        </div>
      </div>
    </div>
  )
}

export function ContentManager({ table }: { table: ContentTable }) {
  const api = useAdminApi()
  const role = useRole()
  const { refresh, destinations } = useContent()
  const schema = contentSchemas[table]
  const meta = TITLES[table]
  const [rows, setRows] = useState<ContentRow[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [q, setQ] = useState('')
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

  const destOptions = useMemo(() => destinations.map((d) => ({ value: d.slug, label: d.name })), [destinations])

  const after = (text: string) => {
    setMsg({ kind: 'success', text })
    load()
    refresh()
  }

  const importBundled = async () => {
    const existing = new Set(rows?.map((r) => r.slug))
    const items = localFor(table).filter((x) => !existing.has(x.slug))
    if (!items.length) return setMsg({ kind: 'success', text: 'Everything is already imported.' })
    try {
      for (const [i, x] of items.entries()) await api.saveContent(table, { slug: x.slug, data: structuredClone(x) as unknown as Record<string, unknown>, published: x.published ?? true, sort: (rows?.length ?? 0) + i })
      after(`Imported ${items.length} item(s). You can now edit them.`)
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  const blank = (): Draft => {
    const base = structuredClone(localFor(table)[0]) as unknown as Record<string, unknown>
    for (const f of schema.fields) {
      if (f.type === 'lines' || f.type === 'images' || f.type === 'list' || f.type === 'paragraphs' || f.type === 'multi') base[f.key] = []
      else if (f.type === 'text' || f.type === 'textarea') base[f.key] = ''
    }
    base.art = { scene: 'mountains', tone: 'golden', alt: '', image: '' }
    return { slug: '', published: false, sort: rows?.length ?? 0, data: base }
  }

  const duplicate = (r: ContentRow): Draft => ({
    slug: `${r.slug}-copy`,
    published: false,
    sort: (rows?.length ?? 0) + 1,
    data: { ...structuredClone(r.data), [schema.nameKey]: `${String(r.data[schema.nameKey] ?? '')} (copy)` },
  })

  const visible = rows?.filter((r) => !q || `${String(r.data[schema.nameKey] ?? '')} ${r.slug}`.toLowerCase().includes(q.toLowerCase())) ?? null

  return (
    <OptionsCtx.Provider value={{ destinations: destOptions }}>
      <PageTitle
        title={meta.title}
        sub={meta.sub}
        actions={
          !draft && (
            <>
              {rows && rows.length < localFor(table).length && (
                <Btn variant="light" onClick={importBundled}>
                  <UploadCloud className="h-4 w-4" /> Import starter content
                </Btn>
              )}
              <Btn variant="orange" onClick={() => setDraft(blank())}>
                <Plus className="h-4 w-4" /> Add {schema.singular.toLowerCase()}
              </Btn>
            </>
          )
        }
      />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {rows && rows.length === 0 && !draft && (
        <Notice kind="info">
          Nothing saved here yet, so the website shows the built-in starter {meta.title.toLowerCase()}. Click <strong>Import starter content</strong> to copy them in and start editing.
        </Notice>
      )}

      {draft ? (
        <Editor
          table={table}
          draft={draft}
          onCancel={() => setDraft(null)}
          onSave={async (d) => {
            await api.saveContent(table, d)
            setDraft(null)
            after('Saved — the website is updated.')
          }}
        />
      ) : (
        <>
          {rows && rows.length > 5 && (
            <label className="relative mb-4 flex items-center">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${meta.title.toLowerCase()}…`} className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm outline-none focus:border-navy" />
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {!visible ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : (
              visible.map((r) => (
                <Panel key={r.id} className="group flex flex-col overflow-hidden">
                  <button type="button" onClick={() => setDraft({ id: r.id, slug: r.slug, published: r.published, sort: r.sort, data: structuredClone(r.data) })} className="relative aspect-[16/10] overflow-hidden bg-navy text-left">
                    <Artwork art={(r.data.art as never) ?? { scene: 'sky', tone: 'day', alt: '' }} seed={r.slug} decorative sizes="30vw" />
                    <span className={cn('label-mono absolute left-3 top-3 rounded-full px-2.5 py-1 !text-[0.6rem]', r.published ? 'bg-[#16a34a] text-white' : 'bg-white text-muted')}>
                      {r.published ? 'Live' : 'Hidden'}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-display text-lg font-medium leading-tight text-navy">{String(r.data[schema.nameKey] ?? r.slug)}</p>
                    <p className="mt-1 truncate text-xs text-muted">
                      /{table}/{r.slug}
                      {table === 'services' && ` · ${r.data.status === 'operational' ? 'Available now' : 'Proposed'}`}
                    </p>
                    <div className="mt-auto flex items-center gap-1 pt-4">
                      <Btn variant="dark" className="h-9" onClick={() => setDraft({ id: r.id, slug: r.slug, published: r.published, sort: r.sort, data: structuredClone(r.data) })}>
                        Edit
                      </Btn>
                      <button
                        type="button"
                        title={r.published ? 'Hide from website' : 'Show on website'}
                        aria-label={r.published ? `Hide ${r.slug}` : `Publish ${r.slug}`}
                        onClick={async () => {
                          try {
                            await api.saveContent(table, { ...r, published: !r.published, data: { ...r.data, published: !r.published } })
                            after(r.published ? 'Hidden from the website.' : 'Now live on the website.')
                          } catch (e) {
                            setMsg({ kind: 'error', text: (e as Error).message })
                          }
                        }}
                        className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-grey hover:text-navy"
                      >
                        {r.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button type="button" title="Duplicate" aria-label={`Duplicate ${r.slug}`} onClick={() => setDraft(duplicate(r))} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-grey hover:text-navy">
                        <Copy className="h-4 w-4" />
                      </button>
                      {role === 'admin' && (
                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete ${r.slug}`}
                          onClick={async () => {
                            if (!window.confirm(`Delete “${String(r.data[schema.nameKey] ?? r.slug)}” permanently? This cannot be undone. (Tip: you can hide it instead.)`)) return
                            try {
                              await api.deleteContent(table, r.id)
                              after('Deleted.')
                            } catch (e) {
                              setMsg({ kind: 'error', text: (e as Error).message })
                            }
                          }}
                          className="ml-auto grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-[#c2410c]/10 hover:text-[#c2410c]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              ))
            )}
          </div>
        </>
      )}
    </OptionsCtx.Provider>
  )
}
