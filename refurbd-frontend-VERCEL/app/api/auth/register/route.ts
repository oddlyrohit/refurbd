import { NextRequest } from "next/server";
import { forwardWithFallbacks } from "../common";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return forwardWithFallbacks(req,
    ["/auth/register", "/api/auth/register", "/register"],
    { method: "POST", body: JSON.stringify(body) });
}
