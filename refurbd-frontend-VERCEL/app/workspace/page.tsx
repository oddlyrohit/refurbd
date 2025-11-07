
'use client'
import { useEffect, useState } from 'react'
import AuthGate from '@/components/AuthGate'
import Container from '@/components/ui/container'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import UploadCard from '@/components/UploadCard'
import RenderingGrid from '@/components/RenderingGrid'
import QueueCard from '@/components/QueueCard'
import { listProjects, getProject, listRenderings } from '@/lib/api'
import { useProjectRealtime } from '@/hooks/useProjectRealtime'

type Project = { id:number; name:string; status:'draft'|'analyzing'|'completed'|'archived'; design_plan?:string }
type Rendering = { id:number; version:number; is_latest:boolean; image_url?:string|null; thumbnail_url?:string|null }

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [current, setCurrent] = useState<Project | null>(null)
  const [renders, setRenders] = useState<Rendering[]>([])

  useEffect(()=>{ listProjects().then((arr:any)=>{ setProjects(arr); if (arr?.length) setCurrentId(arr[0].id) }) },[])
  useEffect(()=>{
    if (currentId==null) return
    getProject(currentId).then(setCurrent)
    listRenderings(currentId).then(setRenders).catch(()=>setRenders([]))
  },[currentId])

  useProjectRealtime(currentId, (evt) => {
    if (!currentId) return
    if (evt.type === 'status' && evt.payload?.status) setCurrent(c => c ? { ...c, status: evt.payload.status } : c)
    if (evt.type === 'render_added' && evt.payload?.rendering) setRenders(rs => [evt.payload.rendering, ...rs])
  })

  return (
    <AuthGate>
      <Container className="py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Workspace</div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <Card className="p-4">
              <div className="mb-2 text-sm font-semibold">{current?.name || 'No project selected'}</div>
              {current ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm dark:bg-slate-800">
                    <div className="mb-1 text-xs text-slate-500">Status</div>
                    <div className="font-semibold capitalize">{current.status}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm dark:bg-slate-800">
                    <div className="mb-1 text-xs text-slate-500">Design Plan</div>
                    <div className="whitespace-pre-wrap">{current.design_plan || '—'}</div>
                  </div>
                </div>
              ) : <div className="text-sm text-slate-500">Create or select a project.</div>}
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-sm font-semibold">Render Versions</div>
              <RenderingGrid renders={renders} />
            </Card>
          </div>
          <div className="space-y-4">
            <UploadCard />
            <QueueCard projectId={currentId} />
            <Card className="p-4">
              <div className="text-sm font-semibold">Projects</div>
              <div className="mt-3 space-y-2">
                {projects.length? projects.map(p => (
                  <button key={p.id} onClick={()=>setCurrentId(p.id)} className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${currentId===p.id?'border-emerald-400 dark:border-emerald-700':'border-slate-200 dark:border-slate-800'}`}>
                    {p.name} <span className="text-xs text-slate-500">• {p.status}</span>
                  </button>
                )): <div className="text-xs text-slate-500">No projects yet.</div>}
              </div>
              <Button className="mt-3 w-full" variant="outline">New Project</Button>
            </Card>
          </div>
        </div>
      </Container>
    </AuthGate>
  )
}
