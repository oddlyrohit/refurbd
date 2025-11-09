import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.BACKEND_URL!;

export async function GET(req: NextRequest) {
  try {
    // forward cookies we set on our domain to the backend
    const cookie = req.headers.get("cookie") || "";
    const res = await fetch(BACKEND + "/auth/me", { headers: { cookie }, cache: "no-store" });
    const text = await res.text();
    let json: any; try { json = text ? JSON.parse(text) : {}; } catch { json = { ok: res.ok }; }
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "upstream_error", detail: String(e?.message || e) }, { status: 502 });
  }
}
