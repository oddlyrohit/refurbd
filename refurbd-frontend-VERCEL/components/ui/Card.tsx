
'use client'
export default function Card({ children, className='' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10 ${className}`}>{children}</div>
}
