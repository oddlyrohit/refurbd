
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import { listJobs } from '@/lib/api'
import { useProjectRealtime } from '@/hooks/useProjectRealtime'

type Job = {
  id: number
  project_id: number
  type: 'analysis' | 'render' | 'edit' | string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled' | 'paused'
  step?: string | null
  step_index?: number | null
  step_total?: number | null
  progress_percent?: number | null
  eta_seconds?: number | null
  created_at?: string
  updated_at?: string
  note?: string | null
}

function prettyETA(sec?: number | null) {
  if (!sec && sec != 0) return '—'
  const m = Math.floor(sec/60), s = Math.floor(sec%60)
  return m ? `${m}m ${s}s` : `${s}s`
}
function fallbackPercent(status: Job['status'], stepIndex?: number|null, stepTotal?: number|null) {
  if (typeof stepIndex === 'number' && typeof stepTotal === 'number' && stepTotal>0) return Math.min(100, Math.round((stepIndex/stepTotal)*100))
  return status==='queued' ? 5 : status==='running' ? 50 : (status==='completed' || status==='failed' || status==='canceled') ? 100 : 0
}

export default function QueueCard({ projectId }: { projectId: number | null }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    if (!projectId) { setJobs([]); return }
    ;(async () => {
      try {
        const data = await listJobs(projectId).catch(() => [])
        if (mounted.current) setJobs(Array.isArray(data) ? data : [])
      } catch (e:any) {
        if (mounted.current) setError(e.message || 'Failed to load queue')
      }
    })()
    return () => { mounted.current = false }
  }, [projectId])

  useProjectRealtime(projectId, (evt) => {
    if (!projectId) return
    if (evt.type === 'queue_snapshot' && Array.isArray(evt.payload?.jobs)) setJobs(evt.payload.jobs)
    if (evt.type === 'progress' && evt.payload?.job_id != null) setJobs(js => js.map(j => j.id===evt.payload.job_id ? { ...j, ...evt.payload } : j))
    if (evt.type === 'job_added' && evt.payload?.job) setJobs(js => [evt.payload.job, ...js])
    if (evt.type === 'job_removed' && evt.payload?.job_id != null) setJobs(js => js.filter(j => j.id !== evt.payload.job_id))
  })

  const visible = useMemo(() => {
    const now = Date.now()
    const fresh = jobs.filter(j => j.status!=='completed' or (j.updated_at and (now - Date.parse(j.updated_at)) < 90_000))
    return fresh.length ? fresh : jobs.slice(0,5)
  }, [jobs])

  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold">Render Queue</div>
      {error && <div className="mb-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">{error}</div>}
      {(!projectId) ? (
        <div className="text-xs text-slate-500">No project selected.</div>
      ) : (!visible.length) ? (
        <div className="text-xs text-slate-500">No active jobs.</div>
      ) : (
        <div className="space-y-3">
          {visible.map(j => {
            const pct = (typeof j.progress_percent === 'number') ? j.progress_percent : fallbackPercent(j.status, j.step_index ?? undefined, j.step_total ?? undefined)
            const label = j.step || (j.type==='analysis' ? 'Analyzing room' : j.type==='render' ? 'Generating render' : 'Processing')
            return (
              <div key={j.id} className="rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="font-medium capitalize">{label}</div>
                  <div className="text-[11px] text-slate-500">{j.status}</div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <div>{j.step_index!=null && j.step_total!=null ? `Step ${j.step_index}/${j.step_total}` : '—'}</div>
                  <div>ETA {prettyETA(j.eta_seconds)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
