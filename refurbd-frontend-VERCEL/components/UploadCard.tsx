
'use client'
import React, { useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Sparkles, Upload } from 'lucide-react'
import { createProject, startAnalyze } from '@/lib/api'

export default function UploadCard() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>('')

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setMessage('Uploading…')
    try {
      const form = new FormData()
      form.append('name', 'New Project')
      form.append('room_type', 'kitchen')
      form.append('renovation_scope', 'moderate')
      form.append('current_room_image', file)
      const project = await createProject(form)
      setMessage('Starting analysis…')
      await startAnalyze(project.id)
      setMessage('Analysis started. Open Workspace to track progress.')
    } catch (err: any) {
      setMessage(err?.message || 'Failed to upload/analyze')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Room Analyzer</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Drop a photo (JPG/PNG/WEBP). Uses Gemini vision.</p>
        </div>
        <Badge icon={Sparkles}>AI powered</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <div className="flex flex-col items-center">
            <Upload className="mb-2 h-6 w-6" />
            <div className="text-sm font-medium">Drag & drop room photo</div>
            <div className="text-xs">or click to browse</div>
            <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={onSelect}/>
            <button onClick={()=>inputRef.current?.click()} className="mt-3 rounded-xl border px-3 py-1 text-xs">Choose File</button>
          </div>
        </div>
        <div className="flex flex-col items-stretch justify-between">
          <Button disabled={busy} onClick={()=>inputRef.current?.click()} className="w-full">{busy? 'Working…':'Upload & Analyze'}</Button>
          {message && <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{message}</div>}
        </div>
      </div>
    </Card>
  )
}
