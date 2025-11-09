import { NextResponse } from "next/server";
import { cookies } from "next/headers";
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const backend = (u: string) => `${BACKEND_URL}${u}`;

export async function POST() {
  const token = cookies().get("token")?.value;
  const headers: Record<string, string> = {};
  if (token) headers["Cookie"] = `token=${token}`;
  const r = await fetch(backend("/auth/logout"), { method: "POST", headers, credentials: "include" });
  const text = await r.text();
  const resp = new NextResponse(text, { status: r.status, headers: { "content-type": "application/json" } });
  resp.cookies.set("token", "", { path: "/", maxAge: 0 });
  return resp;
}
