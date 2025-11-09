import { NextRequest } from "next/server";
import { forwardWithFallbacks } from "../common";

export async function POST(req: NextRequest) {
  return forwardWithFallbacks(req,
    ["/auth/logout", "/api/auth/logout", "/logout"],
    { method: "POST", body: "{}" });
}
