// Runtime check route for BACKEND_URL presence (no secrets leaked).
import { NextResponse } from "next/server";
import { BACKEND } from "../common";

export const runtime = "nodejs";

export async function GET() {
  const ok = !!BACKEND;
  return NextResponse.json({
    ok,
    backendUrlDefined: ok,
    backendUrlPreview: BACKEND ? BACKEND.replace(/https?:\/\//, "").slice(0, 60) : null
  });
}
