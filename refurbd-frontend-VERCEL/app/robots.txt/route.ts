import { NextResponse } from 'next/server'
export function GET() {
  const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.refurbd.com.au'
  return new NextResponse(`User-agent: *
Allow: /
Sitemap: ${host}/sitemap.xml
`, { headers: { 'Content-Type': 'text/plain' } })
}