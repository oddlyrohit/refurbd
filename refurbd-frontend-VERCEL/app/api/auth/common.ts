import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL!; // e.g. https://your-railway.onrender.com or .up.railway.app

function rewriteSetCookie(raw: string | null) {
  if (!raw) return [];
  // Some runtimes expose multiple cookies concatenated; keep simple & safe:
  // 1) Remove explicit Domain so cookie becomes host-only (refurbd.com.au)
  // 2) Force Secure + SameSite=None for cross-site iframes/fetch
  const single = raw.replace(/;\s*Domain=[^;]+/gi, "")
                    .replace(/;\s*HttpOnly/gi, "; HttpOnly")
                    .replace(/;\s*Secure/gi, "; Secure")
                    .replace(/;\s*SameSite=[^;]+/gi, "; SameSite=None");
  return [single];
}

async function forwardJSON(req: NextRequest, path: string, init: RequestInit) {
  try {
    const res = await fetch(BACKEND + path, {
      ...init,
      // Node runtime on Vercel, server-to-server fetch
      headers: { "content-type": "application/json", ...(init.headers || {}) },
      redirect: "manual",
    });

    const bodyText = await res.text();
    let data: any;
    try { data = bodyText ? JSON.parse(bodyText) : {}; } catch { data = { ok: res.ok }; }

    const resp = NextResponse.json(data, { status: res.status });
    // Copy/normalize cookie(s) from upstream -> our domain
    const sc = (res.headers as any).getSetCookie?.() ?? null;
    const raw = sc ? sc.join("\n") : res.headers.get("set-cookie");
    for (const c of rewriteSetCookie(raw)) {
      if (c) resp.headers.append("set-cookie", c);
    }
    return resp;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "upstream_error", detail: String(e?.message || e) }, { status: 502 });
  }
}

export { forwardJSON };
