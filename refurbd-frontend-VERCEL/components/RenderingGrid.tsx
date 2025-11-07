
'use client'
import RenderingCard from '@/components/RenderingCard'
type Item = { id:number; version:number; is_latest:boolean; image_url?:string|null; thumbnail_url?:string|null }
export default function RenderingGrid({ renders }: { renders: Item[] }) {
  if (!renders?.length) return <div className="text-sm text-slate-500">No renders yet.</div>
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {renders.map(r => (
        <RenderingCard key={r.id} renderingId={r.id} version={r.version} latest={r.is_latest} imageUrl={r.image_url} thumbnailUrl={r.thumbnail_url} />
      ))}
    </div>
  )
}
