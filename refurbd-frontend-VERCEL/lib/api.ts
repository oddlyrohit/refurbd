
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
export const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE_URL || (API_BASE.replace(/^http/, 'ws'))

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function withOpts(init?: RequestInit): RequestInit {
  return { credentials: 'include', ...init, headers: { ...(init?.headers || {}), ...authHeaders() } }
}

async function handle(res: Response) {
  if (!res.ok) {
    if (res.status === 401) throw new Error('AUTH')
    let detail = 'Request failed'
    try { const data = await res.json(); detail = (data && (data.detail || data.message)) || detail } catch {}
    throw new Error(detail)
  }
  if (res.status === 204) return null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.blob()
}

// Helpers to try multiple paths until one works
async function tryPaths(paths: string[], init?: RequestInit) {
  let last: Response | null = null
  for (const p of paths) {
    try { const res = await fetch(`${API_BASE}${p}`, withOpts(init)); last = res; if (res.ok) return handle(res) } catch { }
  }
  if (last) return handle(last)
  throw new Error('No working endpoint')
}

// AUTH
export async function register(body: { email: string; password: string; full_name: string }) {
  return tryPaths(["/api/auth/register", "/auth/register"], { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
}
export async function login(body: { email: string; password: string }) {
  const data: any = await tryPaths(["/api/auth/login", "/auth/login"], { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
  if (data?.access_token) localStorage.setItem('token', data.access_token)
  return data
}
export async function me() {
  return tryPaths(["/api/auth/me", "/auth/me"], {})
}
export async function logout() {
  try { await tryPaths(["/api/auth/logout", "/auth/logout"], { method:'POST' }) } catch { }
}

// Projects
async function baseGet(paths: string[], suffix='') {
  let last: Response | null = null
  for (const p of paths) {
    const url = `${API_BASE}${p}${suffix}`
    try { const res = await fetch(url, withOpts()); last = res; if (res.ok) return handle(res) } catch { }
  }
  if (last) return handle(last)
  throw new Error('No working endpoint')
}

async function basePost(paths: string[], suffix='', init?: RequestInit) {
  let last: Response | null = null
  for (const p of paths) {
    const url = `${API_BASE}${p}${suffix}`
    try { const res = await fetch(url, withOpts(init)); last = res; if (res.ok) return handle(res) } catch { }
  }
  if (last) return handle(last)
  throw new Error('No working endpoint')
}

const PROJECTS_BASES = ["/api/projects", "/projects"]
const RENDERINGS_BASES = ["/api/renderings", "/renderings"]

export async function listProjects(skip=0, limit=50) {
  return baseGet(PROJECTS_BASES, `/?skip=${skip}&limit=${limit}`)
}
export async function getProject(id: number) {
  return baseGet(PROJECTS_BASES, `/${id}`)
}
export async function deleteProject(id: number) {
  return basePost(PROJECTS_BASES, `/${id}`, { method:'DELETE' })
}
export async function createProject(form: FormData) {
  return basePost(PROJECTS_BASES, `/`, { method:'POST', body: form })
}
export async function startAnalyze(projectId: number, budget?: number) {
  return basePost(PROJECTS_BASES, `/${projectId}/analyze`, { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ project_id: projectId, budget_constraint: budget }) })
}

// Renderings
export async function listRenderings(projectId: number) {
  return baseGet(RENDERINGS_BASES, `/project/${projectId}`)
}
export function renderingDownloadUrl(renderingId: number, opts?: { thumb?: boolean }) {
  const base = `${API_BASE}${RENDERINGS_BASES[0]}/${renderingId}/download`
  return opts?.thumb ? `${base}?thumb=1` : base
}

// Billing
export async function getUsage() {
  return tryPaths(["/api/billing/usage", "/billing/usage"], {})
}
export async function createCheckout(tier: 'basic'|'pro', successUrl: string, cancelUrl: string) {
  return tryPaths(["/api/billing/create-checkout", "/billing/create-checkout"], { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ tier, success_url: successUrl, cancel_url: cancelUrl }) })
}
export async function createPortal(returnUrl: string) {
  return tryPaths(["/api/billing/portal", "/billing/portal"], { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ return_url: returnUrl }) })
}

// Realtime (per-project)
export function projectEventStream(projectId: number) {
  const urlCandidates = PROJECTS_BASES.map(p => `${API_BASE}${p}/${projectId}/events`)
  for (const url of urlCandidates) {
    try { return { type:'sse' as const, stream: new EventSource(url, { withCredentials: true }) } } catch {}
  }
  return null
}
export function projectWebSocket(projectId: number) {
  const paths = PROJECTS_BASES.map(p => p.replace(/^http/, 'ws')).map(p => `${WS_BASE}/ws${p}/${projectId}`)
  for (const url of paths) {
    try { return { type:'ws' as const, socket: new WebSocket(url) } } catch {}
  }
  return null
}

// Admin queue (global)
export async function adminListJobs(params: { status?: string; type?: string; q?: string; limit?: number; cursor?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.type) qs.set('type', params.type)
  if (params.q) qs.set('q', params.q)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.cursor) qs.set('cursor', params.cursor)

  let last: Response | null = null
  for (const base of ["/jobs", "/api/admin/jobs", "/api/jobs"]) {
    const url = `${API_BASE}${base}?${qs.toString()}`
    try { const res = await fetch(url, withOpts()); last = res; if (res.ok) return handle(res) } catch {}
  }
  if (last) return handle(last)
  return { items: [], next_cursor: null }
}

export function adminQueueEventStream() {
  for (const url of ["/jobs/events", "/api/admin/jobs/events", "/api/jobs/events"].map(p => `${API_BASE}${p}`)) {
    try { return { type:'sse' as const, stream: new EventSource(url, { withCredentials: true }) } } catch {}
  }
  return null
}
export function adminQueueWebSocket() {
  const cands = ['/ws/admin/jobs','/ws/jobs']
  for (const url of cands.map(p => `${WS_BASE}${p}`)) {
    try { return { type:'ws' as const, socket: new WebSocket(url) } } catch {}
  }
  return null
}

async function postAdmin(paths: string[]) {
  let last: Response | null = null
  for (const p of paths) {
    try { const res = await fetch(`${API_BASE}${p}`, withOpts({ method:'POST' })); last = res; if (res.ok) return handle(res) } catch {}
  }
  if (last) return handle(last)
  throw new Error('Action failed')
}

export async function adminPauseJob(id: number) { return postAdmin(["/jobs/${id}/pause", "/api/admin/jobs/${id}/pause", "/api/jobs/${id}/pause"]) }
export async function adminResumeJob(id: number) { return postAdmin(["/jobs/${id}/resume", "/api/admin/jobs/${id}/resume", "/api/jobs/${id}/resume"]) }
export async function adminRetryJob(id: number) { return postAdmin(["/jobs/${id}/retry", "/api/admin/jobs/${id}/retry", "/api/jobs/${id}/retry"]) }
export async function adminCancelJob(id: number) { return postAdmin(["/jobs/${id}/cancel", "/api/admin/jobs/${id}/cancel", "/api/jobs/${id}/cancel"]) }
