import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  const [
    contentRes, stagesRes, howRes, whyRes,
    faqRes, testiRes, blogRes, settingsRes,
    logoRes, slideshowRes,
  ] = await Promise.all([
    supabase.from('site_content').select('*'),
    supabase.from('stages').select('*').eq('is_active', true).order('position'),
    supabase.from('how_steps').select('*').eq('is_active', true).order('position'),
    supabase.from('why_points').select('*').eq('is_active', true).order('position'),
    supabase.from('faq_items').select('*').order('position'),
    supabase.from('testimonials').select('*').order('position'),
    supabase.from('blog_posts').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('site_settings').select('*'),
    supabase.from('logo').select('*').limit(1).single(),
    supabase.storage.from('slideshow').list('', { sortBy: { column: 'created_at', order: 'asc' } }),
  ])

  const content: Record<string, string> = {}
  contentRes.data?.forEach(item => { content[item.key] = item.value })

  const settings: Record<string, string> = {}
  settingsRes.data?.forEach(item => { settings[item.key] = item.value })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const slideshowImages = (slideshowRes.data || [])
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .map(f => ({
      name: f.name,
      url: `${supabaseUrl}/storage/v1/object/public/slideshow/${f.name}`,
    }))

  return (
    <HomeClient
      content={content}
      stages={stagesRes.data || []}
      howSteps={howRes.data || []}
      whyPoints={whyRes.data || []}
      faqItems={faqRes.data || []}
      testimonials={testiRes.data || []}
      blogPosts={blogRes.data || []}
      settings={settings}
      logo={logoRes.data}
      slideshowImages={slideshowImages}
    />
  )
}
