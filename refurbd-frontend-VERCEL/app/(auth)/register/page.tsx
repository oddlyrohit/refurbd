
'use client'
import React, { useState } from 'react'
import Container from '@/components/ui/container'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const [full_name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    try { await register({ full_name, email, password }) }
    catch (e:any) { setErr(e.message || 'Registration failed') }
    finally { setBusy(false) }
  }

  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-md p-6">
        <h1 className="mb-2 text-xl font-bold">Create account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Full name" value={full_name} onChange={(e)=>setName(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          {err && <div className="text-xs text-rose-600">{err}</div>}
          <Button className="w-full" disabled={busy}>{busy?'Creating…':'Create account'}</Button>
          <div className="text-center text-xs">Already have an account? <Link href="/login" className="underline">Sign in</Link></div>
        </form>
      </Card>
    </Container>
  )
}
