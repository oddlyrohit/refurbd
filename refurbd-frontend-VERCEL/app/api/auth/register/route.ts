import { NextRequest } from "next/server";
import { forwardJSON } from "../common";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return forwardJSON(req, "/auth/register", { method: "POST", body: JSON.stringify(body) });
}
