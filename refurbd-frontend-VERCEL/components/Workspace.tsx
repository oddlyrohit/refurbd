// components/Workspace.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import * as api from '../lib/api'

type Job = {
  id: string
  name: string
  progress: number
  status: 'queued' | 'running' | 'done' | 'failed'
  imageUrl?: string | null
}

export default function Workspace() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  // preview selected file
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleUpload() {
    if (!file) return
    // 1) mock presign + upload
    const { assetId, url } = await api.presignUpload(file.name, file.type)
    await api.uploadToPresigned(url, file)
    // 2) mock commit
    await api.commitAsset({ assetId, projectId: 'demo-project', room: 'Kitchen' })
    // 3) mock analyze
    const analysis = await api.analyze({ assetId, stylePreset: 'Scandi', palette: ['#0ea5e9'] })
    alert(`Analysis ready: ${analysis.materials.slice(0, 2).join(', ')}…`)
  }

  async function handleRender() {
    // 1) start a render “job” (mock)
    const { jobId } = await api.startRender({ projectId: 'demo-project', assetId: 'last-asset', variant: 'Daylight' })
    // 2) display in UI
    setJobs((prev) => [{ id: jobId, name: `Render ${prev.length + 1}`, progress: 0, status: 'queued' }, ...prev])
    // 3) subscribe to mock progress stream (simulated milestones 20/50/80/100)
    api.onProgress(jobId, (update) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, progress: update.progress, status: update.status, imageUrl: update.imageUrl ?? j.imageUrl } : j
        )
      )
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="text-lg font-semibold">Refurbd · Workspace</div>
          <button
            className="border border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-2xl px-4 py-2 text-sm"
            onClick={() => inputRef.current?.click()}
          >
            New upload
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Uploader */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-5">
          <div className="flex items-start gap-6">
            <div className="w-full">
              <div
                className="rounded-xl border border-dashed border-neutral-300 px-5 py-10 text-center hover:bg-neutral-50 cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                <div className="text-sm text-neutral-600">Click to choose a photo (kitchen, bath, etc.)</div>
                <div className="text-xs text-neutral-500 mt-1">JPG/PNG up to ~10 MB</div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {preview && (
                <div className="mt-4 flex items-center gap-4">
                  <img src={preview} alt="preview" className="h-28 w-28 rounded-xl object-cover border" />
                  <div className="flex gap-2">
                    <button
                      className="bg-black text-white hover:bg-neutral-800 rounded-2xl px-4 py-2 text-sm"
                      onClick={handleUpload}
                    >
                      Analyze photo
                    </button>
                    <button
                      className="border border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-2xl px-4 py-2 text-sm"
                      onClick={handleRender}
                    >
                      Generate plan
                    </button>
                    <button
                      className="text-neutral-900 hover:bg-neutral-100 rounded-2xl px-4 py-2 text-sm"
                      onClick={() => { setFile(null); setPreview(null) }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Render Queue */}
        <section className="mt-8">
          <div className="mb-3 text-sm text-neutral-600">Render Queue</div>
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-500">
              No jobs yet. Upload a photo and click “Generate plan”.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {jobs.map((j) => (
                <div key={j.id} className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{j.name}</div>
                    <div className="text-xs text-neutral-500">{j.status.toUpperCase()}</div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full bg-black transition-all" style={{ width: `${j.progress}%` }} />
                  </div>
                  {j.imageUrl && (
                    <img src={j.imageUrl} alt="result" className="mt-4 w-full rounded-xl border object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
