import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, UploadCloud, X } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import photoManifest from '../../data/photos.json'
import type { MediaItem } from '../../services/adminApi'
import { asset, cn } from '../../utils/cn'
import { useAdminApi } from './AdminApp'

/* ── Field definitions ─────────────────────────────────────────────── */

type Base = { key: string; label: string; hint?: string; required?: boolean; wide?: boolean }
export type Field = Base &
  (
    | { type: 'text' | 'textarea' | 'longtext' | 'number' | 'toggle' | 'image' | 'lines' | 'paragraphs' | 'images' | 'coords' }
    | { type: 'select'; options: { value: string; label: string }[] }
    | { type: 'multi'; source: 'destinations' }
    | { type: 'list'; fields: Field[]; itemLabel: string; titleKey?: string }
    | { type: 'group'; fields: Field[] }
  )

export type Section = { title: string; description?: string; fields: Field[] }

/** Extra option sources (e.g. destination list for packages). */
export const OptionsCtx = createContext<{ destinations: { value: string; label: string }[] }>({ destinations: [] })

type Obj = Record<string, unknown>

const inputCls = 'mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy'

/* ── Media picker ─────────────────────────────────────────────────── */

const bundled = Object.entries((photoManifest as { photos: Record<string, { alt: string }> }).photos).map(([name, p]) => ({
  path: `images/${name}.webp`,
  thumb: `images/${name}-sm.webp`,
  alt: p.alt,
}))

export function MediaPicker({ onPick, onClose }: { onPick: (path: string) => void; onClose: () => void }) {
  const api = useAdminApi()
  const [tab, setTab] = useState<'uploads' | 'bundled'>('uploads')
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api
      .listMedia()
      .then((m) => {
        setItems(m)
        if (!m.length) setTab('bundled')
      })
      .catch((e) => (setErr(e.message), setItems([])))
  }, [api])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setErr('')
    try {
      const up = await api.uploadMedia(files[0])
      onPick(up.url)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose an image" className="fixed inset-0 z-[90] grid place-items-center bg-midnight/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[86svh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.6rem] bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-line p-5">
          <div className="flex gap-1 rounded-full bg-grey p-1 text-sm font-semibold">
            {(['uploads', 'bundled'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded-full px-4 py-1.5', tab === t ? 'bg-white text-navy shadow' : 'text-muted')}>
                {t === 'uploads' ? 'Your uploads' : 'Website photos'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-full bg-orange px-4 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload new
            </button>
            <button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-grey">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {err && <p className="border-b border-line bg-[#c2410c]/5 px-5 py-3 text-sm text-[#9a3412]">{err}</p>}
        <div className="scroll-thin grid min-h-0 flex-1 auto-rows-max grid-cols-2 content-start gap-3 overflow-y-auto p-5 sm:grid-cols-3 lg:grid-cols-4">
          {tab === 'uploads' &&
            (items === null ? (
              <p className="col-span-full text-sm text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="col-span-full text-sm text-muted">No uploads yet. Use “Upload new” to add your own photo.</p>
            ) : (
              items.map((m) => (
                <button key={m.path} type="button" onClick={() => onPick(m.url)} className="group overflow-hidden rounded-xl border border-line text-left hover:border-navy">
                  <img src={m.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <span className="block truncate px-2 py-1.5 text-xs text-muted">{m.name}</span>
                </button>
              ))
            ))}
          {tab === 'bundled' &&
            bundled.map((b) => (
              <button key={b.path} type="button" onClick={() => onPick(b.path)} className="group overflow-hidden rounded-xl border border-line text-left hover:border-navy">
                <img src={asset(b.thumb)} alt={b.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <span className="block truncate px-2 py-1.5 text-xs text-muted">{b.alt}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const src = value ? asset(value.replace(/^(images\/[\w-]+)\.webp$/, '$1-sm.webp')) : ''
  return (
    <div className="mt-2 flex items-start gap-3">
      <button type="button" onClick={() => setOpen(true)} className="relative grid h-24 w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-cloud text-muted hover:border-navy">
        {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-xs font-semibold text-navy hover:border-navy">
            <ImagePlus className="h-3.5 w-3.5" /> {value ? 'Change photo' : 'Choose photo'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-muted hover:text-[#c2410c]">
              Remove
            </button>
          )}
        </div>
        <p className="mt-2 truncate text-xs text-muted" title={value}>
          {value || 'No photo — an illustration is shown instead.'}
        </p>
      </div>
      {open && <MediaPicker onPick={(v) => (onChange(v), setOpen(false))} onClose={() => setOpen(false)} />}
    </div>
  )
}

/* ── Renderer ─────────────────────────────────────────────────────── */

function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const opts = useContext(OptionsCtx)
  switch (field.type) {
    case 'text':
      return <input className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'number':
      return <input type="number" className={inputCls} value={(value as number) ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
    case 'textarea':
      return <textarea rows={3} className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'longtext':
      return <textarea rows={7} className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'toggle':
      return (
        <span className="mt-2 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={!!value}
            onClick={() => onChange(!value)}
            className={cn('relative h-7 w-12 rounded-full transition-colors', value ? 'bg-orange' : 'bg-line')}
          >
            <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', value ? 'left-6' : 'left-1')} />
          </button>
          <span className="text-sm text-muted">{value ? 'Yes' : 'No'}</span>
        </span>
      )
    case 'select':
      return (
        <select className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    case 'multi': {
      const sel = new Set((value as string[]) ?? [])
      return (
        <div className="mt-2 flex flex-wrap gap-2">
          {opts.destinations.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                const n = new Set(sel)
                if (n.has(o.value)) n.delete(o.value)
                else n.add(o.value)
                onChange([...n])
              }}
              className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', sel.has(o.value) ? 'border-navy bg-navy text-white' : 'border-line text-navy hover:border-navy')}
            >
              {o.label}
            </button>
          ))}
        </div>
      )
    }
    case 'lines':
      return (
        <textarea
          rows={Math.max(2, ((value as string[]) ?? []).length + 1)}
          className={inputCls}
          value={((value as string[]) ?? []).join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n'))}
          onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
        />
      )
    case 'paragraphs':
      return (
        <textarea
          rows={6}
          className={inputCls}
          value={((value as string[]) ?? []).join('\n\n')}
          onChange={(e) => onChange(e.target.value.split(/\n{2,}/))}
          onBlur={(e) => onChange(e.target.value.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean))}
        />
      )
    case 'image':
      return <ImageInput value={(value as string) ?? ''} onChange={onChange} />
    case 'images': {
      const list = (value as string[]) ?? []
      return (
        <div className="space-y-2">
          {list.map((v, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <ImageInput value={v} onChange={(nv) => onChange(nv ? list.map((x, j) => (j === i ? nv : x)) : list.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange([...list, ''])} className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-line px-3 text-xs font-semibold text-navy hover:border-navy">
            <Plus className="h-3.5 w-3.5" /> Add photo
          </button>
        </div>
      )
    }
    case 'coords': {
      const [lat, lon] = (value as [number, number]) ?? [0, 0]
      return (
        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="0.01" aria-label="Latitude" placeholder="Latitude" className={inputCls} value={lat} onChange={(e) => onChange([Number(e.target.value), lon])} />
          <input type="number" step="0.01" aria-label="Longitude" placeholder="Longitude" className={inputCls} value={lon} onChange={(e) => onChange([lat, Number(e.target.value)])} />
        </div>
      )
    }
    case 'group':
      return (
        <div className="mt-2 rounded-2xl border border-line bg-cloud/60 p-4">
          <FormFields fields={field.fields} value={(value as Obj) ?? {}} onChange={onChange} />
        </div>
      )
    case 'list': {
      const list = (value as Obj[]) ?? []
      const set = (next: Obj[]) => onChange(next)
      const blank = Object.fromEntries(field.fields.map((f) => [f.key, f.type === 'lines' || f.type === 'images' ? [] : f.type === 'toggle' ? false : '']))
      return (
        <div className="mt-2 space-y-3">
          {list.map((item, i) => (
            <div key={i} className="rounded-2xl border border-line bg-cloud/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="label-mono truncate text-muted">
                  {field.itemLabel} {i + 1}
                  {field.titleKey && item[field.titleKey] ? ` · ${String(item[field.titleKey]).slice(0, 40)}` : ''}
                </p>
                <div className="flex gap-1">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => set(list.map((x, j) => (j === i - 1 ? list[i] : j === i ? list[i - 1] : x)))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => set(list.map((x, j) => (j === i + 1 ? list[i] : j === i ? list[i + 1] : x)))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Remove ${field.itemLabel} ${i + 1}`} onClick={() => set(list.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white hover:text-[#c2410c]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <FormFields fields={field.fields} value={item} onChange={(v) => set(list.map((x, j) => (j === i ? (v as Obj) : x)))} />
            </div>
          ))}
          <button type="button" onClick={() => set([...list, structuredClone(blank)])} className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-line px-3 text-xs font-semibold text-navy hover:border-navy">
            <Plus className="h-3.5 w-3.5" /> Add {field.itemLabel.toLowerCase()}
          </button>
        </div>
      )
    }
  }
}

export function FormFields({ fields, value, onChange }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((f) => {
        const full = f.wide || ['textarea', 'longtext', 'paragraphs', 'list', 'group', 'images', 'multi', 'image', 'lines'].includes(f.type)
        return (
          <div key={f.key} className={full ? 'sm:col-span-2' : undefined}>
            <span className="text-sm font-semibold text-navy">
              {f.label}
              {f.required && <span className="text-orange"> *</span>}
            </span>
            {f.hint && <span className="mt-0.5 block text-xs text-muted">{f.hint}</span>}
            <FieldInput field={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
          </div>
        )
      })}
    </div>
  )
}

/** Returns labels of required fields that are empty (recursing into groups). */
export function missingRequired(fields: Field[], value: Obj, prefix = ''): string[] {
  const out: string[] = []
  for (const f of fields) {
    const v = value?.[f.key]
    if (f.type === 'group') out.push(...missingRequired(f.fields, (v as Obj) ?? {}, `${prefix}${f.label} → `))
    else if (f.required && (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))) out.push(prefix + f.label)
  }
  return out
}

export function SectionCard({ section, children }: { section: Section; children: ReactNode }) {
  return (
    <section className="rounded-[1.4rem] border border-line bg-white p-6 sm:p-8">
      <h2 className="font-display text-xl font-medium text-navy">{section.title}</h2>
      {section.description && <p className="mt-1 text-sm text-muted">{section.description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}
