export default function Progress({ value=0 }: { value?: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const marks = [20,50,80]
  return (
    <div className="relative progress">
      <div className="progress-fill" style={{ width: `${v}%` }} />
      {marks.map(m => (
        <div key={m} className="absolute inset-y-0" style={{ left: `${m}%` }}>
          <div className="h-2 w-[2px] translate-x-[-1px] bg-slate-400/70 dark:bg-slate-500/70"></div>
        </div>
      ))}
    </div>
  )
}