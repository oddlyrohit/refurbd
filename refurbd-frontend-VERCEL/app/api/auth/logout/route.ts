import { NextRequest } from "next/server";
import { forwardWithFallbacks } from "../common";

export async function POST(req: NextRequest) {
  return forwardWithFallbacks(req,
    ["/logout"],
    { method: "POST", body: "{}" });
}
