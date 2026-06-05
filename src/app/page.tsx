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
