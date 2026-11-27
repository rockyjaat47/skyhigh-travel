import { Check, EyeOff, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Stars } from '../../components/booking/Reviews'
import { adminCommerce, type Review, type ReviewStatus } from '../../services/customer'
import { cn } from '../../utils/cn'
import { useAdminApi } from './AdminApp'
import { Btn, fmtDate, Notice, PageTitle, Panel } from './ui'

const LABEL: Record<ReviewStatus, string> = { pending: 'Waiting for approval', approved: 'Live on website', rejected: 'Hidden' }

export function ReviewsAdmin() {
  const api = useAdminApi()
  const [status, setStatus] = useState<ReviewStatus | 'all'>('pending')
  const [rows, setRows] = useState<Review[] | null>(null)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const load = useCallback(() => {
    setRows(null)
    adminCommerce
      .reviews(status)
      .then(setRows)
      .catch((e) => (setMsg({ kind: 'error', text: e.message }), setRows([])))
  }, [status])
  useEffect(load, [load])

  const act = async (r: Review, s: ReviewStatus | 'delete') => {
    try {
      if (s === 'delete') {
        if (!window.confirm('Delete this review permanently?')) return
        await adminCommerce.deleteReview(r.id)
      } else await adminCommerce.setReviewStatus(r.id, s)
      load()
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  if (api.mode === 'preview') return <Notice kind="info">Reviews need the live database — not available in local preview.</Notice>

  return (
    <>
      <PageTitle
        title="Reviews"
        sub="Only customers with a confirmed booking can write a review. Nothing appears on the website until you approve it."
        actions={
          <Btn variant="light" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Btn>
        }
      />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={cn('h-9 rounded-full px-4 text-sm font-semibold', status === s ? 'bg-navy text-white' : 'border border-line bg-white text-navy hover:border-navy')}>
            {s === 'all' ? 'All' : LABEL[s]}
          </button>
        ))}
      </div>
      {!rows ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <Panel className="p-10 text-center text-sm text-muted">No reviews here.</Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => (
            <Panel key={r.id} className="p-6">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <span className="label-mono !text-[0.6rem] text-muted">{LABEL[r.status]}</span>
              </div>
              <p className="label-mono mt-3 text-orange">{r.package_slug}</p>
              {r.title && <p className="mt-2 font-display text-lg font-medium text-navy">{r.title}</p>}
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{r.body}</p>
              <p className="mt-3 text-xs text-muted">
                — {r.author_name} · {fmtDate(r.created_at)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status !== 'approved' && (
                  <Btn onClick={() => act(r, 'approved')}>
                    <Check className="h-4 w-4" /> Approve
                  </Btn>
                )}
                {r.status !== 'rejected' && (
                  <Btn variant="light" onClick={() => act(r, 'rejected')}>
                    <EyeOff className="h-4 w-4" /> Hide
                  </Btn>
                )}
                <Btn variant="danger" onClick={() => act(r, 'delete')}>
                  <Trash2 className="h-4 w-4" />
                </Btn>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  )
}
