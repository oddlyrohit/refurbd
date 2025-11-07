export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || API_BASE.replace(/^http/, 'ws')

function withCreds(init?: RequestInit): RequestInit {
  return { credentials: 'include', ...(init||{}), headers: { 'Content-Type':'application/json', ...(init?.headers||{}) } }
}

async function req(path: string, init?: RequestInit) {
  const res = await fetch(API_BASE + path, withCreds(init))
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText)
  return res.json().catch(()=> ({}))
}

// AUTH
export async function login(body: { email: string; password: string }) { return req('/api/auth/login', { method:'POST', body: JSON.stringify(body) }) }
export async function register(body: { email: string; password: string; full_name: string }) { return req('/api/auth/register', { method:'POST', body: JSON.stringify(body) }) }
export async function me() { return req('/api/auth/me') }
export async function logout() { return req('/api/auth/logout', { method:'POST' }) }

// PROJECTS
export async function listProjects(): Promise<any[]> { return req('/api/projects') }
export async function getProject(id: number): Promise<any> { return req('/api/projects/'+id) }
export async function listRenderings(id: number): Promise<any[]> { return req(`/api/projects/${id}/renderings`) }

// JOBS
export async function listJobs(projectId: number): Promise<any[]> { return req(`/api/projects/${projectId}/jobs`) }

// WebSocket helper
export function openProjectWS(projectId: number) {
  if (typeof window === 'undefined') return null
  return new WebSocket(`${WS_BASE}/api/ws/projects/${projectId}`)
}
