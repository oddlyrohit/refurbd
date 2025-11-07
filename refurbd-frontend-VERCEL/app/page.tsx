
'use client'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import UploadCard from '@/components/UploadCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCheckout } from '@/lib/api'

function Pricing() {
  const router = useRouter()
  async function checkout(tier: 'basic'|'pro') {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) { sessionStorage.setItem('redirect_after_login', `/checkout/${tier}`); router.push(`/register?reason=checkout&tier=${tier}`); return }
    try {
      const { url } = await createCheckout(tier, `${window.location.origin}/success`, `${window.location.origin}/#pricing`)
      window.location.href = url
    } catch (e:any) {
      if (e.message === 'AUTH') { localStorage.removeItem('token'); router.push('/login?reason=session_expired'); return }
      alert(e.message || 'Checkout failed')
    }
  }
  return (
    <div id="pricing" className="mt-16">
      <h2 className="mb-6 text-center text-2xl font-bold">Pricing</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm font-semibold">Free</div>
          <div className="mt-2 text-3xl font-extrabold">$0</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• 2 analyses / month</li>
            <li>• Basic renderings</li>
          </ul>
          <Link href="/register"><Button className="mt-6 w-full" variant="outline">Start Free</Button></Link>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-semibold">Basic</div>
          <div className="mt-2 text-3xl font-extrabold">$29</div>
          <div className="text-xs text-slate-500">per month</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• 10 analyses / month</li>
            <li>• HD renderings</li>
          </ul>
          <Button className="mt-6 w-full" onClick={()=>checkout('basic')}>Choose Basic</Button>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-semibold">Pro</div>
          <div className="mt-2 text-3xl font-extrabold">$49</div>
          <div className="text-xs text-slate-500">per month</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• 100 analyses / month</li>
            <li>• UHD renderings</li>
          </ul>
          <Button className="mt-6 w-full" onClick={()=>checkout('pro')}>Choose Pro</Button>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-semibold">Enterprise</div>
          <div className="mt-2 text-3xl font-extrabold">Custom</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• Unlimited analyses</li>
            <li>• Dedicated support</li>
          </ul>
          <Link href="mailto:sales@renovate.ai"><Button className="mt-6 w-full" variant="outline">Contact Us</Button></Link>
        </Card>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div>
      <section className="bg-gradient-to-b from-white to-slate-50 py-12 dark:from-slate-950 dark:to-slate-900">
        <Container className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Plan stunning renovations with AI — built for Australia
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Analyze your room photos, get a materials & layout plan, and receive photorealistic renders. Then iterate with natural-language edits.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/register"><Button>Try Free</Button></Link>
              <Link href="/workspace"><Button variant="ghost">Open Workspace</Button></Link>
            </div>
          </div>
          <UploadCard />
        </Container>
      </section>
      <Container><Pricing /></Container>
    </div>
  )
}
