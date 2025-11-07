
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { adminListJobs, adminPauseJob, adminResumeJob, adminRetryJob, adminCancelJob, adminQueueEventStream, adminQueueWebSocket } from '@/lib/api'

type Job = {
  id: number
  project_id: number
  user_id?: number
  user_email?: string
  type: 'analysis'|'render'|'edit'|string
  status: 'queued'|'running'|'paused'|'completed'|'failed'|'canceled'
  progress_percent?: number|null
  step?: string|null
  step_index?: number|null
  step_total?: number|null
  eta_seconds?: number|null
  created_at?: string
  updated_at?: string
}

function fmtTime(ts?: string) { if (!ts) return '—'; const d = new Date(ts); return d.toLocaleString() }
function pctVal(j: Job) {
  if (typeof j.progress_percent === 'number') return j.progress_percent
  if (j.step_index!=null && j.step_total) return Math.round((j.step_index / j.step_total) * 100)
  if (j.status==='completed' || j.status==='failed' || j.status==='canceled') return 100
  if (j.status==='running') return 50
  if (j.status==='queued') return 5
  return 0
}

export default function AdminQueueTable() {
  const [rows, setRows] = useState<Job[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('')
  const [jtype, setJtype] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await adminListJobs({ q, status, type: jtype, limit: 200 })
      setRows(data.items ?? data ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(()=>{ load() },[])
  useEffect(()=>{ load() },[status, jtype])

  useEffect(() => {
    if (!autoRefresh) return
    const sse = adminQueueEventStream()
    if (sse?.type === 'sse') {
      const es = sse.stream
      const onMsg = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'queue_snapshot' && Array.isArray(data.jobs)) setRows(data.jobs)
          if (data.type === 'job_added' && data.job) setRows(r => [data.job, ...r])
          if (data.type === 'job_removed' && data.job_id!=null) setRows(r => r.filter(j => j.id !== data.job_id))
          if (data.type === 'progress' && data.job_id!=null) setRows(r => r.map(j => j.id===data.job_id ? { ...j, ...data } : j))
        } catch {}
      }
      es.addEventListener('message', onMsg)
      return () => { es.removeEventListener('message', onMsg); es.close() }
    }
    const w = adminQueueWebSocket()
    if (w?.type === 'ws') {
      const ws = w.socket
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'queue_snapshot' && Array.isArray(data.jobs)) setRows(data.jobs)
          if (data.type === 'job_added' && data.job) setRows(r => [data.job, ...r])
          if (data.type === 'job_removed' && data.job_id!=null) setRows(r => r.filter(j => j.id !== data.job_id))
          if (data.type === 'progress' && data.job_id!=null) setRows(r => r.map(j => j.id===data.job_id ? { ...j, ...data } : j))
        } catch {}
      }
      return () => { try { ws.close() } catch {} }
    }
  }, [autoRefresh])

  const filtered = useMemo(() => {
    const s = (q||'').toLowerCase()
    return rows
      .filter(r => !status || r.status===status)
      .filter(r => !jtype || r.type===jtype)
      .filter(r => !s || (`${r.id} ${r.user_email||''} ${r.type} ${r.status} ${r.step||''}`).toLowerCase().includes(s))
      .sort((a,b) => (new Date(b.updated_at||b.created_at||0).getTime() - new Date(a.updated_at||a.created_at||0).getTime()))
  }, [rows, q, status, jtype])

  async function doAction(kind: 'pause'|'resume'|'retry'|'cancel', id: number) {
    try {
      if (kind==='pause') await adminPauseJob(id)
      if (kind==='resume') await adminResumeJob(id)
      if (kind==='retry') await adminRetryJob(id)
      if (kind==='cancel') await adminCancelJob(id)
      await load()
    } catch (e:any) {
      alert(e.message || 'Action failed')
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <div className="text-sm font-semibold">Global Render Queue</div>
          <label className="ml-2 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} />
            Auto-refresh
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search id/email/step…" className="w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"/>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="">All status</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select value={jtype} onChange={e=>setJtype(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="">All types</option>
            <option value="analysis">Analysis</option>
            <option value="render">Render</option>
            <option value="edit">Edit</option>
          </select>
          <button onClick={load} className="rounded-xl border px-3 py-2 text-xs">{loading?'Loading…':'Refresh'}</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Progress</th>
              <th className="px-3 py-2">Step</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(j => {
              const pct = pctVal(j)
              return (
                <tr key={j.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">{j.id}</td>
                  <td className="px-3 py-2">{j.project_id}</td>
                  <td className="px-3 py-2">{j.user_email || j.user_id || '—'}</td>
                  <td className="px-3 py-2 capitalize">{j.type}</td>
                  <td className="px-3 py-2 capitalize">{j.status}</td>
                  <td className="px-3 py-2">
                    <div className="w-36 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${pct}%` }}/>
                    </div>
                  </td>
                  <td className="px-3 py-2">{j.step || '—'} {j.step_index!=null && j.step_total!=null ? `(${j.step_index}/${j.step_total})` : ''}</td>
                  <td className="px-3 py-2">{fmtTime(j.updated_at || j.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {j.status==='running' && <Button variant="outline" onClick={()=>doAction('pause', j.id)}>Pause</Button>}
                      {j.status==='paused' && <Button variant="outline" onClick={()=>doAction('resume', j.id)}>Resume</Button>}
                      {(j.status==='failed' || j.status==='canceled') && <Button variant="outline" onClick={()=>doAction('retry', j.id)}>Retry</Button>}
                      {(j.status==='queued' || j.status==='running') && <Button variant="danger" onClick={()=>{ if (confirm('Cancel this job?')) doAction('cancel', j.id) }}>Cancel</Button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!filtered.length && <div className="py-6 text-center text-xs text-slate-500">No jobs match current filters.</div>}
    </Card>
  )
}
