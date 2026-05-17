import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StageMenuClient from './StageMenuClient'

export const revalidate = 0

export default async function StageMenuPage(props: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await props.params
  const supabase = await createClient()

  const [stageRes, mealTypesRes] = await Promise.all([
    supabase.from('stages').select('*').eq('id', stageId).single(),
    supabase.from('meal_types')
      .select('*, meals(*)')
      .eq('stage_id', stageId)
      .eq('is_active', true)
      .order('position'),
  ])

  if (!stageRes.data) notFound()

  return (
    <StageMenuClient
      stage={stageRes.data}
      mealTypes={mealTypesRes.data || []}
    />
  )
}
