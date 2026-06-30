'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

type Stage = { id: string; name: string; name_ar?: string | null; emoji: string; age_range: string; age_range_ar?: string | null; min_age_months?: number | null; max_age_months?: number | null }

function ageInMonths(dateStr: string | null): number | null {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months--
  return Math.max(0, months)
}
type Cycle = { id: string; label: string; label_ar?: string | null; days: number; meals_total: number; price_sar: number }

// Friday and Saturday are not yet supported for delivery — only 5 weekdays.
const DELIVERY_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu']
const DAY_NAMES = [
  { en: 'Sun', ar: 'الأحد' }, { en: 'Mon', ar: 'الاثنين' }, { en: 'Tue', ar: 'الثلاثاء' }, { en: 'Wed', ar: 'الأربعاء' },
  { en: 'Thu', ar: 'الخميس' }, { en: 'Fri', ar: 'الجمعة' }, { en: 'Sat', ar: 'السبت' },
]

function isDeliveryDay(d: Date) {
  const dow = d.getDay()
  return dow !== 5 && dow !== 6
}
// Use local calendar date, not toISOString() (which is UTC and can land on
// the wrong day depending on timezone/time of day).
function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function startDateCandidates(count = 21) {
  const out: Date[] = []
  // The kitchen needs 48h notice, so the earliest start is 2 days from now.
  const d = new Date(Date.now() + 48 * 3600 * 1000)
  while (out.length < count) {
    if (isDeliveryDay(d)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export default function Plan() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const [stages, setStages] = useState<Stage[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [stageId, setStageId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [startDate, setStartDate] = useState<string>(() => localISO(startDateCandidates(1)[0]))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [recommendedStageId, setRecommendedStageId] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoInfo, setPromoInfo] = useState<{ code: string; discount_percent: number; max_uses: number | null } | null>(null)
  const [promoMsg, setPromoMsg] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }
    Promise.all([
      supabase.from('stages').select('id,name,name_ar,emoji,age_range,age_range_ar,min_age_months,max_age_months').eq('is_active', true).order('position'),
      supabase.from('payment_cycles').select('*').order('days'),
      supabase.from('subscribers').select('kid_birth_date').eq('id', id).single(),
    ]).then(([s, c, sub]) => {
      setStages(s.data || [])
      setCycles(c.data || [])
      const months = ageInMonths((sub.data as any)?.kid_birth_date || null)
      const match = months !== null
        ? (s.data || []).find((st: any) => st.min_age_months != null && st.max_age_months != null && months >= st.min_age_months && months <= st.max_age_months)
        : null
      if (match) {
        setStageId(match.id)
        setRecommendedStageId(match.id)
      } else if (s.data?.[0]) {
        setStageId(s.data[0].id)
      }
      if (c.data?.[0]) setCycleId(c.data[0].id)
      setLoading(false)
    })
  }, [])

  const selectedCycle = cycles.find(c => c.id === cycleId)
  const basePrice = selectedCycle?.price_sar || 0
  const finalPrice = promoInfo ? Math.round(basePrice * (1 - promoInfo.discount_percent / 100)) : basePrice

  async function applyPromo() {
    const code = promoCode.trim()
    if (!code) return
    setPromoChecking(true)
    setPromoMsg('')
    const { data } = await supabase.from('promo_codes').select('code, discount_percent, max_uses').ilike('code', code).eq('is_active', true).maybeSingle()
    if (!data) { setPromoChecking(false); setPromoInfo(null); setPromoMsg(isAR ? 'كود غير صالح' : 'Invalid promo code'); return }
    if (data.max_uses != null) {
      const { count } = await supabase.from('subscriptions').select('id', { count: 'exact', head: true }).ilike('promo_code', data.code)
      if ((count || 0) >= data.max_uses) {
        setPromoChecking(false); setPromoInfo(null)
        setPromoMsg(isAR ? 'تم استخدام هذا الكود بالكامل' : 'This code has reached its usage limit')
        return
      }
    }
    setPromoChecking(false)
    setPromoInfo(data as any)
    setPromoMsg(isAR ? `تم تطبيق خصم ${data.discount_percent}%` : `${data.discount_percent}% discount applied`)
  }

  const card = (active: boolean): React.CSSProperties => ({
    padding: '14px 16px', borderRadius: 12, border: active ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
    background: active ? '#FDF0E8' : 'white', cursor: 'pointer', marginBottom: 10,
  })

  async function continueToCheckout() {
    if (!stageId || !cycleId || !startDate) { setError(isAR ? 'يرجى اختيار مرحلة وخطة وتاريخ بداية' : 'Please choose a stage, plan, and start date'); return }
    setSaving(true)
    setError('')
    const id = getMockSubscriberId()
    const { data, error: err } = await supabase.from('subscriptions').insert({
      subscriber_id: id,
      stage_id: stageId,
      payment_cycle_id: cycleId,
      meals_per_day: 1,
      delivery_days: DELIVERY_DAYS,
      start_date: startDate,
      total_price: finalPrice,
      promo_code: promoInfo?.code || null,
      discount_percent: promoInfo?.discount_percent || null,
      status: 'pending_payment',
    }).select('id').single()
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push(`/account/checkout?subscription_id=${data.id}`)
  }

  if (loading) return <div style={{ textAlign: 'center', color: '#7A7068', padding: 20 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'بناء خطتك' : 'Build your plan'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 18 }}>{isAR ? 'اختر مرحلة طفلك وعدد مرات توصيل الوجبات.' : "Choose your baby's stage and how often you'd like meals delivered."}</p>

      <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{isAR ? 'المرحلة' : 'Stage'}</div>
      {stages.map(s => (
        <div key={s.id} style={card(stageId === s.id)} onClick={() => setStageId(s.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1A' }}>{s.emoji} {(isAR && s.name_ar) || s.name}</div>
            {s.id === recommendedStageId && (
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2D6A4F', background: '#E8F5EE', borderRadius: 6, padding: '2px 7px' }}>
                {isAR ? 'موصى بها لعمر طفلك' : "Recommended for your baby's age"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#7A7068' }}>{(isAR && s.age_range_ar) || s.age_range}</div>
        </div>
      ))}

      <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '18px 0 8px' }}>{isAR ? 'الخطة' : 'Plan'}</div>
      {cycles.map(c => (
        <div key={c.id} style={card(cycleId === c.id)} onClick={() => setCycleId(c.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1A' }}>{(isAR && c.label_ar) || c.label}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#C84B0F' }}>{c.price_sar} {isAR ? 'ريال' : 'SAR'}</div>
          </div>
          <div style={{ fontSize: 12, color: '#7A7068' }}>{isAR ? `${c.meals_total} وجبة خلال ${c.days} يوم` : `${c.meals_total} meals over ${c.days} days`}</div>
        </div>
      ))}

      <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '18px 0 8px' }}>{isAR ? 'تاريخ البداية' : 'Start Date'}</div>
      <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: -4, marginBottom: 8 }}>{isAR ? 'التوصيل من الأحد إلى الخميس فقط. اسحب لرؤية تواريخ أخرى.' : 'Delivery runs Sunday–Thursday only. Swipe for more dates.'}</p>
      <div dir={isAR ? 'rtl' : 'ltr'} style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch', paddingBottom: 4, marginBottom: 18 }}>
        {startDateCandidates().map(d => {
          const iso = localISO(d)
          const active = iso === startDate
          const dn = DAY_NAMES[d.getDay()]
          return (
            <button key={iso} onClick={() => setStartDate(iso)} style={{
              flex: '0 0 64px', scrollSnapAlign: 'start', padding: '10px 6px', borderRadius: 12, border: active ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
              background: active ? '#FDF0E8' : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: active ? '#C84B0F' : '#7A7068' }}>{isAR ? dn.ar : dn.en}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#1C1C1A', marginTop: 2 }}>{d.getDate()}</div>
              <div style={{ fontSize: 10, color: '#B0A098' }}>{d.toLocaleDateString(isAR ? 'ar' : 'en', { month: 'short' })}</div>
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 8px' }}>{isAR ? 'كود الخصم (اختياري)' : 'Promo Code (optional)'}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <input
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          placeholder={isAR ? 'أدخل الكود' : 'Enter code'}
          value={promoCode}
          onChange={e => { setPromoCode(e.target.value); setPromoInfo(null); setPromoMsg('') }}
          onKeyDown={e => e.key === 'Enter' && applyPromo()}
        />
        <button onClick={applyPromo} disabled={promoChecking || !promoCode.trim()} style={{ padding: '10px 16px', background: '#1C1C1A', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: promoChecking || !promoCode.trim() ? 0.5 : 1 }}>
          {promoChecking ? '…' : (isAR ? 'تطبيق' : 'Apply')}
        </button>
      </div>
      {promoMsg && <div style={{ fontSize: 12.5, marginBottom: 8, color: promoInfo ? '#2D6A4F' : '#DC2626', fontWeight: 600 }}>{promoMsg}</div>}

      {selectedCycle && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0 14px' }}>
          <span style={{ fontSize: 13, color: '#7A7068', fontWeight: 700 }}>{isAR ? 'الإجمالي' : 'Total'}</span>
          <span>
            {promoInfo && <span style={{ fontSize: 13, color: '#B0A098', textDecoration: 'line-through', marginInlineEnd: 8 }}>{basePrice} {isAR ? 'ريال' : 'SAR'}</span>}
            <span style={{ fontSize: 16, fontWeight: 900, color: '#C84B0F' }}>{finalPrice} {isAR ? 'ريال' : 'SAR'}</span>
          </span>
        </div>
      )}

      {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
      <button onClick={continueToCheckout} disabled={saving} style={{ width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
        {saving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'الانتقال للدفع' : 'Continue to Checkout')}
      </button>
    </div>
  )
}
