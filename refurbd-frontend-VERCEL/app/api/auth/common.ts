import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function readEnv(name: string, fallback = ""): string {
  const v = process.env[name] || (process.env["NEXT_PUBLIC_" + name] ?? "");
  return (v || fallback) as string;
}

function normalizeBackendUrl(v: string): string {
  let u = (v || "").trim();
  if (!u) return "";
  // If scheme missing, assume https (Railway/Render/Heroku defaults)
  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }
  // strip trailing slash
  u = u.replace(/\/$/, "");
  return u;
}

function readBackendUrl(): string {
  const raw = readEnv("BACKEND_URL", "");
  return normalizeBackendUrl(raw);
}

function readAuthPrefix(): string {
  // e.g. "/api/auth" or "/v1/auth"
  let p = readEnv("BACKEND_AUTH_PREFIX", "");
  if (!p) return "";
  if (!p.startsWith("/")) p = "/" + p;
  return p.replace(/\/$/, "");
}

const BACKEND = readBackendUrl();
const AUTH_PREFIX = readAuthPrefix();

function rewriteSetCookie(raw: string | null) {
  if (!raw) return [];
  const single = raw.replace(/;\s*Domain=[^;]+/gi, "")
                    .replace(/;\s*HttpOnly/gi, "; HttpOnly")
                    .replace(/;\s*Secure/gi, "; Secure")
                    .replace(/;\s*SameSite=[^;]+/gi, "; SameSite=None");
  return [single];
}

async function fetchJSON(url: string, init: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    redirect: "manual",
  });
  const text = await r.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: r.ok }; }
  return { r, data };
}

async function forwardWithFallbacks(req: NextRequest, paths: string[], init: RequestInit) {
  if (!BACKEND) {
    return NextResponse.json({ ok: false, error: "config_error", detail: "BACKEND_URL is not set" }, { status: 500 });
  }
  const candidates = [
    ...paths.map(p => `${AUTH_PREFIX}${p}`),
    ...paths.map(p => `/api/auth${p}`),
    ...paths.map(p => `/auth${p}`),
    ...paths.map(p => `${p}`),
  ].map(p => (BACKEND + p).replace(/\/+$/, ""));

  let last: any = null;
  for (const url of candidates) {
    try {
      const { r, data } = await fetchJSON(url, init);
      if (r.status !== 404) {
        const resp = NextResponse.json(data, { status: r.status });
        const sc = (r.headers as any).getSetCookie?.() ?? null;
        const raw = sc ? sc.join("\n") : r.headers.get("set-cookie");
        for (const c of rewriteSetCookie(raw)) {
          if (c) resp.headers.append("set-cookie", c);
        }
        return resp;
      }
      last = { status: r.status, url };
    } catch (e: any) {
      last = { error: String(e?.message || e), url };
    }
  }
  return NextResponse.json({ ok: false, error: "upstream_not_found", tried: candidates, last, BACKEND, AUTH_PREFIX }, { status: 404 });
}

export { forwardWithFallbacks, BACKEND, AUTH_PREFIX };
