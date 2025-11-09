// lib/api.ts
// -----------------------------------------------------------------------------
// This file is a temporary frontend-only API layer.
// It lets Vercel build without throwing "not exported" errors.
// Later we will connect these functions to the real backend (Railway FastAPI).
// -----------------------------------------------------------------------------

// Types that the UI expects
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type Job = {
  id: string;
  status: JobStatus;
  progress: number; // 0 to 100
  updated_at: string; // ISO timestamp
  thumbnail_url?: string; // preview image if available
  title?: string; // optional label in UI
};

export type User = {
  id: string;
  email: string;
  name?: string;
};

// -----------------------------------------------------------------------------
// CONFIG
// We'll point this to your backend later. For now we keep it here so code compiles.
// You can change NEXT_PUBLIC_API_URL in Vercel env later to hit live backend.
// -----------------------------------------------------------------------------
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.refurbd.com.au";

// Small helper for future real requests
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // NOTE: For now we are NOT actually calling the backend.
  // We'll return mock data below instead of using this helper.
  // This helper stays here because later we WILL call the backend.
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
    // credentials: "include", // we'll use this later if we go cookie-based auth
  });

  if (!res.ok) {
    // Throw something readable
    const text = await res.text();
    throw new Error(
      `API error ${res.status} ${res.statusText} for ${path}: ${text}`
    );
  }

  // Try json, fallback empty object
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

// -----------------------------------------------------------------------------
// AUTH / USER FUNCTIONS
// Right now they just return mock data so your pages can render without breaking.
// Later we will wire them to FastAPI endpoints like /auth/login, /auth/me, etc.
// -----------------------------------------------------------------------------

export async function me(): Promise<User | null> {
  // mock "logged out"
  return null;

  // later (example):
  // return apiFetch<User>("/auth/me", { method: "GET" })
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: boolean; user?: User; error?: string }> {
  // mock successful login
  return {
    ok: true,
    user: {
      id: "user_123",
      email,
      name: "Demo User",
    },
  };

  // later:
  // return apiFetch<{ ok: boolean; user: User }>("/auth/login", {
  //   method: "POST",
  //   body: JSON.stringify({ email, password }),
  // })
}

export async function register(
  email: string,
  password: string
): Promise<{ ok: boolean; user?: User; error?: string }> {
  // mock successful signup
  return {
    ok: true,
    user: {
      id: "user_456",
      email,
      name: "New User",
    },
  };

  // later:
  // return apiFetch<{ ok: boolean; user: User }>("/auth/register", {
  //   method: "POST",
  //   body: JSON.stringify({ email, password }),
  // })
}

export async function logout(): Promise<{ ok: boolean }> {
  // mock logout
  return { ok: true };

  // later:
  // return apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" })
}

// -----------------------------------------------------------------------------
// JOB / QUEUE FUNCTIONS
// Your QueueCard component is trying to import listJobs() and then display them.
// We give it a mock list so the UI builds and renders.
// Later we'll hit your FastAPI: e.g. GET /jobs or /projects/:id/jobs
// -----------------------------------------------------------------------------

export async function listJobs(): Promise<Job[]> {
  // mock 3 jobs just to make the dashboard look alive
  const now = new Date().toISOString();

  return [
    {
      id: "job_001",
      status: "processing",
      progress: 20,
      updated_at: now,
      title: "Kitchen redesign v1",
      thumbnail_url:
        "https://via.placeholder.com/128x96.png?text=Kitchen+Render",
    },
    {
      id: "job_002",
      status: "processing",
      progress: 50,
      updated_at: now,
      title: "Bathroom modern option B",
      thumbnail_url:
        "https://via.placeholder.com/128x96.png?text=Bathroom+Render",
    },
    {
      id: "job_003",
      status: "completed",
      progress: 100,
      updated_at: now,
      title: "Living room Scandinavian style",
      thumbnail_url:
        "https://via.placeholder.com/128x96.png?text=Living+Room+Final",
    },
  ];

  // later:
  // return apiFetch<Job[]>("/jobs", { method: "GET" })
}

// -----------------------------------------------------------------------------
// OPTIONAL: helper to fetch a single job by id (future-safe)
// -----------------------------------------------------------------------------
export async function getJob(jobId: string): Promise<Job | null> {
  // mock
  const jobs = await listJobs();
  return jobs.find((j) => j.id === jobId) || null;

  // later:
  // return apiFetch<Job>(`/jobs/${jobId}`, { method: "GET" })
}
