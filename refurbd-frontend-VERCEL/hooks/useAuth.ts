'use client'
import { useEffect, useState } from 'react'
import { login as apiLogin, register as apiRegister, me as apiMe, logout as apiLogout } from '@/lib/api'
import { useRouter } from 'next/navigation'
export type User = { id:number; email:string; full_name?:string|null }
export function useAuth() {
  const [user, setUser] = useState<User|null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  useEffect(()=>{ apiMe().then(setUser).catch(()=>{}).finally(()=>setLoading(false)) },[])
  async function login(email:string, password:string){ await apiLogin({email,password}); setUser(await apiMe()); router.push('/workspace') }
  async function register(email:string, password:string, full_name:string){ await apiRegister({email,password,full_name}); await login(email,password) }
  async function logout(){ await apiLogout(); setUser(null); router.push('/(auth)/login') }
  return { user, loading, login, register, logout }
}