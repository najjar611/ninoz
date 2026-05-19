// src/app/page.tsx — v8
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export const revalidate = 30

export default async function HomePage() {
  const supabase = await createClient()

  const [
    stages, meals, siteContent, howSteps, whyPoints,
    ingredients, footerLinks, logoData, paymentCycles, faqs, tickerItems
  ] = await Promise.all([
    supabase.from('stages').select('*').eq('is_active', true).order('position'),
    supabase.from('meals').select('*').eq('is_active', true).order('position'),
    supabase.from('site_content').select('*'),
    supabase.from('how_steps').select('*').eq('is_active', true).order('position'),
    supabase.from('why_points').select('*').eq('is_active', true).order('position'),
    supabase.from('ingredients').select('*').eq('is_active', true).order('position'),
    supabase.from('footer_links').select('*').eq('is_active', true).order('position'),
    supabase.from('logo').select('*').limit(1).single(),
    supabase.from('payment_cycles').select('*').eq('is_active', true).order('position'),
    supabase.from('faqs').select('*').eq('is_active', true).order('position'),
    supabase.from('ticker_items').select('*').eq('is_active', true).order('position'),
  ])

  const content: Record<string, string> = {}
  for (const item of siteContent.data || []) {
    content[item.key] = item.value
  }

  return (
    <HomeClient
      stages={stages.data || []}
      meals={meals.data || []}
      content={content}
      howSteps={howSteps.data || []}
      whyPoints={whyPoints.data || []}
      ingredients={ingredients.data || []}
      footerLinks={footerLinks.data || []}
      logo={logoData.data || null}
      paymentCycles={paymentCycles.data || []}
      faqs={faqs.data || []}
      tickerItems={tickerItems.data || []}
    />
  )
}
