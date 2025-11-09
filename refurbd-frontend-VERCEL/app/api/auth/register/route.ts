import { NextResponse } from "next/server";
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const backend = (u: string) => `${BACKEND_URL}${u}`;

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(backend("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "include",
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status, headers: { "content-type": "application/json" } });
}
