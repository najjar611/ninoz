'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { setMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

const MOCK_OTP = '123456'
const RESEND_SECONDS = 30

const COUNTRIES = [
  { code: 'SA', dial: '966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '971', flag: '🇦🇪', name: 'UAE' },
  { code: 'KW', dial: '965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'QA', dial: '974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'BH', dial: '973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'OM', dial: '968', flag: '🇴🇲', name: 'Oman' },
  { code: 'EG', dial: '20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'JO', dial: '962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'US', dial: '1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '44', flag: '🇬🇧', name: 'United Kingdom' },
]

export default function SignIn() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const [country, setCountry] = useState(COUNTRIES[0])
  const [countryOpen, setCountryOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone')
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const [subscriberId, setSubscriberId] = useState<string | null>(null)
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [detailsError, setDetailsError] = useState('')

  useEffect(() => {
    if (step !== 'otp') return
    setResendIn(RESEND_SECONDS)
    const t = setInterval(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [step])

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }

  const isSaudi = country.code === 'SA'
  const phoneDigits = phone.replace(/\D/g, '')
  const nationalDigits = isSaudi && phoneDigits.startsWith('0') ? phoneDigits.slice(1) : phoneDigits
  const fullPhone = `+${country.dial}${nationalDigits}`

  function sendCode() {
    if (isSaudi) {
      if (!/^0\d{9}$/.test(phoneDigits)) {
        setError(isAR ? 'أدخل رقم هاتف مكون من 10 أرقام ويبدأ بـ 0' : 'Enter a 10-digit number starting with 0')
        return
      }
    } else if (phoneDigits.length < 8) {
      setError(isAR ? 'أدخل رقم هاتف صحيح' : 'Enter a valid phone number')
      return
    }
    setError('')
    setDigits(Array(6).fill(''))
    // TODO: replace with real WhatsApp OTP send once credentials are wired up.
    setStep('otp')
    setTimeout(() => inputsRef.current[0]?.focus(), 50)
  }

  function onDigitChange(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1)
    setDigits(prev => {
      const next = [...prev]
      next[i] = d
      return next
    })
    if (d && i < 5) inputsRef.current[i + 1]?.focus()
  }

  function onDigitKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus()
  }

  function onDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    setDigits(prev => {
      const next = [...prev]
      for (let i = 0; i < 6; i++) next[i] = pasted[i] || next[i] || ''
      return next
    })
    inputsRef.current[Math.min(pasted.length, 5)]?.focus()
  }

  async function verifyCode() {
    if (loading) return
    const code = digits.join('')
    if (code.length < 6) { setError(isAR ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter the 6-digit code'); return }
    if (code !== MOCK_OTP) { setError(isAR ? `للوقت الحالي، استخدم الرمز التجريبي ${MOCK_OTP}` : `For now, use the test code ${MOCK_OTP}`); return }
    setLoading(true)
    setError('')

    const { data: existing, error: upsertErr } = await supabase
      .from('subscribers')
      .upsert({ mobile_number: fullPhone }, { onConflict: 'mobile_number', ignoreDuplicates: false })
      .select('id, parent_name, kid_name')
      .single()
    if (upsertErr) { setError(upsertErr.message); setLoading(false); return }
    const id = existing.id

    setMockSubscriberId(id)
    setSubscriberId(id)
    setLoading(false)

    if (!existing.parent_name || !existing.kid_name) {
      setStep('details')
    } else {
      router.push('/account/dashboard')
    }
  }

  async function saveDetails() {
    if (!parentName.trim() || !kidName.trim()) {
      setDetailsError(isAR ? 'يرجى إدخال اسمك واسم طفلك' : "Please enter your name and your baby's name")
      return
    }
    if (!subscriberId) return
    setLoading(true)
    setDetailsError('')
    const { error: updateErr } = await supabase.from('subscribers')
      .update({ parent_name: parentName.trim(), kid_name: kidName.trim() })
      .eq('id', subscriberId)
    setLoading(false)
    if (updateErr) { setDetailsError(updateErr.message); return }
    router.push('/account/dashboard')
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>
        {step === 'phone' && (isAR ? 'تسجيل الدخول عبر واتساب' : 'Sign in with WhatsApp')}
        {step === 'otp' && (isAR ? 'أدخل رمز التحقق' : 'Enter verification code')}
        {step === 'details' && (isAR ? 'أخبرنا عن طفلك' : 'Tell us about your baby')}
      </h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20, lineHeight: 1.5 }}>
        {step === 'phone' && (isAR ? 'سنرسل لك رمزًا عبر واتساب لتأكيد رقمك.' : "We'll send a code to your WhatsApp to verify your number.")}
        {step === 'otp' && <>{isAR ? 'أرسلنا رمزًا إلى' : 'We sent a code to'} <strong>{fullPhone}</strong>. <span style={{ color: '#C9A98A' }}>({isAR ? 'وضع التجربة: استخدم' : 'Test mode: use'} {MOCK_OTP})</span></>}
        {step === 'details' && (isAR ? 'اسمك واسم طفلك حتى نجهز وجباته بشكل صحيح.' : "Your name and your baby's name, so we can get meals ready correctly.")}
      </p>

      {step === 'phone' ? (
        <>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setCountryOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 12px', borderRadius: 10, border: '1.5px solid #EDE8E0', background: 'white', fontFamily: 'inherit', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}
            >
              <span style={{ fontSize: 18 }}>{country.flag}</span>
              <span style={{ fontWeight: 700, color: '#1C1C1A' }}>+{country.dial}</span>
              <span style={{ fontSize: 10, color: '#B0A098' }}>▾</span>
            </button>
            <input
              style={{ ...inp, flex: 1 }}
              placeholder={isSaudi ? '05xxxxxxxx' : '5xx xxx xxx'}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, isSaudi ? 10 : 15))}
              inputMode="numeric"
              maxLength={isSaudi ? 10 : 15}
            />

            {countryOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 220, maxHeight: 260, overflowY: 'auto',
                background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 20,
              }}>
                {COUNTRIES.map(c => (
                  <div
                    key={c.code}
                    onClick={() => { setCountry(c); setCountryOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13.5 }}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <span style={{ fontSize: 17 }}>{c.flag}</span>
                    <span style={{ flex: 1, color: '#1C1C1A', fontWeight: 600 }}>{c.name}</span>
                    <span style={{ color: '#7A7068' }}>+{c.dial}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
          <button style={btn} onClick={sendCode}>{isAR ? 'إرسال الرمز' : 'Send Code'}</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }} onPaste={onDigitPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el }}
                value={d}
                onChange={e => onDigitChange(i, e.target.value)}
                onKeyDown={e => onDigitKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                style={{
                  width: 44, height: 52, textAlign: 'center', fontSize: 20, fontWeight: 800,
                  borderRadius: 10, border: d ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
                  outline: 'none', fontFamily: 'inherit', color: '#1C1C1A',
                  transition: 'border-color 0.15s, transform 0.15s',
                  transform: d ? 'scale(1.04)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 10 }}>{error}</div>}
          <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={verifyCode}>{loading ? (isAR ? 'جار التحقق…' : 'Verifying…') : (isAR ? 'تحقق واستمر' : 'Verify & Continue')}</button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            {resendIn > 0 ? (
              <span style={{ fontSize: 12.5, color: '#B0A098', fontWeight: 600 }}>{isAR ? 'إعادة الإرسال خلال' : 'Resend code in'} 00:{String(resendIn).padStart(2, '0')}</span>
            ) : (
              <button onClick={sendCode} style={{ background: 'none', border: 'none', color: '#C84B0F', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{isAR ? 'إعادة إرسال الرمز' : 'Resend code'}</button>
            )}
          </div>
          <button style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#7A7068', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }} onClick={() => setStep('phone')}>{isAR ? '← تغيير الرقم' : '← Change number'}</button>
        </>
      )}

      {step === 'details' && (
        <>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'اسمك' : 'Your Name'}</label>
          <input style={{ ...inp, marginBottom: 14 }} value={parentName} onChange={e => setParentName(e.target.value)} placeholder={isAR ? 'مثال: محمد' : 'e.g. Mohammed'} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'اسم الطفل' : "Baby's Name"}</label>
          <input style={inp} value={kidName} onChange={e => setKidName(e.target.value)} placeholder={isAR ? 'مثال: أحمد' : 'e.g. Ahmad'} />

          {detailsError && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 8 }}>{detailsError}</div>}
          <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={saveDetails}>
            {loading ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'استمرار' : 'Continue')}
          </button>
        </>
      )}
    </div>
  )
}
