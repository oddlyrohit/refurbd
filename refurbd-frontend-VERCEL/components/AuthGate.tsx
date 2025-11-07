
'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
export default function AuthGate({ children }: React.PropsWithChildren) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(()=>{ if (!loading && !user) router.replace('/login?reason=protected') },[loading,user,router])
  if (loading) return <div className="p-6 text-sm">Checking session…</div>
  if (!user) return null
  return <>{children}</>
}
