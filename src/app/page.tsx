import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

// Force Next.js to pull fresh database content instantly when edited in the admin portal
export const revalidate = 0 

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch all CMS content from Supabase simultaneously to maximize speed
  const [
    { data: stages },
    { data: meals },
    { data: siteContent },
    { data: howSteps },
    { data: whyPoints },
    { data: ingredients },
    { data: footerLinks },
    { data: logos },
    { data: paymentCycles },
    { data: faqs },
    { data: tickerItems }
  ] = await Promise.all([
    supabase.from('stages').select('*').order('created_at', { ascending: true }),
    supabase.from('meals').select('*'),
    supabase.from('site_content').select('key, value'),
    supabase.from('how_steps').select('*').order('id', { ascending: true }),
    supabase.from('why_points').select('*').order('id', { ascending: true }),
    supabase.from('ingredients').select('*'),
    supabase.from('footer_links').select('*'),
    supabase.from('logo').select('*').maybeSingle(),
    supabase.from('payment_cycles').select('*'),
    supabase.from('faqs').select('*'),
    supabase.from('ticker_items').select('*')
  ])

  // Convert array rows [{key: "hero_headline_1", value: "You Care."}] into a quick-lookup object map
  const contentMap: Record<string, string> = {}
  if (siteContent) {
    siteContent.forEach(item => {
      contentMap[item.key] = item.value
    })
  }

  return (
    <HomeClient
      stages={stages || []}
      meals={meals || []}
      content={contentMap}
      howSteps={howSteps || []}
      whyPoints={whyPoints || []}
      ingredients={ingredients || []}
      footerLinks={footerLinks || []}
      logo={logos || null}
      paymentCycles={paymentCycles || []}
      faqs={faqs || []}
      tickerItems={tickerItems || []}
    />
  )
}