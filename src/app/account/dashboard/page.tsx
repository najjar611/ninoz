'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId, clearMockSession } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

type Sub = {
  id: string; start_date: string; status: string; total_price: number; stage_id: string
  stages: { name: string; name_ar?: string | null; emoji: string; image_url?: string | null } | null
  payment_cycles: { label: string; label_ar?: string | null; days: number; meals_total: number } | null
}
type Freeze = { id: string; freeze_start: string; freeze_end: string; status: string }
type Subscriber = {
  id: string; parent_name: string | null; kid_name: string | null; email: string | null
  kid_birth_date: string | null; delivery_address: string | null; extra_fields: Record<string, string> | null
}
type CustomField = {
  id: string; field_key: string; label_en: string; label_ar: string | null
  field_type: 'text' | 'number' | 'date' | 'select'; options: string[] | null; is_required: boolean
}
type Allergen = { id: string; name: string; name_ar?: string | null }
type Tab = 'plan' | 'profile' | 'address' | 'history'

// Use local calendar date, not toISOString() (which is UTC and can land on
// the wrong day depending on timezone/time of day, causing "tomorrow's
// meal" to silently mismatch the admin's locally-picked menu date).
function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayISO() {
  return localISO(new Date())
}

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return localISO(d)
}

type MenuEntry = { meal_type: string; menu_date: string; meal_id: string; meals: { id: string; name: string; name_ar?: string | null; image_url?: string | null; prep_instructions?: string | null; prep_instructions_ar?: string | null } | null }
const STATUS_INFO: Record<string, { en: string; ar: string; emoji: string }> = {
  preparing: { en: 'Preparing', ar: 'قيد التحضير', emoji: '👩‍🍳' },
  out_for_delivery: { en: 'Out for Delivery', ar: 'في الطريق', emoji: '🚴' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل', emoji: '✅' },
}

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const [tab, setTab] = useState<Tab>('plan')
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<Sub | null>(null)
  const [freeze, setFreeze] = useState<Freeze | null>(null)
  const [freezing, setFreezing] = useState(false)
  const [showPauseForm, setShowPauseForm] = useState(false)
  const [pauseStart, setPauseStart] = useState('')
  const [pauseEnd, setPauseEnd] = useState('')
  const [tomorrowMeals, setTomorrowMeals] = useState<MenuEntry[]>([])
  const [todayMeals, setTodayMeals] = useState<MenuEntry[]>([])
  const [reviews, setReviews] = useState<Record<string, string>>({})
  const [reviewSaved, setReviewSaved] = useState<Record<string, boolean>>({})
  const [reviewSaving, setReviewSaving] = useState<Record<string, boolean>>({})
  const [tomorrowIndex, setTomorrowIndex] = useState(0)
  const tomorrowTrackRef = useRef<HTMLDivElement | null>(null)
  const [todayIndex, setTodayIndex] = useState(0)
  const todayTrackRef = useRef<HTMLDivElement | null>(null)
  const [mealPanelIndex, setMealPanelIndex] = useState(0)
  const [allFreezes, setAllFreezes] = useState<Freeze[]>([])
  const [history, setHistory] = useState<Sub[]>([])
  const [msg, setMsg] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null)
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your feedback! We really appreciate your support 💛')
  const [infoMeal, setInfoMeal] = useState<MenuEntry | null>(null)
  const [infoVisible, setInfoVisible] = useState(false)
  const [reviewPopup, setReviewPopup] = useState<MenuEntry | null>(null)
  const [reviewPopupVisible, setReviewPopupVisible] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [reviewIndex, setReviewIndex] = useState(0)
  const reviewTrackRef = useRef<HTMLDivElement | null>(null)
  const pauseStartScrollRef = useRef<HTMLDivElement | null>(null)
  const pauseEndScrollRef = useRef<HTMLDivElement | null>(null)

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [email, setEmail] = useState('')
  const [kidBirthDate, setKidBirthDate] = useState('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [address, setAddress] = useState('')
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressMsg, setAddressMsg] = useState('')

  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [allergensSaving, setAllergensSaving] = useState(false)

  const [categories, setCategories] = useState<{ slug: string; name: string; name_ar: string | null }[]>([])

  useEffect(() => { load() }, [])

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const reload = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => load(), 300)
    }
    const channel = supabase.channel(`dashboard-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_status', filter: `subscriber_id=eq.${id}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `subscriber_id=eq.${id}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freeze_requests' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_menu' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, reload)
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [])

  async function load() {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }

    const [subRes, subscriberRes, cfRes, allergenRes, subAllergenRes, historyRes, categoriesRes] = await Promise.all([
      supabase.from('subscriptions').select('id, start_date, status, total_price, stage_id, stages(name, name_ar, emoji, image_url), payment_cycles(label, label_ar, days, meals_total)')
        .eq('subscriber_id', id).in('status', ['active', 'frozen']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('subscribers').select('id, parent_name, kid_name, email, kid_birth_date, delivery_address, extra_fields').eq('id', id).single(),
      supabase.from('customer_fields').select('*').eq('is_active', true).order('position'),
      supabase.from('allergens').select('id, name, name_ar'),
      supabase.from('subscriber_allergens').select('allergen_id').eq('subscriber_id', id),
      supabase.from('subscriptions').select('id, start_date, status, total_price, stage_id, stages(name, name_ar, emoji, image_url), payment_cycles(label, label_ar, days, meals_total)')
        .eq('subscriber_id', id).order('created_at', { ascending: false }),
      supabase.from('categories').select('slug, name, name_ar').order('position'),
    ])
    setCategories((categoriesRes.data as any) || [])

    setSub(subRes.data as any)
    setHistory((historyRes.data as any) || [])

    if (subscriberRes.data) {
      const s = subscriberRes.data as Subscriber
      setSubscriber(s)
      setParentName(s.parent_name || '')
      setKidName(s.kid_name || '')
      setEmail(s.email || '')
      setKidBirthDate(s.kid_birth_date || '')
      setExtra(s.extra_fields || {})
      setAddress(s.delivery_address || '')
    }
    setCustomFields(cfRes.data || [])
    setAllergens(allergenRes.data || [])
    setSelectedAllergens(((subAllergenRes.data as any) || []).map((a: any) => a.allergen_id))

    if (subRes.data) {
      const { data: fzAll } = await supabase.from('freeze_requests').select('*').eq('subscription_id', subRes.data.id).order('created_at')
      const fzActive = ((fzAll || []) as Freeze[]).find(f => f.status === 'active') || null
      setFreeze(fzActive)
      setAllFreezes((fzAll as any) || [])

      const today = todayISO()
      const tomorrow = tomorrowISO()
      const { data: dm } = await supabase.from('daily_menu')
        .select('meal_type, menu_date, meal_id, meals(id, name, name_ar, image_url, prep_instructions, prep_instructions_ar)')
        .eq('stage_id', (subRes.data as any).stage_id)
        .in('menu_date', [today, tomorrow])
      const entries = (dm as any as MenuEntry[]) || []
      setTodayMeals(entries.filter(e => e.menu_date === today))
      setTomorrowMeals(entries.filter(e => e.menu_date === tomorrow))

      const { data: rv } = await supabase.from('meal_reviews').select('meal_id, menu_date, meal_type, comment, rating').eq('subscriber_id', id).eq('menu_date', today)
      const rmap: Record<string, string> = {}
      const smap: Record<string, boolean> = {}
      const ratemap: Record<string, number> = {}
      ;((rv as any) || []).forEach((r: any) => {
        const key = `${r.meal_id}:${r.menu_date}:${r.meal_type}`
        rmap[key] = r.comment
        smap[key] = true
        if (r.rating) ratemap[key] = r.rating
      })
      setReviews(rmap)
      setReviewSaved(smap)
      setRatings(ratemap)

      const { data: ds } = await supabase.from('delivery_status').select('status').eq('subscriber_id', id).eq('menu_date', today).maybeSingle()
      setDeliveryStatus((ds as any)?.status || 'preparing')

      const { data: tym } = await supabase.from('site_content').select('value').eq('key', 'review_thank_you_message').maybeSingle()
      if ((tym as any)?.value) setThankYouMessage((tym as any).value)
    }
    setLoading(false)
  }

  function reviewKey(e: MenuEntry) {
    return `${e.meal_id}:${e.menu_date}:${e.meal_type}`
  }

  async function submitReview(e: MenuEntry) {
    const id = getMockSubscriberId()
    if (!id) return
    const key = reviewKey(e)
    const comment = (reviews[key] || '').trim()
    if (!comment) return
    setReviewSaving(prev => ({ ...prev, [key]: true }))
    const { error } = await supabase.from('meal_reviews')
      .upsert({ subscriber_id: id, meal_id: e.meal_id, menu_date: e.menu_date, meal_type: e.meal_type, comment, rating: ratings[key] || null }, { onConflict: 'subscriber_id,meal_id,menu_date,meal_type' })
    setReviewSaving(prev => ({ ...prev, [key]: false }))
    if (!error) {
      setReviewSaved(prev => ({ ...prev, [key]: true }))
      setReviewPopupVisible(false)
      setTimeout(() => setReviewPopup(null), 250)
    }
  }

  function openInfoMeal(e: MenuEntry) {
    setInfoMeal(e)
    requestAnimationFrame(() => setInfoVisible(true))
  }
  function closeInfoMeal() {
    setInfoVisible(false)
    setTimeout(() => setInfoMeal(null), 250)
  }
  function openReviewPopup(e: MenuEntry) {
    setReviewPopup(e)
    requestAnimationFrame(() => setReviewPopupVisible(true))
  }
  function closeReviewPopup() {
    setReviewPopupVisible(false)
    setTimeout(() => setReviewPopup(null), 250)
  }
  function scrollToReviewIndex(i: number) {
    const track = reviewTrackRef.current
    if (!track) return
    const card = track.children[i] as HTMLElement | undefined
    if (card) track.scrollTo({ left: card.offsetLeft - (track.offsetWidth - card.offsetWidth) / 2, behavior: 'smooth' })
  }
  function onReviewScroll() {
    const track = reviewTrackRef.current
    if (!track) return
    const center = track.scrollLeft + track.offsetWidth / 2
    let closest = 0
    let closestDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center)
      if (dist < closestDist) { closestDist = dist; closest = i }
    })
    setReviewIndex(closest)
  }

  function scrollToTodayIndex(i: number) {
    const track = todayTrackRef.current
    if (!track) return
    const card = track.children[i] as HTMLElement | undefined
    if (card) track.scrollTo({ left: card.offsetLeft - (track.offsetWidth - card.offsetWidth) / 2, behavior: 'smooth' })
  }

  function onTodayScroll() {
    const track = todayTrackRef.current
    if (!track) return
    const center = track.scrollLeft + track.offsetWidth / 2
    let closest = 0
    let closestDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center)
      if (dist < closestDist) { closestDist = dist; closest = i }
    })
    setTodayIndex(closest)
  }

  function scrollToTomorrowIndex(i: number) {
    const track = tomorrowTrackRef.current
    if (!track) return
    const card = track.children[i] as HTMLElement | undefined
    if (card) track.scrollTo({ left: card.offsetLeft - (track.offsetWidth - card.offsetWidth) / 2, behavior: 'smooth' })
  }

  function onTomorrowScroll() {
    const track = tomorrowTrackRef.current
    if (!track) return
    const center = track.scrollLeft + track.offsetWidth / 2
    let closest = 0
    let closestDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center)
      if (dist < closestDist) { closestDist = dist; closest = i }
    })
    setTomorrowIndex(closest)
  }

  function scrollDateStrip(ref: React.MutableRefObject<HTMLDivElement | null>, dir: 'prev' | 'next') {
    ref.current?.scrollBy({ left: dir === 'next' ? 200 : -200, behavior: 'smooth' })
  }

  // Delivery only happens Sunday–Thursday, so plan length is counted in business days.
  function isDeliveryDay(d: Date) {
    const dow = d.getDay() // 0=Sun ... 6=Sat; Friday(5) and Saturday(6) are skipped
    return dow !== 5 && dow !== 6
  }


  // A calendar day counts as "paused" if it falls inside any pause window.
  // The window is [freeze_start, freeze_end): meals stop on the pause-start day
  // and resume ON the resume day, so freeze_end itself is a normal delivery day.
  function isPausedDay(d: Date) {
    const iso = localISO(d)
    return allFreezes.some(fz =>
      (fz.status === 'active' || fz.status === 'completed') &&
      iso >= fz.freeze_start && iso < fz.freeze_end)
  }

  function daysInfo() {
    if (!sub?.start_date || !sub.payment_cycles) return null
    const start = new Date(sub.start_date + 'T00:00:00')
    const totalDays = sub.payment_cycles.days
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Expiry: walk forward from the start, counting only delivery days that
    // are NOT inside a pause window, until we've counted the whole plan. Pauses
    // naturally push the end date out by exactly the days that were frozen.
    let counted = 0
    const cur = new Date(start)
    let guard = 0
    while (guard++ < 3000) {
      if (isDeliveryDay(cur) && !isPausedDay(cur)) { counted++; if (counted >= totalDays) break }
      cur.setDate(cur.getDate() + 1)
    }
    const end = new Date(cur)

    // Delivered so far = delivery, non-paused days strictly before today. While
    // the plan is frozen, today sits inside the pause window, so this stops
    // growing and "days left" freezes until the plan resumes.
    let delivered = 0
    const d = new Date(start)
    while (d < today) {
      if (isDeliveryDay(d) && !isPausedDay(d)) delivered++
      d.setDate(d.getDate() + 1)
    }
    const remaining = Math.max(0, totalDays - delivered)
    return { totalDays, remaining, end, start }
  }

  // Delivery only runs Sun–Thu, so pause date pickers should only offer those
  // days — Friday/Saturday can't be picked since no delivery happens then.
  function deliveryDateCandidates(from: Date, count = 21) {
    const out: Date[] = []
    const d = new Date(from)
    while (out.length < count) {
      if (isDeliveryDay(d)) out.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return out
  }

  async function requestPause() {
    if (!sub) return
    // A subscription can only ever be paused once.
    if (allFreezes.length > 0) { setMsg(isAR ? 'يمكنك إيقاف اشتراكك مرة واحدة فقط' : 'You can pause your subscription only once'); return }
    if (!pauseStart || !pauseEnd) { setMsg(isAR ? 'يرجى اختيار تاريخ الإيقاف والاستئناف' : 'Please choose pause and resume dates'); return }
    if (pauseEnd <= pauseStart) { setMsg(isAR ? 'يجب أن يكون تاريخ الاستئناف بعد تاريخ الإيقاف' : 'Resume date must be after the pause date'); return }
    setFreezing(true)
    const { error } = await supabase.from('freeze_requests').insert({
      subscription_id: sub.id, freeze_start: pauseStart, freeze_end: pauseEnd,
    })
    if (!error) {
      // Extension is computed from freeze_requests history in daysInfo() —
      // no need to touch start_date, which avoids silent RLS failures.
      await supabase.from('subscriptions').update({ status: 'frozen' }).eq('id', sub.id)
    }
    setFreezing(false)
    setShowPauseForm(false)
    setMsg(error ? error.message : (isAR ? `تم إيقاف الخطة من ${pauseStart} إلى ${pauseEnd}` : `Plan paused from ${pauseStart} to ${pauseEnd}`))
    load()
  }

  async function resume() {
    if (!sub || !freeze) return
    setFreezing(true)
    // Resuming early needs 48h kitchen notice: meals restart on the first
    // delivery day that is at least 2 days from now — but never before the
    // subscription's start date (meals can't be delivered before the plan
    // begins). We then keep it no later than the resume date the user picked
    // (so if the pause already ended on its own, we don't push it out).
    const f = new Date(Date.now() + 48 * 3600 * 1000)
    const startDate = new Date(sub.start_date + 'T00:00:00')
    if (f < startDate) f.setTime(startDate.getTime())
    while (!isDeliveryDay(f)) f.setDate(f.getDate() + 1)
    const floorISO = localISO(f)
    const effectiveEnd = floorISO < freeze.freeze_end ? floorISO : freeze.freeze_end
    // Mark as completed (not cancelled) so daysInfo() still counts these days as extension.
    await supabase.from('freeze_requests').update({ status: 'completed', freeze_end: effectiveEnd }).eq('id', freeze.id)
    await supabase.from('subscriptions').update({ status: 'active' }).eq('id', sub.id)
    setFreezing(false)
    setMsg(isAR ? `سيتم استئناف الوجبات يوم ${effectiveEnd}` : `Meals will resume on ${effectiveEnd}`)
    load()
  }

  function logout() {
    clearMockSession()
    router.push('/account/signin')
  }

  async function saveProfile() {
    if (!parentName.trim() || !kidName.trim()) {
      setProfileMsg(isAR ? 'يرجى إدخال اسمك واسم طفلك' : "Please fill in your name and your baby's name")
      return
    }
    const missing = customFields.find(f => f.is_required && !(extra[f.field_key] || '').trim())
    if (missing) {
      setProfileMsg(isAR ? `الحقل "${missing.label_ar || missing.label_en}" مطلوب` : `"${missing.label_en}" is required`)
      return
    }
    setProfileSaving(true)
    setProfileMsg('')
    const id = getMockSubscriberId()
    // Store an empty email as NULL — saving '' collides with the unique email
    // constraint when another profile also has '', which would otherwise fail
    // the whole save (including the birth date, blocking stage recommendation).
    const { error } = await supabase.from('subscribers').update({
      parent_name: parentName, kid_name: kidName, email: email.trim() || null, kid_birth_date: kidBirthDate || null, extra_fields: extra,
    }).eq('id', id)
    setProfileSaving(false)
    if (error) {
      const dup = (error as any).code === '23505' || /duplicate key/i.test(error.message)
      setProfileMsg(dup ? (isAR ? 'هذا البريد الإلكتروني مستخدم بالفعل' : 'That email is already in use') : error.message)
      return
    }
    setProfileMsg(isAR ? 'تم الحفظ' : 'Saved')
  }

  async function saveAddress() {
    if (!address.trim()) return
    setAddressSaving(true)
    const id = getMockSubscriberId()
    const { error } = await supabase.from('subscribers').update({ delivery_address: address }).eq('id', id)
    setAddressSaving(false)
    setAddressMsg(error ? error.message : (isAR ? 'تم تحديث عنوان التوصيل' : 'Delivery address updated'))
  }

  async function toggleAllergen(allergenId: string) {
    const id = getMockSubscriberId()
    if (!id) return
    const isSelected = selectedAllergens.includes(allergenId)
    setAllergensSaving(true)
    if (isSelected) {
      await supabase.from('subscriber_allergens').delete().eq('subscriber_id', id).eq('allergen_id', allergenId)
      setSelectedAllergens(prev => prev.filter(a => a !== allergenId))
    } else {
      await supabase.from('subscriber_allergens').insert({ subscriber_id: id, allergen_id: allergenId })
      setSelectedAllergens(prev => [...prev, allergenId])
    }
    setAllergensSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', marginBottom: 14 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }
  const btn: React.CSSProperties = { padding: '13px 22px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

  if (loading) return <div style={{ textAlign: 'center', color: '#7A7068', padding: 20 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>

  const info = daysInfo()

  const tabs: { key: Tab; en: string; ar: string }[] = [
    { key: 'plan', en: 'Plan', ar: 'الخطة' },
    { key: 'profile', en: 'Profile', ar: 'الملف الشخصي' },
    { key: 'address', en: 'Address', ar: 'العنوان' },
    { key: 'history', en: 'History', ar: 'السجل' },
  ]

  return (
    <div>
      <style>{`.tomorrow-track::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>
            {isAR ? `أهلاً، ${parentName || ''}` : `Welcome${parentName ? ', ' + parentName.split(' ')[0] : ''}`} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '4px 0 0' }}>
            {kidName ? (isAR ? `وجبات ${kidName} في طريقها` : `${kidName}'s meals are on the way`) : ''}
          </p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1.5px solid #EDE8E0', color: '#7A7068', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8, padding: '8px 14px' }}>{isAR ? 'تسجيل الخروج' : 'Sign out'}</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 22, borderBottom: '1.5px solid #EDE8E0', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2.5px solid #C84B0F' : '2.5px solid transparent',
            color: tab === t.key ? '#C84B0F' : '#7A7068', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>
            {isAR ? t.ar : t.en}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        !sub ? (
          <div style={{ background: '#FDF0E8', border: '1.5px solid #F0C9A8', borderRadius: 14, padding: '20px 22px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'أنت غير مشترك في أي خطة' : "You're not subscribed to any plan"}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>{isAR ? 'يمكنك تعبئة بياناتك أولاً، وعندما تكون جاهزاً اضغط هنا للاشتراك.' : "You can fill in your details first, and whenever you're ready, press here to subscribe."}</p>
            <button onClick={() => router.push('/account/plan')} style={btn}>{isAR ? 'ابدأ خطتك' : 'Start Your Plan'}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div style={{
                position: 'relative', borderRadius: 14, marginBottom: 18, overflow: 'hidden', aspectRatio: '1 / 1',
                background: sub.stages?.image_url ? `url(${sub.stages.image_url}) center/cover` : '#FDF0E8',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px 20px',
              }}>
                {!sub.stages?.image_url && <div style={{ fontSize: 40 }}>{sub.stages?.emoji}</div>}
                {sub.stages?.image_url && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 55%)' }} />
                )}
                <div style={{ position: 'relative', fontWeight: 800, fontSize: 16, color: sub.stages?.image_url ? 'white' : '#1C1C1A', marginTop: 4 }}>{(isAR && sub.stages?.name_ar) || sub.stages?.name}</div>
                <div style={{ position: 'relative', fontSize: 13, color: sub.stages?.image_url ? 'rgba(255,255,255,0.85)' : '#7A7068', marginBottom: 12 }}>{(isAR && sub.payment_cycles?.label_ar) || sub.payment_cycles?.label}</div>
                <span style={{ position: 'relative', alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: sub.status === 'active' ? '#E8F5EE' : '#E0F0FA', color: sub.status === 'active' ? '#2D6A4F' : '#1E6091' }}>
                  {sub.status === 'active' ? (isAR ? 'نشطة' : 'Active') : (isAR ? 'مجمدة' : 'Frozen')}
                </span>
              </div>

              {info && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: '1 1 80px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#1C1C1A' }}>{info.start.toLocaleDateString(isAR ? 'ar' : 'en', { day: 'numeric', month: 'short' })}</div>
                    <div style={{ fontSize: 11, color: '#7A7068', fontWeight: 600, marginTop: 2 }}>{isAR ? 'تاريخ البداية' : 'Start Date'}</div>
                  </div>
                  {sub.status === 'frozen' && freeze && (
                    <div style={{ flex: '1 1 80px', background: '#E0F0FA', border: '1.5px solid #BCD9EC', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#1E6091' }}>{new Date(freeze.freeze_end + 'T00:00:00').toLocaleDateString(isAR ? 'ar' : 'en', { day: 'numeric', month: 'short' })}</div>
                      <div style={{ fontSize: 11, color: '#1E6091', fontWeight: 600, marginTop: 2 }}>{isAR ? 'تاريخ الاستئناف' : 'Resume Date'}</div>
                    </div>
                  )}
                  <div style={{ flex: '1 1 80px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#C84B0F' }}>{info.end.toLocaleDateString(isAR ? 'ar' : 'en', { day: 'numeric', month: 'short' })}</div>
                    <div style={{ fontSize: 11, color: '#7A7068', fontWeight: 600, marginTop: 2 }}>{isAR ? 'تاريخ الانتهاء' : 'Expires On'}</div>
                  </div>
                  <div style={{ flex: '1 1 80px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A' }}>{info.remaining}</div>
                    <div style={{ fontSize: 11, color: '#7A7068', fontWeight: 600, marginTop: 2 }}>{isAR ? 'أيام متبقية' : 'Days Left'}</div>
                  </div>
                </div>
              )}

              {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>{msg}</div>}

              {sub.status === 'frozen' ? (
                <>
                  <div style={{ background: '#E0F0FA', border: '1.5px solid #BCD9EC', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1E6091', marginBottom: 4 }}>⏸️ {isAR ? 'الاشتراك موقوف مؤقتاً' : 'Subscription paused'}</div>
                    {info && (
                      <div style={{ fontSize: 12.5, color: '#1E6091', fontWeight: 600 }}>
                        {isAR ? `لديك ${info.remaining} يوم متبقٍّ في اشتراكك` : `You have ${info.remaining} days left on your subscription`}
                      </div>
                    )}
                    {freeze && (
                      <div style={{ fontSize: 12.5, color: '#1E6091', fontWeight: 600, marginTop: 2 }}>
                        {isAR ? `ستُستأنف الوجبات يوم ${freeze.freeze_end}` : `Meals will resume on ${freeze.freeze_end}`}
                      </div>
                    )}
                  </div>
                  <button onClick={resume} disabled={freezing} style={{ ...btn, width: '100%', background: '#2D6A4F', opacity: freezing ? 0.6 : 1 }}>
                    {freezing ? (isAR ? 'جار الاستئناف…' : 'Resuming…') : (isAR ? 'استئناف الخطة الآن' : 'Resume Plan Now')}
                  </button>
                  <p style={{ fontSize: 11, color: '#7A7068', textAlign: 'center', marginTop: 8 }}>
                    {isAR ? 'الاستئناف الآن يبدأ توصيل الوجبات بعد يومين (مهلة التحضير).' : 'Resuming now restarts meals 2 days later (kitchen prep time).'}
                  </p>
                </>
              ) : showPauseForm ? (
                <div style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: 14 }}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'متى تريد الإيقاف؟' : 'When do you want to pause?'}</label>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <div ref={pauseStartScrollRef} dir="ltr" className="tomorrow-track" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 4 }}>
                      {deliveryDateCandidates(new Date(Math.max(Date.now() + 48 * 3600 * 1000, new Date((sub.start_date || '') + 'T00:00:00').getTime() || 0))).map(d => {
                        const iso = localISO(d)
                        const active = iso === pauseStart
                        return (
                          <button key={iso} onClick={() => { setPauseStart(iso); if (pauseEnd && pauseEnd <= iso) setPauseEnd('') }} style={{
                            flex: '0 0 56px', scrollSnapAlign: 'start', padding: '8px 4px', borderRadius: 10, border: active ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
                            background: active ? '#FDF0E8' : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#C84B0F' : '#7A7068' }}>{d.toLocaleDateString(isAR ? 'ar' : 'en', { weekday: 'short' })}</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#1C1C1A', marginTop: 2 }}>{d.getDate()}</div>
                            <div style={{ fontSize: 9.5, color: '#B0A098' }}>{d.toLocaleDateString(isAR ? 'ar' : 'en', { month: 'short' })}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
                    <button onClick={() => scrollDateStrip(pauseStartScrollRef, 'prev')} style={{ background: '#F2EDE8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#5A5048' }}>◀</button>
                    <button onClick={() => scrollDateStrip(pauseStartScrollRef, 'next')} style={{ background: '#F2EDE8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#5A5048' }}>▶</button>
                  </div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'متى تريد الاستئناف؟' : 'When do you want to resume?'}</label>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <div ref={pauseEndScrollRef} dir="ltr" className="tomorrow-track" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 4 }}>
                      {deliveryDateCandidates(pauseStart ? new Date(pauseStart) : new Date(Date.now() + 48 * 3600 * 1000)).filter(d => {
                        if (!pauseStart) return true
                        // A pause can run for at most two weeks.
                        const maxResume = new Date(pauseStart + 'T00:00:00'); maxResume.setDate(maxResume.getDate() + 14)
                        return localISO(d) > pauseStart && d <= maxResume
                      }).map(d => {
                        const iso = localISO(d)
                        const active = iso === pauseEnd
                        return (
                          <button key={iso} disabled={!pauseStart} onClick={() => setPauseEnd(iso)} style={{
                            flex: '0 0 56px', scrollSnapAlign: 'start', padding: '8px 4px', borderRadius: 10, border: active ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
                            background: active ? '#FDF0E8' : 'white', cursor: pauseStart ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'center', opacity: pauseStart ? 1 : 0.4,
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#C84B0F' : '#7A7068' }}>{d.toLocaleDateString(isAR ? 'ar' : 'en', { weekday: 'short' })}</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#1C1C1A', marginTop: 2 }}>{d.getDate()}</div>
                            <div style={{ fontSize: 9.5, color: '#B0A098' }}>{d.toLocaleDateString(isAR ? 'ar' : 'en', { month: 'short' })}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
                    <button onClick={() => scrollDateStrip(pauseEndScrollRef, 'prev')} style={{ background: '#F2EDE8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#5A5048' }}>◀</button>
                    <button onClick={() => scrollDateStrip(pauseEndScrollRef, 'next')} style={{ background: '#F2EDE8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#5A5048' }}>▶</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowPauseForm(false)} style={{ flex: 1, padding: '12px', background: '#F2EDE8', color: '#5A5048', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{isAR ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={requestPause} disabled={freezing} style={{ flex: 1, ...btn, background: '#1E6091', opacity: freezing ? 0.6 : 1 }}>{freezing ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'تأكيد الإيقاف' : 'Confirm Pause')}</button>
                  </div>
                </div>
              ) : allFreezes.length > 0 ? (
                <div style={{ background: '#FAF7F4', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#7A7068', fontWeight: 600, textAlign: 'center' }}>
                  {isAR ? 'لقد استخدمت إيقافك الوحيد لهذا الاشتراك.' : "You've already used your one pause for this subscription."}
                </div>
              ) : (
                <button onClick={() => { setPauseStart(''); setPauseEnd(''); setShowPauseForm(true) }} disabled={freezing} style={{ ...btn, width: '100%', background: '#1E6091', opacity: freezing ? 0.6 : 1 }}>
                  {isAR ? 'إيقاف الاشتراك مؤقتاً' : 'Pause My Subscription'}
                </button>
              )}
              <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: 8 }}>{isAR ? 'يمكنك إيقاف اشتراكك مرة واحدة فقط طوال مدة الاشتراك، ولمدة أسبوعين كحد أقصى. يجب طلب الإيقاف قبل 48 ساعة على الأقل، وسيتم تمديد خطتك بعدد الأيام التي تم إيقافها.' : 'You can pause your subscription only once during its term, for up to two weeks. Pause must be requested at least 48 hours ahead, and your plan is extended by the days paused.'}</p>
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div dir="ltr" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                {[isAR ? 'وجبات اليوم' : "Today's Meal", isAR ? 'قيّم الوجبة' : 'Review', isAR ? 'وجبات الغد' : "Tomorrow's Meal"].map((label, i) => (
                  <button key={i} onClick={() => setMealPanelIndex(i)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: mealPanelIndex === i ? '#C84B0F' : '#F2EDE8', color: mealPanelIndex === i ? 'white' : '#7A7068',
                  }}>{label}</button>
                ))}
              </div>

              <div style={{ marginBottom: 18 }}>
                {mealPanelIndex === 0 && (
                <div style={{ minWidth: 0 }}>
                  {deliveryStatus && STATUS_INFO[deliveryStatus] && (
                    <div style={{ background: deliveryStatus === 'delivered' ? '#E8F5EE' : '#FDF0E8', border: `1.5px solid ${deliveryStatus === 'delivered' ? '#BCE3CC' : '#F0C9A8'}`, borderRadius: 14, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 26 }}>{STATUS_INFO[deliveryStatus]?.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>
                          {isAR ? STATUS_INFO[deliveryStatus]?.ar : STATUS_INFO[deliveryStatus]?.en}
                        </div>
                        <div style={{ fontSize: 12, color: '#7A7068' }}>{isAR ? "حالة وجبات اليوم" : "Today's meal status"}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 12 }}>{isAR ? 'وجبات اليوم (اضغط لرؤية طريقة التحضير)' : "Today's Meals (tap for prep instructions)"}</div>
                    {todayMeals.length > 0 ? (
                      <div>
                        <div ref={todayTrackRef} onScroll={onTodayScroll} dir={isAR ? 'rtl' : 'ltr'} className="tomorrow-track" style={{
                          display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
                          paddingBottom: 4, scrollbarWidth: 'none',
                        }}>
                          {todayMeals.map((entry, i) => {
                            const cat = categories.find(c => c.slug === entry.meal_type)
                            const catLabel = (isAR && cat?.name_ar) || cat?.name || entry.meal_type
                            const key = reviewKey(entry)
                            const saved = reviewSaved[key]
                            return (
                              <div key={i} onClick={() => entry.meals && openInfoMeal(entry)} style={{
                                flex: '0 0 78%', scrollSnapAlign: 'center', borderRadius: 16, overflow: 'hidden',
                                border: '1.5px solid #EDE8E0', background: '#FDF0E8', cursor: entry.meals ? 'pointer' : 'default', position: 'relative',
                              }}>
                                <div style={{ width: '100%', height: 130, background: entry.meals?.image_url ? `url(${entry.meals.image_url}) center/cover` : '#F3E3D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {!entry.meals?.image_url && <span style={{ fontSize: 36 }}>🍽️</span>}
                                </div>
                                <div style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C84B0F', textTransform: 'uppercase' }}>{catLabel}</div>
                                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1A', marginTop: 2 }}>{entry.meals ? ((isAR && entry.meals.name_ar) || entry.meals.name) : (isAR ? 'لم يتم التحديد' : 'Not set')}</div>
                                  {saved && <div style={{ fontSize: 12.5, color: '#2D6A4F', fontWeight: 700, marginTop: 6 }}>✓ {isAR ? 'تم التقييم' : 'Reviewed'}</div>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {todayMeals.length > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#B0A098' }}>
                              {isAR ? `${todayMeals.length} / ${todayIndex + 1}` : `${todayIndex + 1} / ${todayMeals.length}`}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {todayMeals.map((_, i) => (
                                <button key={i} onClick={() => scrollToTodayIndex(i)} style={{
                                  width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                                  background: i === todayIndex ? '#C84B0F' : '#EDE8E0',
                                }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#B0A098' }}>{isAR ? 'لم يتم تحديد وجبات اليوم بعد' : 'Not scheduled yet'}</div>
                    )}
                  </div>
                </div>
                )}

                {mealPanelIndex === 1 && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 12 }}>{isAR ? 'قيّم الوجبة' : 'Review the Meal'}</div>
                    {deliveryStatus !== 'delivered' ? (
                      <div style={{ fontSize: 13, color: '#B0A098' }}>{isAR ? 'يمكنك تقييم الوجبة بعد التوصيل' : "Available once today's meal is delivered"}</div>
                    ) : todayMeals.length > 0 ? (
                      <div>
                        <div ref={reviewTrackRef} onScroll={onReviewScroll} dir={isAR ? 'rtl' : 'ltr'} className="tomorrow-track" style={{
                          display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
                          paddingBottom: 4, scrollbarWidth: 'none',
                        }}>
                          {todayMeals.map((entry, i) => {
                            const cat = categories.find(c => c.slug === entry.meal_type)
                            const catLabel = (isAR && cat?.name_ar) || cat?.name || entry.meal_type
                            const key = reviewKey(entry)
                            const saved = reviewSaved[key]
                            return (
                              <div key={i} onClick={() => !saved && entry.meals && openReviewPopup(entry)} style={{
                                flex: '0 0 78%', scrollSnapAlign: 'center', borderRadius: 16, overflow: 'hidden',
                                border: '1.5px solid #EDE8E0', background: '#FDF0E8', cursor: saved ? 'default' : 'pointer', position: 'relative',
                              }}>
                                <div style={{ width: '100%', height: 130, background: entry.meals?.image_url ? `url(${entry.meals.image_url}) center/cover` : '#F3E3D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {!entry.meals?.image_url && <span style={{ fontSize: 36 }}>🍽️</span>}
                                </div>
                                <div style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C84B0F', textTransform: 'uppercase' }}>{catLabel}</div>
                                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1A', marginTop: 2 }}>{entry.meals ? ((isAR && entry.meals.name_ar) || entry.meals.name) : ''}</div>
                                  {saved ? (
                                    <div style={{ fontSize: 12.5, color: '#2D6A4F', fontWeight: 700, marginTop: 6 }}>✓ {isAR ? 'تم الإرسال، شكراً لك' : 'Thanks, submitted'}</div>
                                  ) : (
                                    <div style={{ fontSize: 12.5, color: '#C84B0F', fontWeight: 700, marginTop: 6 }}>✍️ {isAR ? 'اضغط للتقييم' : 'Tap to review'}</div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {todayMeals.length > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#B0A098' }}>
                              {isAR ? `${todayMeals.length} / ${reviewIndex + 1}` : `${reviewIndex + 1} / ${todayMeals.length}`}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {todayMeals.map((_, i) => (
                                <button key={i} onClick={() => scrollToReviewIndex(i)} style={{
                                  width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                                  background: i === reviewIndex ? '#C84B0F' : '#EDE8E0',
                                }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#B0A098' }}>{isAR ? 'لا توجد وجبات لليوم' : 'No meals today'}</div>
                    )}
                  </div>
                </div>
                )}

                {mealPanelIndex === 2 && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 12 }}>{isAR ? 'وجبات الغد' : "Tomorrow's Meals"}</div>
                    {tomorrowMeals.length > 0 ? (
                      <div>
                        <div ref={tomorrowTrackRef} onScroll={onTomorrowScroll} dir={isAR ? 'rtl' : 'ltr'} className="tomorrow-track" style={{
                          display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
                          paddingBottom: 4, scrollbarWidth: 'none',
                        }}>
                          {tomorrowMeals.map((entry, i) => {
                            const cat = categories.find(c => c.slug === entry.meal_type)
                            const catLabel = (isAR && cat?.name_ar) || cat?.name || entry.meal_type
                            return (
                              <div key={i} onClick={() => entry.meals && openInfoMeal(entry)} style={{
                                flex: '0 0 78%', scrollSnapAlign: 'center', borderRadius: 16, overflow: 'hidden',
                                border: '1.5px solid #EDE8E0', background: '#FDF0E8', cursor: entry.meals ? 'pointer' : 'default',
                              }}>
                                <div style={{ width: '100%', height: 130, background: entry.meals?.image_url ? `url(${entry.meals.image_url}) center/cover` : '#F3E3D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {!entry.meals?.image_url && <span style={{ fontSize: 36 }}>🍽️</span>}
                                </div>
                                <div style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C84B0F', textTransform: 'uppercase' }}>{catLabel}</div>
                                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1A', marginTop: 2 }}>{entry.meals ? ((isAR && entry.meals.name_ar) || entry.meals.name) : (isAR ? 'لم يتم التحديد' : 'Not set')}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {tomorrowMeals.length > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#B0A098' }}>
                              {isAR ? `${tomorrowMeals.length} / ${tomorrowIndex + 1}` : `${tomorrowIndex + 1} / ${tomorrowMeals.length}`}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {tomorrowMeals.map((_, i) => (
                                <button key={i} onClick={() => scrollToTomorrowIndex(i)} style={{
                                  width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                                  background: i === tomorrowIndex ? '#C84B0F' : '#EDE8E0',
                                }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#B0A098' }}>{isAR ? 'لم يتم تحديد وجبات الغد بعد' : 'Not scheduled yet'}</div>
                    )}
                  </div>
                </div>
                )}
              </div>

            </div>
          </div>
        )
      )}

      {tab === 'profile' && (
        <div style={{ maxWidth: 480 }}>
          <label style={lbl}>{isAR ? 'اسمك' : 'Your Name'}</label>
          <input style={inp} value={parentName} onChange={e => setParentName(e.target.value)} />

          <label style={lbl}>{isAR ? 'اسم الطفل' : "Baby's Name"}</label>
          <input style={inp} value={kidName} onChange={e => setKidName(e.target.value)} />

          <label style={lbl}>{isAR ? 'تاريخ ميلاد الطفل' : "Baby's Birth Date"}</label>
          <input style={inp} type="date" value={kidBirthDate} onChange={e => setKidBirthDate(e.target.value)} />

          <label style={lbl}>{isAR ? 'البريد الإلكتروني' : 'Email'}</label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />

          {customFields.map(f => (
            <div key={f.id}>
              <label style={lbl}>{(isAR ? (f.label_ar || f.label_en) : f.label_en)}{f.is_required && <span style={{ color: '#C84B0F' }}> *</span>}</label>
              {f.field_type === 'select' ? (
                <select style={inp} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))}>
                  <option value="">{isAR ? 'اختر…' : 'Select…'}</option>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input style={inp} type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))} />
              )}
            </div>
          ))}

          {profileMsg && <div style={{ color: profileMsg.includes('Saved') || profileMsg.includes('تم') ? '#2D6A4F' : '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{profileMsg}</div>}
          <button style={{ ...btn, opacity: profileSaving ? 0.6 : 1 }} disabled={profileSaving} onClick={saveProfile}>{profileSaving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'حفظ التغييرات' : 'Save Changes')}</button>
        </div>
      )}

      {tab === 'address' && (
        <div style={{ maxWidth: 480 }}>
          <label style={lbl}>{isAR ? 'عنوان التوصيل' : 'Delivery Address'}</label>
          <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={address} onChange={e => setAddress(e.target.value)} placeholder={isAR ? 'الحي، الشارع، تفاصيل المبنى…' : 'District, street, building details…'} />
          {addressMsg && <div style={{ color: '#2D6A4F', fontSize: 12.5, marginBottom: 8 }}>{addressMsg}</div>}
          <button style={{ ...btn, opacity: addressSaving ? 0.6 : 1 }} disabled={addressSaving} onClick={saveAddress}>{addressSaving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'تحديث العنوان' : 'Update Address')}</button>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 && <p style={{ fontSize: 13, color: '#7A7068' }}>{isAR ? 'لا يوجد سجل اشتراكات' : 'No subscription history yet'}</p>}
          {history.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>{h.stages?.emoji} {(isAR && h.stages?.name_ar) || h.stages?.name}</div>
                <div style={{ fontSize: 12.5, color: '#7A7068' }}>{(isAR && h.payment_cycles?.label_ar) || h.payment_cycles?.label} · {new Date(h.start_date).toLocaleDateString(isAR ? 'ar' : 'en')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>{h.total_price} SAR</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: h.status === 'active' ? '#E8F5EE' : h.status === 'frozen' ? '#E0F0FA' : '#F3F1ED', color: h.status === 'active' ? '#2D6A4F' : h.status === 'frozen' ? '#1E6091' : '#7A7068' }}>{h.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {infoMeal && (
        <div
          onClick={closeInfoMeal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(28,28,26,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
            opacity: infoVisible ? 1 : 0, transition: 'opacity 0.25s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 18, maxWidth: 420, width: '100%', overflow: 'hidden',
              transform: infoVisible ? 'scale(1)' : 'scale(0.92)', opacity: infoVisible ? 1 : 0,
              transition: 'transform 0.25s ease, opacity 0.25s ease', maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: '100%', height: 160, background: infoMeal.meals?.image_url ? `url(${infoMeal.meals.image_url}) center/cover` : '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!infoMeal.meals?.image_url && <span style={{ fontSize: 48 }}>🍽️</span>}
            </div>
            <div style={{ padding: '18px 22px 22px' }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#1C1C1A', marginBottom: 6 }}>
                {infoMeal.meals ? ((isAR && infoMeal.meals.name_ar) || infoMeal.meals.name) : ''}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C84B0F', marginBottom: 14 }}>
                {isAR ? 'طريقة التحضير' : 'How to Prepare'}
              </div>
              <div style={{ fontSize: 13.5, color: '#5A5048', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {(isAR && infoMeal.meals?.prep_instructions_ar) || infoMeal.meals?.prep_instructions || (isAR ? 'لا توجد تعليمات تحضير حالياً.' : 'No prep instructions added yet.')}
              </div>
              <button onClick={closeInfoMeal} style={{ marginTop: 18, width: '100%', padding: '11px', background: '#F2EDE8', color: '#5A5048', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isAR ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewPopup && (
        <div
          onClick={closeReviewPopup}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(28,28,26,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
            opacity: reviewPopupVisible ? 1 : 0, transition: 'opacity 0.25s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 18, maxWidth: 420, width: '100%', padding: '22px 24px',
              transform: reviewPopupVisible ? 'scale(1)' : 'scale(0.92)', opacity: reviewPopupVisible ? 1 : 0,
              transition: 'transform 0.25s ease, opacity 0.25s ease', maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 17, color: '#1C1C1A', marginBottom: 4 }}>
              {reviewPopup.meals ? ((isAR && reviewPopup.meals.name_ar) || reviewPopup.meals.name) : ''}
            </div>
            <div style={{ fontSize: 13, color: '#7A7068', marginBottom: 14 }}>
              {isAR ? 'كيف كانت هذه الوجبة لطفلك؟' : "How was this meal for your baby?"}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map(n => {
                const key = reviewKey(reviewPopup)
                const r = ratings[key] || 0
                return (
                  <button key={n} onClick={() => setRatings(prev => ({ ...prev, [key]: n }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, padding: 0, opacity: n <= r ? 1 : 0.3 }}>
                    ⭐
                  </button>
                )
              })}
              <span style={{ fontSize: 11.5, color: '#B0A098', alignSelf: 'center', marginLeft: 6 }}>{isAR ? '(اختياري)' : '(optional)'}</span>
            </div>
            <textarea
              value={reviews[reviewKey(reviewPopup)] || ''}
              onChange={e => setReviews(prev => ({ ...prev, [reviewKey(reviewPopup!)]: e.target.value }))}
              placeholder={isAR ? 'اكتب رأيك هنا… هل أحب طفلك هذه الوجبة؟' : "Write your review here… did your baby enjoy this meal?"}
              style={{ width: '100%', minHeight: 100, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', color: '#1C1C1A' }}
            />
            <button
              onClick={() => submitReview(reviewPopup)}
              disabled={reviewSaving[reviewKey(reviewPopup)] || !(reviews[reviewKey(reviewPopup)] || '').trim()}
              style={{ marginTop: 12, width: '100%', padding: '12px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: reviewSaving[reviewKey(reviewPopup)] || !(reviews[reviewKey(reviewPopup)] || '').trim() ? 0.5 : 1 }}
            >
              {reviewSaving[reviewKey(reviewPopup)] ? (isAR ? 'جار الإرسال…' : 'Submitting…') : (isAR ? 'إرسال التقييم' : 'Submit Review')}
            </button>
            {reviewSaved[reviewKey(reviewPopup)] && (
              <div style={{ marginTop: 10, fontSize: 13, color: '#2D6A4F', fontWeight: 700, textAlign: 'center' }}>{thankYouMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
