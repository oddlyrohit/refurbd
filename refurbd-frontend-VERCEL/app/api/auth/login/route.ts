import { NextRequest } from "next/server";
import { forwardWithFallbacks } from "../common";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return forwardWithFallbacks(req,
    ["/auth/login", "/api/auth/login", "/login"],
    { method: "POST", body: JSON.stringify(body) });
}
