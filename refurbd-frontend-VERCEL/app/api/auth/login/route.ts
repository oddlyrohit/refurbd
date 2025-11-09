import { NextResponse } from "next/server";
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const backend = (u: string) => `${BACKEND_URL}${u}`;

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(backend("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "include",
  });
  const text = await r.text();
  const setCookie = r.headers.get("set-cookie") || "";
  const m = setCookie.match(/token=([^;]+)/);
  const resp = new NextResponse(text, { status: r.status, headers: { "content-type": "application/json" } });
  if (m) {
    const isProd = process.env.NODE_ENV === "production";
    resp.cookies.set("token", m[1], { httpOnly: true, sameSite: isProd ? "none" : "lax", secure: isProd, path: "/" });
  }
  return resp;
}
