import { NextRequest, NextResponse } from "next/server";
import { BACKEND, AUTH_PREFIX } from "../common";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const candidates = [
    `${BACKEND}${AUTH_PREFIX}/me`,
    `${BACKEND}/api/auth/me`,
    `${BACKEND}/auth/me`,
    `${BACKEND}/me`,
  ];
  for (const url of candidates) {
    const r = await fetch(url, { headers: { cookie }, cache: "no-store" });
    if (r.status !== 404) {
      const text = await r.text();
      let data: any; try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: r.ok }; }
      return NextResponse.json(data, { status: r.status });
    }
  }
  return NextResponse.json({ ok: false, error: "upstream_not_found", tried: candidates }, { status: 404 });
}
