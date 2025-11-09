// Central API helpers (stubs + simple proxies).
// Broad compatibility layer for legacy components.

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type Job = {
  id: string;
  status: JobStatus;
  progress: number;        // 0..100
  title?: string;
  name?: string;           // legacy alias used by some components
  createdAt: string;       // ISO
  updatedAt?: string;      // ISO (camelCase)
  updated_at?: string;     // ISO (snake_case)
  meta?: Record<string, any>;
};

export type PresignResult = { assetId: string; url: string };

// ---- Auth via our Next API proxy ----
export async function me() {
  const r = await fetch('/api/auth/me', { cache: 'no-store' });
  try { return await r.json(); } catch { return { ok: false }; }
}

export async function login(email: string, password: string) {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  return r.ok;
}

export async function register(email: string, password: string) {
  const r = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  return r.ok;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  return true;
}

// ---- Asset flow (stubs) ----
export async function presignUpload(filename: string, mime: string): Promise<PresignResult> {
  return { assetId: 'stub-' + Math.random().toString(36).slice(2), url: 'about:blank' };
}

export async function uploadToPresigned(url: string, file: Blob): Promise<boolean> {
  return true;
}

export async function commitAsset(args: { assetId: string; projectId: string; room: string }): Promise<boolean> {
  return true;
}

// ---- Jobs API (stubbed) ----
export async function listJobs(projectId?: string): Promise<Job[]> {
  const now = new Date();
  const iso = now.toISOString();
  return [
    { id: 'job-1', status: 'processing', progress: 42, title: 'Kitchen render', name: 'Kitchen render', createdAt: iso, updatedAt: iso, updated_at: iso },
    { id: 'job-2', status: 'queued',     progress: 0,  title: 'Bathroom render', name: 'Bathroom render', createdAt: iso, updatedAt: iso, updated_at: iso },
    { id: 'job-3', status: 'completed',  progress: 100, title: 'Living room', name: 'Living room', createdAt: iso, updatedAt: iso, updated_at: iso }
  ];
}

export const apiVersion = 'stub-4';
