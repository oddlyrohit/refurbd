'use client'

import { useEffect, useRef, useState } from 'react'

type Project = { id: string; name: string }
type JobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED'
type Job = { id: string; name: string; progress: number; status: JobStatus; imageUrl?: string | null }

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([{ id: uid(), name: 'Demo Project' }])
  const [currentId, setCurrentId] = useState<string>(projects[0].id)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const [jobs, setJobs] = useState<Job[]>([])

  function addProject() {
    const p = { id: uid(), name: `Project ${projects.length + 1}` }
    setProjects([p, ...projects])
    setCurrentId(p.id)
  }

  async function analyzePhoto() {
    if (!file) return
    await new Promise((r) => setTimeout(r, 600))
    alert('Analysis ready: engineered stone benchtop, sage subway tile…')
  }

  function generatePlan() {
    const id = uid()
    const name = `Render ${jobs.length + 1}`
    setJobs([{ id, name, progress: 0, status: 'QUEUED' }, ...jobs])
    const steps = [20, 50, 80, 100]
    let i = 0
    const tick = () => {
      const p = steps[i++]
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id
            ? {
                ...j,
                progress: p,
                status: p < 100 ? 'RUNNING' : 'DONE',
                imageUrl:
                  p === 100
                    ? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'
                    : j.imageUrl,
              }
            : j
        )
      )
      if (i < steps.length) setTimeout(tick, 900)
    }
    setTimeout(tick, 700)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="text-lg font-semibold">Refurbd · Workspace</div>
          <div className="flex items-center gap-2">
            <button className="border border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-2xl px-4 py-2 text-sm" onClick={addProject}>
              New project
            </button>
            <button className="bg-black text-white hover:bg-neutral-800 rounded-2xl px-4 py-2 text-sm" onClick={() => inputRef.current?.click()}>
              New upload
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-6">
              <div className="mb-3 text-sm font-semibold">Projects</div>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setCurrentId(p.id)}
                    className={
                      'rounded-xl border px-3 py-1.5 text-sm ' +
                      (currentId === p.id ? 'bg-black text-white' : 'border-neutral-300 hover:bg-neutral-50')
                    }
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-6">
              <div
                onClick={() => inputRef.current?.click()}
                className="rounded-xl border border-dashed border-neutral-300 px-5 py-10 text-center hover:bg-neutral-50 cursor-pointer"
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
                    <button className="bg-black text-white hover:bg-neutral-800 rounded-2xl px-4 py-2 text-sm" onClick={analyzePhoto}>
                      Analyze photo
                    </button>
                    <button className="border border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-2xl px-4 py-2 text-sm" onClick={generatePlan}>
                      Generate plan
                    </button>
                    <button className="text-neutral-900 hover:bg-neutral-100 rounded-2xl px-4 py-2 text-sm" onClick={() => { setFile(null); setPreview(null) }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-6">
              <div className="text-sm font-semibold mb-3">Renderings</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="aspect-video rounded-lg border bg-neutral-100" />
                <div className="aspect-video rounded-lg border bg-neutral-100" />
                <div className="aspect-video rounded-lg border bg-neutral-100" />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-6">
              <div className="text-sm font-semibold mb-3">Render Queue</div>
              {jobs.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-500">
                  No jobs yet. Upload a photo and click “Generate plan”.
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((j) => (
                    <div key={j.id} className="rounded-xl border border-neutral-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{j.name}</div>
                        <div className="text-xs text-neutral-500">{j.status}</div>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full bg-black transition-all" style={{ width: `${j.progress}%` }} />
                      </div>
                      {j.imageUrl && <img src={j.imageUrl} alt="result" className="mt-4 w-full rounded-xl border object-cover" />}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
