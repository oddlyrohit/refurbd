
'use client'
export default function Badge({ children, icon: Icon, className = '' }: React.PropsWithChildren<{ icon?: any; className?: string }>) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow ring-1 ring-black/5 backdrop-blur dark:bg-slate-800/70 dark:text-slate-100 dark:ring-white/10 ${className}`}>
      {Icon ? <Icon className="h-4 w-4" /> : null} {children}
    </div>
  )
}
