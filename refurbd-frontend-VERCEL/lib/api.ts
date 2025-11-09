// /lib/api.ts
const BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export type Job = {
  id: string;
  name?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  created_at?: string;
  updated_at?: string;
};

type LoginBody = { email: string; password: string };
type RegisterBody = { name: string; email: string; password: string };

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  // Try to parse JSON error bodies nicely
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = (data && (data.detail || data.message)) || msg;
    } catch (_) {
      // ignore
    }
    throw new Error(msg || `Request failed: ${res.status}`);
  }

  // Some endpoints might return no content
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export async function me() {
  return http('/auth/me');
}

export async function login(body: LoginBody) {
  return http('/auth/login', { method: 'POST', body: JSON.stringify(body) });
}

export async function register(body: RegisterBody) {
  return http('/auth/register', { method: 'POST', body: JSON.stringify(body) });
}

export async function logout() {
  return http('/auth/logout', { method: 'POST' });
}

/**
 * List render jobs. Optional projectId filters results.
 * Always returns an array (swallows errors to keep UI stable).
 */
export async function listJobs(projectId?: string): Promise<Job[]> {
  try {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return await http<Job[]>(`/jobs${q}`);
  } catch {
    // If your backend doesn't have this yet, don't break the build/UI.
    return [];
  }
}
