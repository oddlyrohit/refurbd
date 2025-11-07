
'use client'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost'|'outline'|'danger'|'default' }
export default function Button({ children, className='', variant='primary', ...props }: React.PropsWithChildren<Props>) {
  const styles = variant==='primary'
    ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:from-emerald-600 hover:to-sky-600'
    : variant==='ghost'
    ? 'bg-white/60 text-slate-800 hover:bg-white/80 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800/60 dark:border-slate-700'
    : variant==='outline'
    ? 'bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-50 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-900'
    : variant==='danger'
    ? 'bg-rose-600 text-white hover:bg-rose-700'
    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90'
  return <button className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition ${styles} ${className}`} {...props}>{children}</button>
}
