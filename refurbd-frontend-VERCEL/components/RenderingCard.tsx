
'use client'
import { useEffect, useState } from 'react'
import { renderingDownloadUrl } from '@/lib/api'
type Props = { renderingId: number; version: number; latest: boolean; imageUrl?: string|null; thumbnailUrl?: string|null }
export default function RenderingCard({ renderingId, version, latest, imageUrl, thumbnailUrl }: Props) {
  const [url, setUrl] = useState<string | null>(thumbnailUrl || imageUrl || null)
  const [loading, setLoading] = useState(!url)
  useEffect(() => {
    let revoke: string | null = null
    if (!url) {
      const load = async () => {
        try {
          const token = localStorage.getItem('token') || ''
          let res = await fetch(renderingDownloadUrl(renderingId, { thumb: true }), { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} })
          if (!res.ok) res = await fetch(renderingDownloadUrl(renderingId), { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} })
          const blob = await res.blob()
          const u = URL.createObjectURL(blob)
          setUrl(u); revoke = u
        } catch {}
        finally { setLoading(false) }
      }
      load()
    } else { setLoading(false) }
    return () => { if (revoke) URL.revokeObjectURL(revoke) }
  }, [renderingId, url])
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-100 p-2 text-center text-xs dark:bg-slate-800">
      <div className="mb-2 h-28 w-full rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        {loading ? <span className="text-[10px] text-slate-500">loading…</span> : (url ? <img src={url} alt={`v${version}`} className="h-28 w-full rounded-xl object-cover"/> : <span className="text-[10px] text-slate-500">no image</span>)}
      </div>
      v{version} {latest ? '(latest)' : ''}
    </div>
  )
}
