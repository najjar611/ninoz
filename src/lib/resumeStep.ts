// Decides where "Start Plan" should land: the first step the customer hasn't
// completed yet, so leaving the wizard and coming back resumes in place.
export async function resumePlanRoute(supabase: any, id: string): Promise<string> {
  const [{ data: sub }, { data: liveSub }] = await Promise.all([
    supabase.from('subscribers').select('parent_name, kid_name, kid_birth_date, delivery_address').eq('id', id).maybeSingle(),
    supabase.from('subscriptions').select('id').eq('subscriber_id', id).in('status', ['active', 'frozen', 'pending_payment']).limit(1).maybeSingle(),
  ])
  if (liveSub) return '/account/dashboard'
  const s = sub || {}
  if (!s.parent_name || !s.kid_name || !s.kid_birth_date) return '/account/profile'
  if (!s.delivery_address) return '/account/location'
  return '/account/plan'
}
