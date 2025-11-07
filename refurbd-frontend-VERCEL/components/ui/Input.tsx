import * as React from 'react'
import { clsx } from 'clsx'
export default React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={clsx('w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400', className)} {...props} />
  }
)