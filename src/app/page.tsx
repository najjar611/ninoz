import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const [stages, planDetails, meals, siteContent, howSteps, whyPoints, testimonials, blogPosts, faqItems, footerLinks, logoData, formFields, ingredients] = await Promise.all([
    supabase.from('stages').select('*').order('position'),
    supabase.from('plan_details').select('*').order('plan_number'),
    supabase.from('meals').select('*').order('position'),
    supabase.from('site_content').select('*'),
    supabase.from('how_steps').select('*').order('position'),
    supabase.from('why_points').select('*').order('position'),
    supabase.from('testimonials').select('*').eq('is_active', true).order('position'),
    supabase.from('blog_posts').select('*').eq('is_active', true).order('position'),
    supabase.from('faqs').select('*').eq('is_active', true).order('position'),
    supabase.from('footer_links').select('*').eq('is_active', true).order('position'),
    supabase.from('logo').select('*').single(),
    supabase.from('form_fields').select('*').order('position'),
    supabase.from('ingredients').select('*').eq('is_active', true).order('position'),
  ])

  const content: Record<string, string> = {}
  for (const item of siteContent.data || []) {
    content[item.key] = item.value
  }

  return (
    <HomeClient
      stages={stages.data || []}
      planDetails={planDetails.data || []}
      meals={meals.data || []}
      content={content}
      howSteps={howSteps.data || []}
      whyPoints={whyPoints.data || []}
      testimonials={testimonials.data || []}
      blogPosts={blogPosts.data || []}
      faqItems={faqItems.data || []}
      footerLinks={footerLinks.data || []}
      logo={logoData.data || null}
      formFields={formFields.data || []}
      ingredients={ingredients.data || []}
    />
  )
}