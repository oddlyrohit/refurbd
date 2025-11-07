import * as React from 'react'
import { clsx } from 'clsx'
export default React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button({ className, ...props }, ref) {
    return <button ref={ref} className={clsx('btn btn-primary', className)} {...props} />
  }
)