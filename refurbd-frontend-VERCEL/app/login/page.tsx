"use client";
import { useState } from "react";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try { return [JSON.parse(text), text]; } catch { return [null, text]; }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      const [json, raw] = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(json?.error || raw || `HTTP ${res.status}`);
      }
      setStatus("Signed in. Cookie set. You can now use protected features.");
    } catch (err: any) {
      setStatus(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow">
        <h1 className="text-lg font-semibold">Sign in</h1>
        <input
          type="email"
          className="w-full rounded-xl border border-slate-200 px-3 py-3"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-xl border border-slate-200 px-3 py-3"
          placeholder="••••••••"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />
        <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white">Sign in</button>
        {status && <div className="text-sm text-slate-600">{status}</div>}
      </form>
    </div>
  );
}