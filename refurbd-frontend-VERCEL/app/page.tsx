// app/page.tsx
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="text-lg font-semibold">Refurbd</div>
          <nav className="flex items-center gap-4">
            <Link className="text-neutral-900 hover:bg-neutral-100 rounded-2xl px-4 py-2 text-sm" href="/workspace">
              Workspace
            </Link>
            <Link className="border border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-2xl px-4 py-2 text-sm" href="/workspace">
              Login
            </Link>
            <Link className="bg-black text-white hover:bg-neutral-800 rounded-2xl px-4 py-2 text-sm" href="/workspace">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Renovation design, simplified.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
          Upload photos and plans, analyse them, and generate options. Watch live job progress at 20/50/80% milestones.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link className="bg-black text-white hover:bg-neutral-800 rounded-2xl px-5 py-3 text-sm" href="/workspace">
            Get started →
          </Link>
          <Link className="border border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-2xl px-5 py-3 text-sm" href="/workspace">
            Open Workspace
          </Link>
        </div>

        <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          <Feature title="Upload & Analyse" text="Drop plans and photos. We pick key details and suggest options." />
          <Feature title="Live Progress" text="WebSockets show 20/50/80% milestones. No page refreshes." />
          <Feature title="Safe Storage" text="Presigned URLs via S3/Supabase for controlled file access." />
        </section>
      </main>

      <footer className="mt-20 border-t border-neutral-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between text-sm text-neutral-500">
          <div>© {new Date().getFullYear()} Refurbd</div>
          <div className="flex items-center gap-4">
            <a className="hover:text-neutral-800" href="#">Privacy</a>
            <a className="hover:text-neutral-800" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-5">
      <div className="text-xl font-semibold">{title}</div>
      <div className="mt-2 text-neutral-600">{text}</div>
    </div>
  )
}
