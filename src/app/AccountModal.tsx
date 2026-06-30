'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId, setMockSubscriberId } from '@/lib/mockSession'

const MOCK_OTP = '123456'

type Step = 'phone' | 'otp' | 'profile' | 'plan' | 'checkout' | 'location'

type Stage = { id: string; name: string; name_ar?: string | null; emoji: string; age_range: string; age_range_ar?: string | null; min_age_months?: number | null; max_age_months?: number | null }
type Cycle = { id: string; label: string; label_ar?: string | null; days: number; meals_total: number; price_sar: number }
type Sub = {
  id: string; start_date: string; status: string; total_price: number; stage_id?: string
  stages: { name: string; name_ar?: string | null; emoji: string } | null
  payment_cycles: { label: string; label_ar?: string | null; days: number; meals_total: number } | null
}

// Friday and Saturday are not yet supported for delivery — only 5 weekdays.
const DELIVERY_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu']
const DAY_NAMES = [
  { en: 'Sun', ar: 'الأحد' }, { en: 'Mon', ar: 'الاثنين' }, { en: 'Tue', ar: 'الثلاثاء' }, { en: 'Wed', ar: 'الأربعاء' },
  { en: 'Thu', ar: 'الخميس' }, { en: 'Fri', ar: 'الجمعة' }, { en: 'Sat', ar: 'السبت' },
]

// Use local calendar date, not toISOString() (which is UTC and can land on
// the wrong day depending on timezone/time of day).
function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Only Sun–Thu are valid start dates; build a swipeable list of upcoming candidates.
function isDeliveryDay(d: Date) {
  const dow = d.getDay()
  return dow !== 5 && dow !== 6
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

type Props = { open: boolean; onClose: () => void; isAR: boolean }

export default function AccountModal({ open, onClose, isAR }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [history, setHistory] = useState<Step[]>([])
  const [initializing, setInitializing] = useState(true)

  // phone/otp/profile
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [kidBirthDate, setKidBirthDate] = useState('')
  const subscriberIdRef = useRef<string | null>(null)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // plan
  const [stages, setStages] = useState<Stage[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [stageId, setStageId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [startDate, setStartDate] = useState<string>(() => localISO(startDateCandidates(1)[0]))
  const [promoCode, setPromoCode] = useState('')
  const [promoInfo, setPromoInfo] = useState<{ code: string; discount_percent: number } | null>(null)
  const [promoMsg, setPromoMsg] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)

  // checkout
  const [sub, setSub] = useState<Sub | null>(null)

  // location
  const [address, setAddress] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function go(next: Step) {
    setHistory(prev => [...prev, step])
    setError('')
    setStep(next)
  }

  function goBack() {
    setError('')
    setHistory(prev => {
      if (prev.length === 0) return prev
      const next = [...prev]
      const last = next.pop() as Step
      setStep(last)
      return next
    })
  }

  function goToDashboard() {
    onClose()
    router.push('/account/dashboard')
  }

  useEffect(() => {
    if (!open) {
      setHistory([]); setPhone(''); setDigits(Array(6).fill('')); setError('')
      setParentName(''); setKidName(''); setKidBirthDate(''); setSub(null); setAddress('')
      setPromoCode(''); setPromoInfo(null); setPromoMsg('')
      return
    }
    init()
  }, [open])

  async function init() {
    setInitializing(true)
    const id = getMockSubscriberId()
    if (!id) { setStep('phone'); setInitializing(false); return }
    subscriberIdRef.current = id
    const { data: subscriber } = await supabase.from('subscribers').select('id, parent_name, kid_name, kid_birth_date, delivery_address').eq('id', id).maybeSingle()
    if (!subscriber) { setStep('phone'); setInitializing(false); return }
    if (subscriber.kid_birth_date) setKidBirthDate(subscriber.kid_birth_date)
    if (subscriber.parent_name) setParentName(subscriber.parent_name)
    if (subscriber.delivery_address) setAddress(subscriber.delivery_address)
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('subscriber_id', id)
      .in('status', ['active', 'frozen'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (activeSub) {
      goToDashboard()
      return
    } else if (subscriber.parent_name && subscriber.kid_name) {
      await loadPlanOptions(subscriber.kid_birth_date)
      setStep('plan')
    } else {
      await loadStages()
      setStep('profile')
    }
    setInitializing(false)
  }

  async function loadStages() {
    const { data } = await supabase.from('stages').select('id,name,name_ar,emoji,age_range,age_range_ar,min_age_months,max_age_months').eq('is_active', true).order('position')
    setStages(data || [])
  }

  function ageInMonths(birthDate: string) {
    const b = new Date(birthDate)
    const now = new Date()
    return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth())
  }

  async function loadPlanOptions(birthDateOverride?: string | null) {
    const [s, c] = await Promise.all([
      supabase.from('stages').select('id,name,name_ar,emoji,age_range,age_range_ar,min_age_months,max_age_months').eq('is_active', true).order('position'),
      supabase.from('payment_cycles').select('*').order('days'),
    ])
    const stageList: Stage[] = s.data || []
    setStages(stageList)
    setCycles(c.data || [])
    const bd = birthDateOverride ?? kidBirthDate
    let chosenStageId = stageList[0]?.id
    if (bd) {
      const months = ageInMonths(bd)
      const match = stageList.find(st => (st.min_age_months == null || months >= st.min_age_months) && (st.max_age_months == null || months <= st.max_age_months))
      if (match) chosenStageId = match.id
    }
    if (chosenStageId) setStageId(chosenStageId)
    if (c.data?.[0]) setCycleId(c.data[0].id)
  }

  function recommendedStageId() {
    if (!kidBirthDate) return null
    const months = ageInMonths(kidBirthDate)
    const match = stages.find(st => (st.min_age_months == null || months >= st.min_age_months) && (st.max_age_months == null || months <= st.max_age_months))
    return match?.id || null
  }

  if (!open) return null

  const phoneDigits = phone.replace(/\D/g, '')
  const nationalDigits = phoneDigits.startsWith('0') ? phoneDigits.slice(1) : phoneDigits
  const fullPhone = `+966${nationalDigits}`

  function sendCode() {
    if (!/^0\d{9}$/.test(phoneDigits)) { setError(isAR ? 'أدخل رقم هاتف مكون من 10 أرقام ويبدأ بـ 0' : 'Enter a 10-digit number starting with 0'); return }
    go('otp')
    setTimeout(() => inputsRef.current[0]?.focus(), 50)
  }

  function onDigitChange(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1)
    setDigits(prev => {
      const next = [...prev]; next[i] = d
      if (d && i === 5 && next.every(x => x)) setTimeout(() => verifyCode(next.join('')), 0)
      return next
    })
    if (d && i < 5) inputsRef.current[i + 1]?.focus()
  }

  async function verifyCode(codeOverride?: string) {
    if (loading) return
    const code = codeOverride ?? digits.join('')
    if (code.length < 6) { setError(isAR ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter the 6-digit code'); return }
    if (code !== MOCK_OTP) { setError(isAR ? `للوقت الحالي، استخدم الرمز التجريبي ${MOCK_OTP}` : `For now, use the test code ${MOCK_OTP}`); return }
    setLoading(true)
    setError('')
    const { data: existing, error: upsertErr } = await supabase
      .from('subscribers')
      .upsert({ mobile_number: fullPhone }, { onConflict: 'mobile_number', ignoreDuplicates: false })
      .select('id, parent_name, kid_name, kid_birth_date')
      .single()
    if (upsertErr) { setError(upsertErr.message); setLoading(false); return }
    const subscriberId = existing.id
    subscriberIdRef.current = subscriberId
    setMockSubscriberId(subscriberId)
    setLoading(false)

    if (existing?.kid_birth_date) setKidBirthDate(existing.kid_birth_date)

    const { data: activeSub } = await supabase.from('subscriptions').select('id').eq('subscriber_id', subscriberId).in('status', ['active', 'frozen']).limit(1).maybeSingle()
    if (activeSub) { goToDashboard(); return }

    if (existing?.parent_name && existing?.kid_name) {
      await loadPlanOptions(existing.kid_birth_date)
      go('plan')
    } else {
      await loadStages()
      go('profile')
    }
  }

  async function saveProfile() {
    if (!parentName.trim() || !kidName.trim()) { setError(isAR ? 'يرجى إدخال اسمك واسم طفلك' : "Please fill in your name and your baby's name"); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('subscribers').update({ parent_name: parentName, kid_name: kidName, kid_birth_date: kidBirthDate || null }).eq('id', subscriberIdRef.current)
    setLoading(false)
    if (err) { setError(err.message); return }
    await loadPlanOptions(kidBirthDate)
    go('plan')
  }

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
    setPromoInfo(data)
    setPromoMsg(isAR ? `تم تطبيق خصم ${data.discount_percent}%` : `${data.discount_percent}% discount applied`)
  }

  function continueToCheckout() {
    if (!stageId || !cycleId || !startDate) { setError(isAR ? 'يرجى اختيار مرحلة وخطة وتاريخ بداية' : 'Please choose a stage, plan, and start date'); return }
    // Already have an address on file (saved earlier in the profile) — don't ask again.
    if (address.trim()) { saveLocation(); return }
    go('location')
  }

  async function saveLocation() {
    if (!address.trim()) { setError(isAR ? 'يرجى إدخال عنوان التوصيل' : 'Please enter your delivery address'); return }
    setLoading(true)
    setError('')
    const id = subscriberIdRef.current
    const { error: addrErr } = await supabase.from('subscribers').update({ delivery_address: address }).eq('id', id)
    if (addrErr) { setError(addrErr.message); setLoading(false); return }
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
    }).select('id, total_price, stages(name, name_ar), payment_cycles(label, label_ar)').single()
    setLoading(false)
    if (err) { setError(err.message); return }
    setSub(data as any)
    go('checkout')
  }

  async function pay() {
    if (!sub) return
    setLoading(true)
    setError('')
    const { error: payErr } = await supabase.from('payments').insert({
      subscription_id: sub.id, amount: sub.total_price, status: 'paid', gateway: 'mock',
    })
    if (payErr) { setError(payErr.message); setLoading(false); return }
    const { error: subErr } = await supabase.from('subscriptions').update({ status: 'active' }).eq('id', sub.id)
    setLoading(false)
    if (subErr) { setError(subErr.message); return }
    goToDashboard()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', marginBottom: 12 }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }
  const card = (active: boolean): React.CSSProperties => ({
    padding: '14px 16px', borderRadius: 12, border: active ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
    background: active ? '#FDF0E8' : 'white', cursor: 'pointer', marginBottom: 10,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 18, padding: '24px 26px', width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', fontFamily: 'inherit', direction: isAR ? 'rtl' : 'ltr' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes ninozStepIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ninoz-step { animation: ninozStepIn 0.32s cubic-bezier(.16,1,.3,1); }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          {history.length > 0 ? (
            <button onClick={goBack} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 700, color: '#C84B0F', cursor: 'pointer', padding: 0 }}>
              {isAR ? '→ رجوع' : '← Back'}
            </button>
          ) : <span />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#B0A098', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        {initializing && <div style={{ textAlign: 'center', color: '#7A7068', padding: 30 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>}

        {!initializing && step === 'phone' && (
          <div key={step} className="ninoz-step">
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginTop: 8, marginBottom: 6 }}>{isAR ? 'تسجيل الدخول عبر واتساب' : 'Sign in with WhatsApp'}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 16 }}>{isAR ? 'سنرسل لك رمزًا عبر واتساب لتأكيد رقمك.' : "We'll send a code to your WhatsApp to verify your number."}</p>
            <input style={inp} type="tel" placeholder="05xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" pattern="[0-9]*" maxLength={10} />
            {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
            <button style={btn} onClick={sendCode}>{isAR ? 'إرسال الرمز' : 'Send Code'}</button>
          </div>
        )}

        {!initializing && step === 'otp' && (
          <div key={step} className="ninoz-step">
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginTop: 8, marginBottom: 6 }}>{isAR ? 'أدخل رمز التحقق' : 'Enter verification code'}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 16 }}>
              {isAR ? 'وضع التجربة: استخدم' : 'Test mode: use'} <strong>{MOCK_OTP}</strong>
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 12 }}>
              {digits.map((d, i) => (
                <input key={i} ref={el => { inputsRef.current[i] = el }} value={d} onChange={e => onDigitChange(i, e.target.value)} inputMode="numeric" maxLength={1}
                  style={{ width: 40, height: 48, textAlign: 'center', fontSize: 18, fontWeight: 800, borderRadius: 10, border: d ? '2px solid #C84B0F' : '1.5px solid #EDE8E0', outline: 'none', fontFamily: 'inherit', color: '#1C1C1A' }} />
              ))}
            </div>
            {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
            <button style={btn} disabled={loading} onClick={() => verifyCode()}>{loading ? (isAR ? 'جار التحقق…' : 'Verifying…') : (isAR ? 'تحقق واستمر' : 'Verify & Continue')}</button>
          </div>
        )}

        {!initializing && step === 'profile' && (
          <div key={step} className="ninoz-step">
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginTop: 8, marginBottom: 6 }}>{isAR ? 'أخبرنا عنك' : 'Tell us about you'}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 16 }}>{isAR ? 'هذا يساعدنا على تخصيص وجبات طفلك.' : "This helps us personalize your baby's meals."}</p>
            <input style={inp} placeholder={isAR ? 'اسمك' : 'Your Name'} value={parentName} onChange={e => setParentName(e.target.value)} />
            <input style={inp} placeholder={isAR ? 'اسم الطفل' : "Baby's Name"} value={kidName} onChange={e => setKidName(e.target.value)} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'تاريخ ميلاد الطفل' : "Baby's birth date"}</label>
            <input type="date" style={inp} value={kidBirthDate} onChange={e => setKidBirthDate(e.target.value)} max={localISO(new Date())} />
            {kidBirthDate && recommendedStageId() ? (
              <p style={{ fontSize: 12.5, color: '#2D6A4F', background: '#E8F5EE', borderRadius: 8, padding: '8px 12px', marginTop: -6, marginBottom: 12, fontWeight: 600 }}>
                {(() => {
                  const st = stages.find(s => s.id === recommendedStageId())
                  const name = st ? ((isAR && st.name_ar) || st.name) : ''
                  return isAR ? `بناءً على عمره، المرحلة الموصى بها هي: ${name} ${st?.emoji || ''}` : `Based on his age, the recommended stage is: ${st?.emoji || ''} ${name}`
                })()}
              </p>
            ) : (
              <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: -6, marginBottom: 12 }}>{isAR ? 'يساعدنا على اقتراح المرحلة المناسبة لعمر طفلك.' : "Helps us suggest the right stage for your baby's age."}</p>
            )}
            {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
            <button style={btn} disabled={loading} onClick={saveProfile}>{loading ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'متابعة' : 'Continue')}</button>
          </div>
        )}

        {!initializing && step === 'plan' && (
          <div key={step} className="ninoz-step">
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginTop: 8, marginBottom: 6 }}>{isAR ? 'بناء خطتك' : 'Build your plan'}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 14 }}>{isAR ? 'اختر مرحلة طفلك وعدد مرات توصيل الوجبات.' : "Choose your baby's stage and how often you'd like meals delivered."}</p>

            <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{isAR ? 'المرحلة' : 'Stage'}</div>
            {stages.map(s => (
              <div key={s.id} style={card(stageId === s.id)} onClick={() => setStageId(s.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1A' }}>{s.emoji} {(isAR && s.name_ar) || s.name}</div>
                  {recommendedStageId() === s.id && (
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2D6A4F', background: '#E8F5EE', padding: '2px 8px', borderRadius: 6 }}>
                      {isAR ? 'موصى به' : 'Recommended'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#7A7068' }}>{(isAR && s.age_range_ar) || s.age_range}</div>
              </div>
            ))}

            <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 8px' }}>{isAR ? 'الخطة' : 'Plan'}</div>
            {cycles.map(c => (
              <div key={c.id} style={card(cycleId === c.id)} onClick={() => setCycleId(c.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1A' }}>{(isAR && c.label_ar) || c.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#C84B0F' }}>{c.price_sar} {isAR ? 'ريال' : 'SAR'}</div>
                </div>
                <div style={{ fontSize: 12, color: '#7A7068' }}>{isAR ? `${c.meals_total} وجبة خلال ${c.days} يوم` : `${c.meals_total} meals over ${c.days} days`}</div>
              </div>
            ))}

            <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 8px' }}>{isAR ? 'تاريخ البداية' : 'Start Date'}</div>
            <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: -4, marginBottom: 8 }}>{isAR ? 'التوصيل من الأحد إلى الخميس فقط. اسحب لرؤية تواريخ أخرى.' : 'Delivery runs Sunday–Thursday only. Swipe for more dates.'}</p>
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch', paddingBottom: 4, marginBottom: 16 }}>
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

            <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{isAR ? 'كود الخصم' : 'Promo Code'}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input style={{ ...inp, marginBottom: 0, flex: 1 }} placeholder={isAR ? 'أدخل الكود' : 'Enter code'} value={promoCode} onChange={e => setPromoCode(e.target.value)} />
              <button onClick={applyPromo} disabled={promoChecking || !promoCode.trim()} style={{ padding: '0 16px', borderRadius: 10, border: '1.5px solid #EDE8E0', background: 'white', color: '#1C1C1A', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {promoChecking ? (isAR ? '...' : '...') : (isAR ? 'تطبيق' : 'Apply')}
              </button>
            </div>
            {promoMsg && <div style={{ fontSize: 12.5, marginBottom: 10, color: promoInfo ? '#2D6A4F' : '#DC2626' }}>{promoMsg}</div>}

            {selectedCycle && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: '#7A7068', fontWeight: 700 }}>{isAR ? 'الإجمالي' : 'Total'}</span>
                <span>
                  {promoInfo && <span style={{ fontSize: 13, color: '#B0A098', textDecoration: 'line-through', marginInlineEnd: 8 }}>{basePrice} {isAR ? 'ريال' : 'SAR'}</span>}
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#C84B0F' }}>{finalPrice} {isAR ? 'ريال' : 'SAR'}</span>
                </span>
              </div>
            )}

            {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
            <button onClick={continueToCheckout} disabled={loading} style={btn}>
              {isAR ? 'متابعة' : 'Continue'}
            </button>
          </div>
        )}

        {!initializing && step === 'location' && (
          <div key={step} className="ninoz-step">
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginTop: 8, marginBottom: 6 }}>{isAR ? 'موقع التوصيل' : 'Delivery location'}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 16 }}>{isAR ? 'أين نوصّل وجبات طفلك؟' : "Where should we deliver your baby's meals?"}</p>

            <div style={{ height: 140, borderRadius: 12, background: '#F2EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#B0A098', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>
              📍 {isAR ? 'سيتم تفعيل محدد الموقع بعد ربط خرائط جوجل' : 'Map picker coming once Google Maps is connected'}
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'العنوان' : 'Address'}</label>
            <textarea
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', height: 80, resize: 'vertical', marginBottom: 14 }}
              placeholder={isAR ? 'المبنى، الشارع، الحي، المدينة' : 'Building, street, district, city'}
              value={address}
              onChange={e => setAddress(e.target.value)}
            />

            {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
            <button onClick={saveLocation} disabled={loading} style={btn}>
              {loading ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'متابعة إلى الدفع' : 'Continue to Payment')}
            </button>
          </div>
        )}

        {!initializing && step === 'checkout' && sub && (
          <div key={step} className="ninoz-step">
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginTop: 8, marginBottom: 6 }}>{isAR ? 'الدفع' : 'Checkout'}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 16 }}>{isAR ? 'راجع خطتك قبل الدفع.' : 'Review your plan before paying.'}</p>

            <div style={{ background: '#FAF7F4', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#7A7068' }}>{isAR ? 'المرحلة' : 'Stage'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A' }}>{(isAR && sub.stages?.name_ar) || sub.stages?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#7A7068' }}>{isAR ? 'الخطة' : 'Plan'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A' }}>{(isAR && sub.payment_cycles?.label_ar) || sub.payment_cycles?.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EDE8E0', paddingTop: 8, marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1A' }}>{isAR ? 'الإجمالي' : 'Total'}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#C84B0F' }}>{sub.total_price} {isAR ? 'ريال' : 'SAR'}</span>
              </div>
            </div>

            <div style={{ background: '#FFF8EE', border: '1px solid #F5E3C8', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#8A6D3B', marginBottom: 16 }}>
              {isAR ? 'بوابة الدفع غير متصلة بعد — الضغط على الدفع يحاكي عملية دفع ناجحة لتجربة المسار بالكامل.' : "Payment gateway isn't connected yet — clicking pay simulates a successful charge so we can test the full flow."}
            </div>

            {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
            <button onClick={pay} disabled={loading} style={btn}>
              {loading ? (isAR ? 'جار المعالجة…' : 'Processing…') : (isAR ? `دفع ${sub.total_price} ريال` : `Pay ${sub.total_price} SAR`)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
