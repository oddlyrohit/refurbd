import { NextRequest, NextResponse } from "next/server";
import { BACKEND } from "../common";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";
    // Try both forms for 'me'
    const urls = ["/auth/me", "/api/auth/me", "/me"].map(p => BACKEND + p);
    for (const url of urls) {
      const r = await fetch(url, { headers: { cookie }, cache: "no-store" });
      if (r.status !== 404) {
        const text = await r.text();
        let data: any; try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: r.ok }; }
        return NextResponse.json(data, { status: r.status });
      }
    }
    return NextResponse.json({ ok: false, error: "upstream_not_found", tried: urls }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "upstream_error", detail: String(e?.message || e) }, { status: 502 });
  }
}
