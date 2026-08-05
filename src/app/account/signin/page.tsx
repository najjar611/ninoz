'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { setMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

// Names are text only — strip Western + Arabic-Indic digits as the user types.
const stripDigits = (s: string) => s.replace(/[0-9٠-٩۰-۹]/g, '')

const MOCK_OTP = '1234'
const OTP_LEN = 4
const RESEND_SECONDS = 30

export default function SignIn() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step !== 'otp') return
    setResendIn(RESEND_SECONDS)
    const t = setInterval(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [step])

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }

  const phoneDigits = phone.replace(/\D/g, '')
  const nationalDigits = phoneDigits.startsWith('0') ? phoneDigits.slice(1) : phoneDigits
  const fullPhone = `+966${nationalDigits}`
  const phoneValid = /^0\d{9}$/.test(phoneDigits)
  // Live hint under the phone field: nudge to start with 0, then to complete 10 digits.
  const phoneHint = phoneDigits.length === 0
    ? (isAR ? 'يبدأ الرقم بـ 0 (مثال: 05xxxxxxxx)' : 'Number must start with 0 (e.g. 05xxxxxxxx)')
    : !phoneDigits.startsWith('0')
      ? (isAR ? 'يجب أن يبدأ الرقم بـ 0' : 'Number must start with 0')
      : !phoneValid
        ? (isAR ? 'الرقم مكوّن من 10 أرقام' : 'Number must be 10 digits')
        : ''
  const nameValid = !!name.trim()

  function goGuest() {
    if (typeof window !== 'undefined') localStorage.setItem('ninoz_entry', 'guest')
    router.push('/')
  }

  function sendCode() {
    if (!nameValid) { setError(isAR ? 'يرجى إدخال اسمك' : 'Please enter your name'); return }
    if (!phoneValid) { setError(isAR ? 'أدخل رقم جوال مكوّن من 10 أرقام يبدأ بـ 0' : 'Enter a 10-digit number starting with 0'); return }
    setError(''); setDigits(Array(OTP_LEN).fill(''))
    setStep('otp')
    setTimeout(() => inputsRef.current[0]?.focus(), 50)
  }

  async function verify(code: string) {
    if (loading) return
    if (code.length < OTP_LEN) { setError(isAR ? `أدخل الرمز المكوّن من ${OTP_LEN} أرقام` : `Enter the ${OTP_LEN}-digit code`); return }
    if (code !== MOCK_OTP) { setError(isAR ? `للوقت الحالي، استخدم الرمز التجريبي ${MOCK_OTP}` : `For now, use the test code ${MOCK_OTP}`); return }
    setLoading(true); setError('')
    const { data: existing, error: upErr } = await supabase
      .from('subscribers')
      .upsert({ mobile_number: fullPhone }, { onConflict: 'mobile_number', ignoreDuplicates: false })
      .select('id, parent_name')
      .single()
    if (upErr) { setError(upErr.message); setLoading(false); return }
    // Save the name (only set it if we captured one / it's not already stored).
    if (name.trim() && !existing.parent_name) {
      await supabase.from('subscribers').update({ parent_name: name.trim() }).eq('id', existing.id)
    }
    setMockSubscriberId(existing.id)
    router.push(next)
  }

  function onDigitChange(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1)
    const nextDigits = [...digits]; nextDigits[i] = d
    setDigits(nextDigits)
    if (d && i < OTP_LEN - 1) inputsRef.current[i + 1]?.focus()
    // Auto-submit once the 4th digit is filled.
    if (d && i === OTP_LEN - 1) { const code = nextDigits.join(''); if (code.length === OTP_LEN) verify(code) }
  }
  function onDigitKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus()
    if (e.key === 'Enter') verify(digits.join(''))
  }
  function onDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (!pasted) return
    e.preventDefault()
    const nextDigits = Array(OTP_LEN).fill('').map((_, i) => pasted[i] || '')
    setDigits(nextDigits)
    if (pasted.length === OTP_LEN) verify(pasted)
    else inputsRef.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus()
  }

  // Soft, classy inline notification (replaces the bare red line).
  const softNote = (text: string, tone: 'error' | 'hint' = 'error') => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '9px 12px', borderRadius: 12,
      background: tone === 'error' ? '#FDECEA' : '#FBF3EC', border: `1px solid ${tone === 'error' ? '#F5C6C0' : '#EFDCC9'}`,
      color: tone === 'error' ? '#B5321E' : '#A9713B', fontSize: 12.5, fontWeight: 700,
      animation: 'nzNote .28s cubic-bezier(.16,1,.3,1) both',
    }}>
      <style>{`@keyframes nzNote{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.2" /></svg>
      <span>{text}</span>
    </div>
  )

  return (
    <div>
      <button onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#7A7068', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 12 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: isAR ? 'scaleX(-1)' : 'none' }}><path d="M15 6l-6 6 6 6" /></svg>{isAR ? 'رجوع' : 'Back'}
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>
        {step === 'phone' ? (isAR ? 'إنشاء حساب' : 'Create your account') : (isAR ? 'أدخل رمز التحقق' : 'Enter verification code')}
      </h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20, lineHeight: 1.5 }}>
        {step === 'phone'
          ? (isAR ? 'اسمك ورقم جوالك فقط للبدء.' : 'Just your name and mobile number to get started.')
          : <>{isAR ? 'أرسلنا رمزًا إلى' : 'We sent a code to'} <strong>{fullPhone}</strong>. <span style={{ color: '#C9A98A' }}>({isAR ? 'وضع التجربة: استخدم' : 'Test mode: use'} {MOCK_OTP})</span></>}
      </p>

      {step === 'phone' ? (
        <>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'الاسم' : 'Name'}</label>
          <input style={{ ...inp, marginBottom: 14 }} value={name} onChange={e => setName(stripDigits(e.target.value))} placeholder={isAR ? 'مثال: محمد' : 'e.g. Mohammed'} onKeyDown={e => e.key === 'Enter' && sendCode()} />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'رقم الجوال' : 'Mobile number'}</label>
          <div style={{ display: 'flex', gap: 8 }} dir="ltr">
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', background: '#F7F4F0', fontWeight: 800, color: '#1C1C1A', flexShrink: 0 }}>+966</span>
            <input style={{ ...inp, flex: 1, textAlign: 'left', borderColor: phoneDigits.length > 0 && !phoneValid ? '#E8A79C' : '#EDE8E0' }} placeholder="05xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" maxLength={10} onKeyDown={e => e.key === 'Enter' && phoneValid && sendCode()} />
          </div>
          {phoneHint && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, color: '#C25B48', fontSize: 11.5, fontWeight: 700 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C25B48', display: 'inline-block' }} />{phoneHint}
            </div>
          )}
          {error && softNote(error)}
          <button style={{ ...btn, opacity: nameValid && phoneValid ? 1 : 0.55 }} disabled={!nameValid || !phoneValid} onClick={sendCode}>{isAR ? 'إرسال الرمز' : 'Send code'}</button>
          <button onClick={goGuest} style={{ display: 'block', width: '100%', marginTop: 14, background: 'none', border: 'none', color: '#A79C90', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {isAR ? 'المتابعة كضيف' : 'Continue as guest'}
          </button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={onDigitPaste} dir="ltr">
            {digits.map((d, i) => (
              <input key={i} ref={el => { inputsRef.current[i] = el }} value={d} onChange={e => onDigitChange(i, e.target.value)} onKeyDown={e => onDigitKeyDown(i, e)} inputMode="numeric" maxLength={1}
                style={{ width: 56, height: 62, textAlign: 'center', fontSize: 24, fontWeight: 800, borderRadius: 12, border: d ? '2px solid #C84B0F' : '1.5px solid #EDE8E0', outline: 'none', fontFamily: 'inherit', color: '#1C1C1A', transition: 'border-color 0.15s, transform 0.15s', transform: d ? 'scale(1.05)' : 'scale(1)' }} />
            ))}
          </div>
          {error && softNote(error)}
          <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={() => verify(digits.join(''))}>{loading ? (isAR ? 'جار التحقق…' : 'Verifying…') : (isAR ? 'تحقق' : 'Verify')}</button>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            {resendIn > 0
              ? <span style={{ fontSize: 12.5, color: '#B0A098', fontWeight: 600 }}>{isAR ? 'إعادة الإرسال خلال' : 'Resend in'} 00:{String(resendIn).padStart(2, '0')}</span>
              : <button onClick={sendCode} style={{ background: 'none', border: 'none', color: '#C84B0F', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{isAR ? 'إعادة إرسال الرمز' : 'Resend code'}</button>}
          </div>
          <button style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#7A7068', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }} onClick={() => setStep('phone')}>{isAR ? 'تغيير الرقم' : 'Change number'}</button>
        </>
      )}
    </div>
  )
}
