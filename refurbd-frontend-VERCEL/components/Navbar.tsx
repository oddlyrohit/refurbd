'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function Navbar(){
  const path = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur dark:bg-slate-900/70">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="text-lg font-semibold">Refurbd</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className={path?.startsWith('/workspace') ? 'underline' : 'opacity-80 hover:opacity-100'} href="/workspace">Workspace</Link>
          <Link className={path?.includes('/(auth)') ? 'underline' : 'opacity-80 hover:opacity-100'} href="/(auth)/login">Login</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}