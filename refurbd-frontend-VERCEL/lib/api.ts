// lib/api.ts
// Mock API so the UI works now. Later, swap to real endpoints.
type PresignResp = { assetId: string; url: string }
type CommitReq = { assetId: string; projectId: string; room: string }
type AnalyzeReq = { assetId: string; stylePreset: string; palette: string[] }
type AnalyzeResp = { materials: string[]; notes: string }
type RenderReq = { projectId: string; assetId: string; variant: string }
type StartResp = { jobId: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const uid = () => Math.random().toString(36).slice(2)

export async function presignUpload(filename: string, _contentType: string): Promise<PresignResp> {
  // Pretend we created a presigned URL
  return { assetId: uid(), url: URL.createObjectURL(new Blob([`fake:${filename}`])) }
}

export async function uploadToPresigned(url: string, _file: File): Promise<void> {
  // Since it's a mock object URL, no actual PUT is needed.
  await sleep(300)
  URL.revokeObjectURL(url)
}

export async function commitAsset(_req: CommitReq): Promise<{ ok: true }> {
  await sleep(200)
  return { ok: true }
}

export async function analyze(_req: AnalyzeReq): Promise<AnalyzeResp> {
  await sleep(600)
  return {
    materials: ['Engineered stone benchtop', 'Sage subway tile', 'Brass tapware'],
    notes: 'Brighten benchtop to improve light and perceived space.',
  }
}

export async function startRender(_req: RenderReq): Promise<StartResp> {
  await sleep(200)
  const jobId = uid()
  // Kick off simulated progress loop
  simulateProgress(jobId)
  return { jobId }
}

/** Subscribe to progress updates for a single job (mock). */
export function onProgress(jobId: string, cb: (u: { progress: number; status: 'queued' | 'running' | 'done' | 'failed'; imageUrl?: string }) => void) {
  listeners.set(jobId, cb)
}

// ---- simple in-memory mock “scheduler” ----
const listeners = new Map<string, (u: { progress: number; status: 'queued' | 'running' | 'done' | 'failed'; imageUrl?: string }) => void>()

async function simulateProgress(jobId: string) {
  const milestones = [20, 50, 80, 100]
  for (const p of milestones) {
    await sleep(900)
    const status = p < 100 ? 'running' : 'done'
    const imageUrl =
      p === 100
        ? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'
        : undefined
    listeners.get(jobId)?.({ progress: p, status, imageUrl })
  }
  listeners.delete(jobId)
}
