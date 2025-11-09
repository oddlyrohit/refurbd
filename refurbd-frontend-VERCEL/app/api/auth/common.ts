import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function readBackendUrl(): string {
  const v = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
  return (v || "").replace(/\/$/, "");
}
const BACKEND = readBackendUrl();

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
  let last: any = null;
  for (const p of paths) {
    try {
      const { r, data } = await fetchJSON(BACKEND + p, init);
      // Accept any non-404 result
      if (r.status !== 404) {
        const resp = NextResponse.json(data, { status: r.status });
        const sc = (r.headers as any).getSetCookie?.() ?? null;
        const raw = sc ? sc.join("\n") : r.headers.get("set-cookie");
        for (const c of rewriteSetCookie(raw)) {
          if (c) resp.headers.append("set-cookie", c);
        }
        return resp;
      }
      last = { status: r.status, data };
    } catch (e: any) {
      last = { error: String(e?.message || e) };
    }
  }
  return NextResponse.json({ ok: false, error: "upstream_not_found", tried: paths, last }, { status: 404 });
}

export { forwardWithFallbacks, BACKEND };
