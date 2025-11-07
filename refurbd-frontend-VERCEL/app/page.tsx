import Link from 'next/link'
export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Refurbd</h1>
      <p>Welcome. Use the workspace to manage projects.</p>
      <div className="space-x-3">
        <Link href="/(auth)/login" className="underline">Login</Link>
        <Link href="/workspace" className="underline">Workspace</Link>
      </div>
    </main>
  )
}