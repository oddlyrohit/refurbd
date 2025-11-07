'use client'
import React, { useState } from 'react'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage(){
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string|null>(null)
  return (
    <section className="py-10">
      <Container>
        <Card className="mx-auto max-w-sm p-8 space-y-4">
          <div className="text-lg font-semibold">Create account</div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={async ()=>{ try{ await register(email,password,name) }catch(e:any){ setErr(e.message||'Failed') } }}>Create</Button>
          <div className="text-sm">Have an account? <Link className="underline" href="/(auth)/login">Log in</Link></div>
        </Card>
      </Container>
    </section>
  )
}