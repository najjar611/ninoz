'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

type Sub = { id: string; total_price: number; promo_code: string | null; discount_percent: number | null; stages: { name: string; name_ar?: string | null } | null; payment_cycles: { label: string; label_ar?: string | null } | null }
type PromoInfo = { code: string; discount_percent: number; max_uses: number | null }

export default function Checkout() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const params = useSearchParams()
  const subscriptionId = params.get('subscription_id')
  const [sub, setSub] = useState<Sub | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [error, setError] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoInfo, setPromoInfo] = useState<PromoInfo | null>(null)
  const [promoMsg, setPromoMsg] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }
    if (!subscriptionId) { router.replace('/account/plan'); return }
    supabase.from('subscriptions').select('id, total_price, promo_code, discount_percent, stages(name, name_ar), payment_cycles(label, label_ar)').eq('id', subscriptionId).single()
      .then(({ data }) => { setSub(data as any); setLoading(false) })
  }, [])

  // If a promo was already applied earlier (e.g. on the Build-your-plan page),
  // total_price is already discounted — show it as applied instead of asking again.
  const prePromo = !!sub?.promo_code

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

  const discountedPrice = sub && promoInfo
    ? Math.round(sub.total_price * (1 - promoInfo.discount_percent / 100))
    : sub?.total_price ?? 0

  async function pay() {
    if (!sub) return
    setPaying(true)
    setError('')
    const finalPrice = discountedPrice
    if (promoInfo) {
      await supabase.from('subscriptions').update({
        promo_code: promoInfo.code, discount_percent: promoInfo.discount_percent, total_price: finalPrice,
      }).eq('id', sub.id)
    }
    // TODO: replace with real Moyasar/Tap charge once a payment gateway is connected.
    const { error: payErr } = await supabase.from('payments').insert({
      subscription_id: sub.id, amount: finalPrice, status: 'paid', gateway: 'mock',
    })
    if (payErr) { setError(payErr.message); setPaying(false); return }
    const { error: subErr } = await supabase.from('subscriptions').update({ status: 'active' }).eq('id', sub.id)
    setPaying(false)
    if (subErr) { setError(subErr.message); return }
    // Celebrate the successful subscription, then continue to the address step.
    setCelebrating(true)
    setTimeout(() => router.push(`/account/location?subscription_id=${sub.id}`), 1900)
  }

  if (loading || !sub) return <div style={{ textAlign: 'center', color: '#7A7068', padding: 20 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>

  if (celebrating) {
    const colors = ['#C84B0F', '#2D6A4F', '#1E6091', '#E8B04B', '#D95D39']
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#F7F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 3000, overflow: 'hidden' }}>
        <style>{`
          @keyframes ninozPop { 0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
          @keyframes ninozFall { 0% { transform: translateY(-20vh) rotate(0); opacity: 1; } 100% { transform: translateY(85vh) rotate(540deg); opacity: 0; } }
        `}</style>
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: 0, left: `${(i * 37) % 100}%`, width: 9, height: 14, borderRadius: 2, background: colors[i % colors.length], animation: `ninozFall ${1.4 + (i % 5) * 0.25}s ${(i % 7) * 0.12}s ease-in forwards` }} />
        ))}
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#2D6A4F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, animation: 'ninozPop .5s cubic-bezier(.16,1,.3,1)' }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A' }}>{isAR ? 'تم الاشتراك بنجاح!' : 'Subscription confirmed!'}</div>
        <div style={{ fontSize: 13.5, color: '#7A7068' }}>{isAR ? 'لحظة، ننقلك لإضافة عنوان التوصيل…' : "One sec — taking you to your delivery address…"}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'الدفع' : 'Checkout'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>{isAR ? 'راجع خطتك قبل الدفع.' : 'Review your plan before paying.'}</p>

      <div style={{ background: '#FAF7F4', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#7A7068' }}>{isAR ? 'المرحلة' : 'Stage'}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A' }}>{(isAR && sub.stages?.name_ar) || sub.stages?.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#7A7068' }}>{isAR ? 'الخطة' : 'Plan'}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A' }}>{(isAR && sub.payment_cycles?.label_ar) || sub.payment_cycles?.label}</span>
        </div>
        {promoInfo && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2D6A4F', fontSize: 13 }}>
            <span>{isAR ? `خصم ${promoInfo.discount_percent}%` : `${promoInfo.discount_percent}% discount`}</span>
            <span>−{sub.total_price - discountedPrice} {isAR ? 'ريال' : 'SAR'}</span>
          </div>
        )}
        {prePromo && !promoInfo && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2D6A4F', fontSize: 13 }}>
            <span>{isAR ? `كود ${sub.promo_code} (${sub.discount_percent}%)` : `Code ${sub.promo_code} (${sub.discount_percent}%)`}</span>
            <span>✓ {isAR ? 'مُطبّق' : 'applied'}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EDE8E0', paddingTop: 8, marginTop: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1A' }}>{isAR ? 'الإجمالي' : 'Total'}</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#C84B0F' }}>{discountedPrice} {isAR ? 'ريال' : 'SAR'}</span>
        </div>
      </div>

      {!prePromo && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'كود الخصم (اختياري)' : 'Promo code (optional)'}</label>
          <div style={{ display: 'flex', gap: 8 }}>
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
          {promoMsg && <div style={{ fontSize: 12.5, marginTop: 6, color: promoInfo ? '#2D6A4F' : '#DC2626', fontWeight: 600 }}>{promoMsg}</div>}
        </div>
      )}

      <div style={{ background: '#FFF8EE', border: '1px solid #F5E3C8', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#8A6D3B', marginBottom: 16 }}>
        {isAR ? 'بوابة الدفع غير متصلة بعد — الضغط على الدفع يحاكي عملية دفع ناجحة لتجربة المسار بالكامل.' : "Payment gateway isn't connected yet — clicking pay simulates a successful charge so we can test the full flow."}
      </div>

      {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
      <button onClick={pay} disabled={paying} style={{ width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: paying ? 0.6 : 1 }}>
        {paying ? (isAR ? 'جار المعالجة…' : 'Processing…') : (isAR ? `دفع ${discountedPrice} ريال` : `Pay ${discountedPrice} SAR`)}
      </button>
    </div>
  )
}
