import { ButtonHTMLAttributes } from 'react'
export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={(props.className||'') + ' px-3 py-2 rounded bg-black text-white'} />
}