import Link from 'next/link'
import Container from '@/components/ui/Container'

export const metadata = {
  title: 'Refurbd — Renovation AI',
  description: 'Generate renovation analyses and renderings with live progress.',
  openGraph: {
    title: 'Refurbd — Renovation AI',
    description: 'Generate renovation analyses and renderings with live progress.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.refurbd.com.au',
    siteName: 'Refurbd',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    locale: 'en_AU', type: 'website'
  },
  twitter: { card: 'summary_large_image', title: 'Refurbd', description: 'Renovation AI', images: ['/og.png'] }
}

export default function Home() {
  return (
    <section className="hero-gradient py-20">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Renovation design, simplified.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
            Upload, analyse, and render options. Track job progress live via WebSockets at 20/50/80% milestones.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/(auth)/login" className="btn btn-primary">Get started</Link>
            <Link href="/workspace" className="btn border">Open Workspace</Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
