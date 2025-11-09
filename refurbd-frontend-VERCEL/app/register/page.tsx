"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setStatus("Creating account...");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      setStatus("Account created. You can now sign in.");
    } catch (err: any) {
      setStatus(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow">
        <h1 className="text-lg font-semibold">Create account</h1>
        <input type="email" className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white">Register</button>
        {status && <div className="text-sm text-slate-600 whitespace-pre-wrap">{status}</div>}
      </form>
    </div>
  );
}
