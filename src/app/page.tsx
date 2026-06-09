export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: stages },
    { data: meals },
    { data: contentRows },
    { data: howSteps },
    { data: whyPoints },
    { data: ingredients },
    { data: footerLinks },
    { data: logoRow },
    { data: paymentCycles },
    { data: faqs },
    { data: tickerItems },
    { count: subscriberCount },
  ] = await Promise.all([
    supabase.from('stages').select('*').order('id'),
    supabase.from('meals').select('*').order('id'),
    supabase.from('site_content').select('key,value'),
    supabase.from('how_steps').select('*').order('id'),
    supabase.from('why_points').select('*').order('id'),
    supabase.from('ingredients').select('*').order('id'),
    supabase.from('footer_links').select('*').order('id'),
    supabase.from('site_content').select('value').eq('key', 'logo_url').single(),
    supabase.from('payment_cycles').select('*').order('id'),
    supabase.from('faqs').select('*').order('id'),
    supabase.from('ticker_items').select('*').order('id'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }),
  ])

  const content: Record<string, string> = {}
  for (const row of contentRows ?? []) {
    content[row.key] = row.value
  }

  const logo = logoRow ? { url: logoRow.value, alt_text: 'Ninoz' } : null

  if (content['site_coming_soon'] === 'true') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#1C0A04', fontFamily: 'Nunito, sans-serif',
      }}>
        {logo?.url
          ? <img src={logo.url} alt="Ninoz" style={{ height: 80, maxWidth: 260, objectFit: 'contain' }} />
          : <span style={{ fontSize: 52, fontWeight: 900, color: '#C84B0F', letterSpacing: '-0.03em' }}>Ninoz</span>
        }
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 28, fontSize: 15, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Coming Soon
        </p>
      </div>
    )
  }

  return (
    <HomeClient
      stages={stages ?? []}
      meals={meals ?? []}
      content={content}
      howSteps={howSteps ?? []}
      whyPoints={whyPoints ?? []}
      ingredients={ingredients ?? []}
      footerLinks={footerLinks ?? []}
      logo={logo}
      paymentCycles={paymentCycles ?? []}
      faqs={faqs ?? []}
      tickerItems={tickerItems ?? []}
      subscriberCount={subscriberCount ?? 0}
    />
  )
}
