
import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Renovate.AI',
  description: 'AI-powered renovation design for Australian homes'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="text-base font-extrabold tracking-tight">Renovate.AI</Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/#pricing" className="hover:opacity-80">Pricing</Link>
              <Link href="/workspace" className="hover:opacity-80">Workspace</Link>
              <Link href="/admin/queue" className="hover:opacity-80">Admin</Link>
              <Link href="/login" className="hover:opacity-80">Login</Link>
              <Link href="/register" className="hover:opacity-80">Register</Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
          © {new Date().getFullYear()} Renovate.AI • Made for Australia
        </footer>
      </body>
    </html>
  )
}
