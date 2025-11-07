'use client'
import React, { useState } from 'react'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage(){
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string|null>(null)
  return (
    <Container>
      <Card className="max-w-sm mx-auto space-y-3">
        <h1 className="text-lg font-semibold">Create account</h1>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <input className="w-full rounded border p-2" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <Button onClick={async ()=>{ try{ await register(email,password,name) }catch(e:any){ setErr(e.message||'Failed') } }}>Register</Button>
        <div className="text-sm">Have an account? <Link className="underline" href="/(auth)/login">Log in</Link></div>
      </Card>
    </Container>
  )
}