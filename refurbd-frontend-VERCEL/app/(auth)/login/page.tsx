'use client'
import React, { useState } from 'react'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage(){
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string|null>(null)
  return (
    <Container>
      <Card className="max-w-sm mx-auto space-y-3">
        <h1 className="text-lg font-semibold">Log in</h1>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <Button onClick={async ()=>{ try{ await login(email,password) }catch(e:any){ setErr(e.message||'Failed') } }}>Login</Button>
        <div className="text-sm">No account? <Link className="underline" href="/(auth)/register">Register</Link></div>
      </Card>
    </Container>
  )
}