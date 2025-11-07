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
    <section className="hero-gradient section">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="h1">Renovation design, simplified.</h1>
          <p className="lead mx-auto mt-4 max-w-2xl">
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

      <section className="section">
        <div className="container grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Upload & Analyse', desc: 'Drop plans and photos. We extract key dimensions and generate options.' },
            { title: 'Live Progress', desc: 'WebSockets show 20/50/80% milestones. No page refreshes.' },
            { title: 'Secure Storage', desc: 'S3 with presigned URLs for safer asset access.' },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="h2 text-xl mb-2">{f.title}</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
          <div>© {new Date().getFullYear()} Refurbd</div>
          <div className="flex gap-4">
            <a className="link" href="/workspace">Workspace</a>
            <a className="link" href="/(auth)/login">Login</a>
          </div>
        </div>
      </footer>
