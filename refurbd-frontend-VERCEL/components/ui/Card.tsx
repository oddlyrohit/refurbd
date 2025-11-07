export default function Card({ className='', children }: any) {
  return <div className={'rounded-xl border p-4 ' + className}>{children}</div>
}