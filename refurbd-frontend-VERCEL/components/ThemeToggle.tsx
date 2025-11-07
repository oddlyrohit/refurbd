
'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
export default function ThemeToggle({ className='' }: { className?: string }) {
  const [dark, setDark] = useState(false)
  useEffect(()=>{
    const initial = localStorage.getItem('theme')==='dark'
    setDark(initial); document.documentElement.classList.toggle('dark', initial)
  },[])
  useEffect(()=>{
    document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark?'dark':'light')
  },[dark])
  return <button className={`inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-slate-200 dark:ring-slate-700 ${className}`} onClick={()=>setDark(d=>!d)} aria-label="Toggle theme">{dark?<Sun className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}</button>
}
