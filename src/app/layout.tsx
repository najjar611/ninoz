import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { createClient } from '@/lib/supabase/server'
import AppLogoFlash from './AppLogoFlash'

export const metadata: Metadata = {
  title: 'Ninoz',
  description: 'Delicious, healthy meals for your little one',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: logoRow }, { data: logoTableRow }] = await Promise.all([
    supabase.from('site_content').select('value').eq('key', 'logo_url').maybeSingle(),
    supabase.from('logo').select('url').limit(1).maybeSingle(),
  ])
  const logoUrl = (logoRow as any)?.value || (logoTableRow as any)?.url || null

  return (
    <html lang="en">
      <body>
        <AppLogoFlash logoUrl={logoUrl} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
