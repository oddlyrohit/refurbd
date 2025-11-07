
'use client'
import { useEffect, useRef } from 'react'
import { projectEventStream, projectWebSocket } from '@/lib/api'
type Callback = (event: { type: string; payload: any }) => void
export function useProjectRealtime(projectId: number | null, onEvent: Callback) {
  const onEventRef = useRef(onEvent); onEventRef.current = onEvent
  useEffect(() => {
    if (!projectId) return
    const sse = projectEventStream(projectId)
    if (sse?.type === 'sse') {
      const es = sse.stream
      const handler = (e: MessageEvent) => { try { const data = JSON.parse(e.data); onEventRef.current({ type: data.type || 'message', payload: data }) } catch {} }
      es.addEventListener('message', handler)
      return () => { es.removeEventListener('message', handler); es.close() }
    }
    const w = projectWebSocket(projectId)
    if (w?.type === 'ws') {
      const ws = w.socket
      ws.onmessage = (e) => { try { const data = JSON.parse(e.data); onEventRef.current({ type: data.type || 'message', payload: data }) } catch {} }
      return () => { try { ws.close() } catch {} }
    }
  }, [projectId])
}
