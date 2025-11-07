
'use client'
import { useEffect, useState } from 'react'
import { getUsage } from '@/lib/api'
export function useUsage() {
  const [usage, setUsage] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ getUsage().then(setUsage).finally(()=>setLoading(false)) },[])
  return { usage, loading, refresh: async ()=>setUsage(await getUsage()) }
}
