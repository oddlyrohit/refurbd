import { NextRequest, NextResponse } from "next/server";

// Ensure Node.js runtime so process.env and headers APIs are available on Vercel.
export const runtime = "nodejs";

function readBackendUrl(): string {
  // Prefer server-only var; fall back to NEXT_PUBLIC_* if someone set that.
  const v = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
  return (v || "").replace(/\/$/, ""); // trim trailing slash
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

async function forwardJSON(req: NextRequest, path: string, init: RequestInit) {
  if (!BACKEND) {
    return NextResponse.json(
      { ok: false, error: "config_error", detail: "BACKEND_URL is not set on the server" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(BACKEND + path, {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers || {}) },
      redirect: "manual",
    });

    const bodyText = await res.text();
    let data: any;
    try { data = bodyText ? JSON.parse(bodyText) : {}; } catch { data = { ok: res.ok }; }

    const resp = NextResponse.json(data, { status: res.status });
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

export { forwardJSON, BACKEND };
