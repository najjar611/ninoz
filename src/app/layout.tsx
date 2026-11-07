import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { createClient } from '@/lib/supabase/server'
import AppLogoFlash from './AppLogoFlash'

export const metadata: Metadata = {
  title: 'Ninoz',
  description: 'Delicious, healthy meals for your little one',
  verification: {
    other: {
      'domain-verification': '631a28eee4325d93f3226e6862897d0ea8a663f2180855b857fdc157b6122124',
    },
  },
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
      <head>
        <script
          type="text/plain"
          id="domain-verification"
          dangerouslySetInnerHTML={{
            __html:
              '<meta name="domain-verification" content="631a28eee4325d93f3226e6862897d0ea8a663f2180855b857fdc157b6122124">',
          }}
        />
      </head>
      <body>
        <AppLogoFlash logoUrl={logoUrl} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
