'use client'
import { useEffect, useState } from 'react'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import QueueCard from '@/components/QueueCard'
import { listProjects } from '@/lib/api'

type Project = { id:number; name:string }

export default function WorkspacePage(){
  const [projects, setProjects] = useState<Project[]>([])
  const [currentId, setCurrentId] = useState<number|null>(null)

  useEffect(()=>{ 
    listProjects().then((arr:any)=>{ 
      if(Array.isArray(arr)) { setProjects(arr); if(arr[0]) setCurrentId(arr[0].id) }
    }).catch(()=>{}) 
  },[])

  return (
    <section className="py-10">
      <Container className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="mb-3 text-sm font-semibold">Projects</div>
            <div className="flex flex-wrap gap-2">
              {projects.length === 0 && <div className="text-sm text-slate-500">No projects yet.</div>}
              {projects.map(p => (
                <button key={p.id} onClick={()=>setCurrentId(p.id)} className={'btn border ' + (currentId===p.id ? 'bg-black text-white':'')}>
                  {p.name||('Project '+p.id)}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-semibold mb-3">Renderings</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="aspect-video rounded-lg border bg-slate-100" />
              <div className="aspect-video rounded-lg border bg-slate-100" />
              <div className="aspect-video rounded-lg border bg-slate-100" />
            </div>
          </Card>
        </div>
        <QueueCard projectId={currentId} />
      </Container>
    </section>
  )
}