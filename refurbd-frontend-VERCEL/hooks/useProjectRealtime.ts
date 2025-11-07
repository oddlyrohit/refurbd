'use client'
import { useEffect, useRef } from 'react'
import { openProjectWS } from '@/lib/api'
type Callback = (event: { type:string; payload:any }) => void
export function useProjectRealtime(projectId:number|null, onEvent:Callback){
  const cb = useRef(onEvent); cb.current = onEvent
  useEffect(()=>{
    if(!projectId) return
    const ws = openProjectWS(projectId)
    if(!ws) return
    ws.onmessage = (e)=>{ try{ const d = JSON.parse(e.data); cb.current(d) }catch{} }
    return ()=>{ try{ ws.close() }catch{} }
  },[projectId])
}