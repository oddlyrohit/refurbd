'use client'
import { useEffect, useState } from 'react'
export default function ThemeToggle(){
  const [dark, setDark] = useState(false)
  useEffect(()=>{
    const m = window.matchMedia('(prefers-color-scheme: dark)').matches
    const stored = localStorage.getItem('refurbd-theme') || (m ? 'charcoal' : 'light')
    document.documentElement.dataset.theme = stored === 'charcoal' ? 'charcoal' : 'light'
    setDark(stored === 'charcoal')
  },[])
  function flip(){
    const next = dark ? 'light' : 'charcoal'
    document.documentElement.dataset.theme = next
    localStorage.setItem('refurbd-theme', next)
    setDark(!dark)
  }
  return (
    <button onClick={flip} className="text-sm opacity-80 hover:opacity-100">
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}