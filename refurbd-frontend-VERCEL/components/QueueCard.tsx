'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import { listJobs } from '@/lib/api'
import { useProjectRealtime } from '@/hooks/useProjectRealtime'

type Job = {
  id: number
  status: 'queued'|'running'|'completed'|'failed'|'canceled'|'paused'
  step?: string|null
  step_index?: number|null
  step_total?: number|null
  progress_percent?: number|null
  updated_at?: string
}

export default function QueueCard({ projectId }: { projectId: number | null }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string| null>(null)
  const mounted = useRef(true)

  useEffect(()=>{
    mounted.current = true
    if (!projectId) { setJobs([]); return }
    ;(async ()=>{
      try{
        const data = await listJobs(projectId).catch(()=>[])
        if (mounted.current) setJobs(Array.isArray(data) ? data : [])
      }catch(e:any){
        if (mounted.current) setError(e.message||'Failed to load queue')
      }
    })()
    return ()=>{ mounted.current = false }
  },[projectId])

  useProjectRealtime(projectId, (evt)=>{
    if (!projectId) return
    if (evt?.type === 'queue_snapshot' && Array.isArray(evt.payload?.jobs)) setJobs(evt.payload.jobs)
    if (evt?.type === 'progress' && evt.payload?.job_id != null) setJobs(js => js.map(j => j.id===evt.payload.job_id ? { ...j, ...evt.payload } : j))
    if (evt?.type === 'job_added' && evt.payload?.job) setJobs(js => [evt.payload.job, ...js])
    if (evt?.type === 'job_removed' && evt.payload?.job_id != null) setJobs(js => js.filter(j => j.id !== evt.payload.job_id))
  })

  const visible = useMemo(()=>{
    const now = Date.now()
    const fresh = jobs.filter(j => j.status!=='completed' || (j.updated_at && (now - Date.parse(j.updated_at)) < 90000))
    return fresh.length ? fresh : jobs.slice(0,5)
  }, [jobs])

  function pct(j: Job){
    if (typeof j.progress_percent === 'number') return Math.max(0, Math.min(100, Math.round(j.progress_percent)))
    if (typeof j.step_index === 'number' && typeof j.step_total === 'number' && j.step_total>0) return Math.min(100, Math.round((j.step_index/j.step_total)*100))
    if (j.status === 'completed' || j.status === 'failed' || j.status==='canceled') return 100
    return 0
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Render Queue</div>
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>
      {(!projectId) ? <div className="text-xs text-slate-500">No project selected.</div> :
       (!visible.length) ? <div className="text-xs text-slate-500">No active jobs.</div> :
       <div className="space-y-3">
         {visible.map(j => (
           <div key={j.id} className="rounded-lg border p-3 text-xs">
             <div className="flex items-center justify-between">
               <div className="font-medium">{j.step || 'Working...'}</div>
               <div>{pct(j)}%</div>
             </div>
             <div className="mt-2">
               <Progress value={pct(j)} />
             </div>
             <div className="mt-2 flex items-center gap-2">
               <span className="badge border-slate-300">{j.status}</span>
               {typeof j.step_index==='number' && typeof j.step_total==='number' && j.step_total>0 &&
                 <span className="badge border-slate-300">{j.step_index}/{j.step_total}</span>}
             </div>
           </div>
         ))}
       </div>}
    </Card>
  )
}