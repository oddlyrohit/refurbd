
# Renovate.AI — Frontend v7 (Aligned to FINAL backend)

This build auto-detects common API paths and tries multiple **fallbacks** so it stays compatible with your **FINAL** backend.

## What’s inside
- Next.js 14 (App Router) + Tailwind (dark/light)
- Landing + Pricing (Free/Basic/Pro/Enterprise)
- Auth (cookie-first httpOnly, optional JWT if backend returns `access_token`)
- Workspace: uploader, status, renders grid
- **Render Queue** card with live progress/ETA
- **Admin Queue** page with filters + Pause/Resume/Retry/Cancel
- SSE-first realtime (per-project and global), WS fallback

## Env
```bash
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE_URL to your backend origin, e.g.
# NEXT_PUBLIC_API_BASE_URL=https://api.renovate.example.com
# NEXT_PUBLIC_WS_BASE_URL=wss://api.renovate.example.com (optional)
npm i && npm run dev
```

## Backend endpoints (detected from your archive)
{
  "auth": [],
  "projects": [],
  "renderings": [],
  "billing": [
    "POST /portal"
  ],
  "jobs": [
    "GET /jobs",
    "GET /jobs/events",
    "POST /jobs/{job_id}/cancel",
    "POST /jobs/{job_id}/pause",
    "POST /jobs/{job_id}/resume",
    "POST /jobs/{job_id}/retry"
  ],
  "events": [
    "GET /{project_id}/events"
  ],
  "admin": [],
  "other": [
    "DELETE /{project_id}",
    "GET /",
    "GET /health",
    "GET /me",
    "GET /project/{project_id}",
    "GET /search",
    "GET /usage",
    "GET /{project_id}",
    "GET /{rendering_id}",
    "GET /{rendering_id}/download",
    "POST /",
    "POST /create-checkout",
    "POST /login",
    "POST /logout",
    "POST /register",
    "POST /webhooks/stripe",
    "POST /{project_id}/analyze",
    "POST /{rendering_id}/edit"
  ]
}

If any path differs in production, the client **tries alternatives** automatically.

## Cookie/CORS (server)
- Cookies: `HttpOnly; Secure; SameSite=None; Path=/`
- CORS: `Access-Control-Allow-Origin: <frontend-origin>` and `Access-Control-Allow-Credentials: true`

## Deployment quickstart
- **Frontend (Vercel/Netlify/Render):**
  - Set `NEXT_PUBLIC_API_BASE_URL` (and `NEXT_PUBLIC_WS_BASE_URL` if you expose WS separately)
  - Build: `npm run build`; Start: `npm start`
- **Nginx reverse-proxy (if self-hosting):**
  - Proxy pass `/api` and `/ws` to backend; enable websocket upgrade headers
  - Add `Access-Control-Allow-Credentials: true` and allow the frontend origin

## Admin gating
If GET /auth/me includes a `role` field equal to `"admin"`, you can enforce server-side RBAC. The page is already soft-gated on the client.
