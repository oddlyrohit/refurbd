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

  useEffect(()=>{ listProjects().then((arr:any)=>{ if(Array.isArray(arr)) { setProjects(arr); if(arr[0]) setCurrentId(arr[0].id) } }).catch(()=>{}) },[])

  return (
    <Container className="space-y-4">
      <Card className="p-4">
        <div className="font-semibold mb-2">Projects</div>
        <div className="flex gap-2 flex-wrap">
          {projects.map(p => (
            <button key={p.id} onClick={()=>setCurrentId(p.id)} className={'px-3 py-2 rounded border ' + (currentId===p.id ? 'bg-black text-white':'')}>
              {p.name||('Project '+p.id)}
            </button>
          ))}
        </div>
      </Card>

      <QueueCard projectId={currentId} />
    </Container>
  )
}