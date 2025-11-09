// Universal API helpers (client-safe).
// We implement only what's needed to satisfy current components and pass build.
// Replace with real implementations as your backend endpoints are finalized.

export type PresignResult = { assetId: string; url: string };

// --- Auth convenience (proxy to Next API routes) ---
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

// --- Asset flow stubs (compile-time safe) ---
export async function presignUpload(filename: string, mime: string): Promise<PresignResult> {
  // TODO: replace with backend presign endpoint and return real upload URL
  // Stub returns a no-op URL; callers should handle failures gracefully.
  return { assetId: 'stub-' + Math.random().toString(36).slice(2), url: 'about:blank' };
}

export async function uploadToPresigned(url: string, file: Blob): Promise<boolean> {
  // TODO: PUT file to the presigned URL; for now, succeed without uploading.
  return true;
}

export async function commitAsset(args: { assetId: string; projectId: string; room: string }): Promise<boolean> {
  // TODO: send commit metadata to backend after successful upload.
  return true;
}

// --- Misc placeholder exports to satisfy any stray imports ---
export const apiVersion = 'stub-1';
