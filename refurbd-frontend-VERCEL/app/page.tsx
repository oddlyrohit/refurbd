import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow rounded-2xl p-6 w-full max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Welcome to Refurbd</h1>
        <p className="text-slate-600">Use the links below to get started.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="px-4 py-2 rounded-xl bg-slate-900 text-white">Register</Link>
          <Link href="/login" className="px-4 py-2 rounded-xl border">Login</Link>
        </div>
      </div>
    </main>
  );
}
