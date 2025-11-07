
'use client'
import Container from '@/components/ui/container'
import AdminQueueTable from '@/components/AdminQueueTable'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminQueuePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(()=>{ if (!loading && !user) router.replace('/login?reason=admin') }, [user, loading, router])
  if (loading) return <div className="p-6 text-sm">Checking session…</div>
  if (!user) return null
  return (
    <Container className="py-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold">Admin • Queue</h1>
        <p className="text-xs text-slate-600 dark:text-slate-300">Monitor & control render/analysis jobs in real time.</p>
      </div>
      <AdminQueueTable />
    </Container>
  )
}
