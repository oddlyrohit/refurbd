import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Refurbd — AI Renovation',
  description: 'Generate renovation analyses and renderings with live progress.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-white to-slate-50">{children}</main>
      </body>
    </html>
  )
}
