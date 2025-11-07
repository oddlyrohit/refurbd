
'use client'
import { useEffect, useState } from 'react'
import { login as apiLogin, register as apiRegister, me as apiMe, logout as apiLogout } from '@/lib/api'
import { useRouter } from 'next/navigation'

export type User = { id: number; email: string; full_name: string; subscription_tier?: 'free'|'basic'|'pro'|'enterprise'; role?: 'admin'|'user' }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    apiMe().then(setUser).catch(() => { localStorage.removeItem('token') }).finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    await apiLogin({ email, password })
    const u = await apiMe(); setUser(u)
    const redirect = sessionStorage.getItem('redirect_after_login')
    if (redirect) { sessionStorage.removeItem('redirect_after_login'); router.push(redirect) }
    else router.push('/workspace')
  }

  async function register(body: { email: string; password: string; full_name: string }) {
    await apiRegister(body)
    const u = await apiMe(); setUser(u)
    const redirect = sessionStorage.getItem('redirect_after_login')
    if (redirect) { sessionStorage.removeItem('redirect_after_login'); router.push(redirect) }
    else router.push('/workspace')
  }

  async function logout() {
    await apiLogout()
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return { user, loading, login, register, logout }
}
