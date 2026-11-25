import { Check, Copy, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import photoManifest from '../../data/photos.json'
import { MAX_UPLOAD_MB, type MediaItem } from '../../services/adminApi'
import { asset, cn } from '../../utils/cn'
import { useAdminApi, useRole } from './AdminApp'
import { Notice, PageTitle, Panel } from './ui'

const bundled = Object.entries((photoManifest as { photos: Record<string, { alt: string }> }).photos).map(([name, p]) => ({
  path: `images/${name}.webp`,
  thumb: `images/${name}-sm.webp`,
  alt: p.alt,
}))

export function MediaLibrary() {
  const api = useAdminApi()
  const role = useRole()
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [busy, setBusy] = useState(0)
  const [drag, setDrag] = useState(false)
  const [copied, setCopied] = useState('')
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    api
      .listMedia()
      .then(setItems)
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setItems([])))
  }, [api])
  useEffect(load, [load])

  const upload = async (files: FileList | File[]) => {
    const list = [...files]
    if (!list.length) return
    setMsg(null)
    setBusy(list.length)
    const errors: string[] = []
    for (const f of list) {
      try {
        await api.uploadMedia(f)
      } catch (e) {
        errors.push(`${f.name}: ${(e as Error).message}`)
      }
      setBusy((n) => n - 1)
    }
    setMsg(errors.length ? { kind: 'error', text: errors.join(' · ') } : { kind: 'success', text: `${list.length} photo(s) uploaded. Choose them from any “Choose photo” button.` })
    load()
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(''), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <>
      <PageTitle title="Photos" sub={`Upload your own photos (JPG, PNG, WebP — up to 20 MB; they’re automatically compressed to under ${MAX_UPLOAD_MB} MB).`} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          upload(e.dataTransfer.files)
        }}
        className={cn('flex w-full flex-col items-center justify-center rounded-[1.4rem] border-2 border-dashed px-6 py-12 text-center transition-colors', drag ? 'border-orange bg-orange/5' : 'border-line bg-white hover:border-navy')}
      >
        {busy ? <Loader2 className="h-8 w-8 animate-spin text-orange" /> : <UploadCloud className="h-8 w-8 text-orange" />}
        <p className="mt-3 font-display text-lg font-medium text-navy">{busy ? `Uploading… (${busy} left)` : 'Drop photos here or click to upload'}</p>
        <p className="mt-1 text-sm text-muted">Tip: landscape photos at least 1600px wide look best.</p>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />

      <h2 className="mt-10 font-display text-xl font-medium text-navy">Your uploads</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {items === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="col-span-full text-sm text-muted">No uploads yet.</p>
        ) : (
          items.map((m) => (
            <Panel key={m.path} className="overflow-hidden">
              <img src={m.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center gap-1 p-2">
                <p className="min-w-0 flex-1 truncate text-xs text-muted" title={m.name}>
                  {m.name}
                </p>
                <button type="button" title="Copy link" aria-label={`Copy link for ${m.name}`} onClick={() => copy(m.url)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-grey hover:text-navy">
                  {copied === m.url ? <Check className="h-4 w-4 text-[#16a34a]" /> : <Copy className="h-4 w-4" />}
                </button>
                {role === 'admin' && (
                  <button
                    type="button"
                    title="Delete"
                    aria-label={`Delete ${m.name}`}
                    onClick={async () => {
                      if (!window.confirm('Delete this photo permanently? Pages using it will fall back to an illustration.')) return
                      try {
                        await api.deleteMedia(m.path)
                        load()
                      } catch (e) {
                        setMsg({ kind: 'error', text: (e as Error).message })
                      }
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-[#c2410c]/10 hover:text-[#c2410c]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Panel>
          ))
        )}
      </div>

      <h2 className="mt-12 font-display text-xl font-medium text-navy">Built-in website photos</h2>
      <p className="mt-1 text-sm text-muted">Licensed from Unsplash (free for commercial use). Available in every photo picker.</p>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {bundled.map((b) => (
          <img key={b.path} src={asset(b.thumb)} alt={b.alt} title={b.alt} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
        ))}
      </div>
    </>
  )
}
