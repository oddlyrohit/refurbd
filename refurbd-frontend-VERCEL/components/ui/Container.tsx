import * as React from 'react'
import { clsx } from 'clsx'
export default function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('container', className)} {...props} />
}