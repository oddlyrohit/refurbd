import { NextResponse } from 'next/server'
export function GET() {
  const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.refurbd.com.au'
  const urls = ['/', '/workspace', '/(auth)/login', '/(auth)/register'].map(p => `<url><loc>${host}${p}</loc></url>`).join('')
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml' } })
}