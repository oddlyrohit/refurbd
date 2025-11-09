// Central API helpers (stubs + simple proxies).
// This file is safe for production build and can be swapped later for real endpoints.

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type Job = {
  id: string;
  status: JobStatus;
  progress: number;        // 0..100
  title?: string;
  createdAt: string;       // ISO string
  updatedAt?: string;      // ISO string
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

// ---- Asset flow (stubs you can replace later) ----
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
  // Provide a stable shape so UI can render in dev/prod builds.
  const now = new Date();
  return [
    { id: 'job-1', status: 'processing', progress: 42, title: 'Kitchen render', createdAt: now.toISOString() },
    { id: 'job-2', status: 'queued',     progress: 0,  title: 'Bathroom render', createdAt: now.toISOString() },
    { id: 'job-3', status: 'completed',  progress: 100, title: 'Living room', createdAt: now.toISOString() }
  ];
}

export const apiVersion = 'stub-2';
