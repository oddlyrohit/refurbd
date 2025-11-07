export default function Container({ children, className='' }: any) {
  return <div className={'max-w-5xl mx-auto p-4 ' + className}>{children}</div>
}