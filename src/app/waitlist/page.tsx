'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lang = 'en' | 'ar'

const D: Record<string, string> = {
  waitlist_btn_color: '#C84B0F',
  waitlist_h1_en: 'You Care.', waitlist_h1_ar: 'أنت تهتم.',
  waitlist_h2_en: 'We Prepare.', waitlist_h2_ar: 'نحن نُعِد.',
  waitlist_sub_en: 'Delicious, healthy meals for your little one — delivered to your door.',
  waitlist_sub_ar: 'وجبات صحية ولذيذة لطفلك — توصيل إلى باب منزلك.',
  waitlist_form_title_en: 'Join the Waitlist', waitlist_form_title_ar: 'انضم لقائمة الانتظار',
  waitlist_form_sub_en: 'Be first to know when we launch in Riyadh',
  waitlist_form_sub_ar: 'كن أول من يعلم عند إطلاقنا في الرياض',
  waitlist_btn_en: 'Reserve My Spot →', waitlist_btn_ar: '← احجز مكانك',
  waitlist_footer_en: '© 2026 Ninoz · Riyadh, KSA',
  waitlist_footer_ar: '© 2026 Ninoz · الرياض، المملكة العربية السعودية',
  waitlist_show_baby_name: 'true', waitlist_show_baby_age: 'true',
  waitlist_badge1_icon: '🥗', waitlist_badge1_en: 'Fresh Ingredients', waitlist_badge1_ar: 'مكونات طازجة',
  waitlist_badge2_icon: '🚫', waitlist_badge2_en: 'No Preservatives', waitlist_badge2_ar: 'بدون مواد حافظة',
  waitlist_badge3_icon: '🍳', waitlist_badge3_en: 'Cooked Daily', waitlist_badge3_ar: 'طُهي يومياً',
  waitlist_badge4_icon: '👶', waitlist_badge4_en: 'Pediatrician Approved', waitlist_badge4_ar: 'موصى به طبياً',
  waitlist_success_title_en: "You're on the list! 🎉", waitlist_success_title_ar: 'أنت في القائمة! 🎉',
  waitlist_success_sub_en: "We'll reach out on WhatsApp as soon as we launch in Riyadh.",
  waitlist_success_sub_ar: 'سنتواصل معك عبر واتساب فور الإطلاق في الرياض.',
}

const AGES_EN = ['0–3 months', '3–6 months', '6–9 months', '9–12 months', '12–18 months', '18–24 months', '2–3 years']
const AGES_AR = ['0–3 أشهر', '3–6 أشهر', '6–9 أشهر', '9–12 شهر', '12–18 شهر', '18–24 شهر', '2–3 سنوات']

export default function WaitlistPage() {
  const supabase = createClient()
  const [lang, setLang] = useState<Lang>('en')
  const [cms, setCms] = useState<Record<string, string>>(D)
  const [form, setForm] = useState({ name: '', baby: '', wa: '', age: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const isAR = lang === 'ar'
  const g = (k: string) => cms[k] || D[k] || ''

  useEffect(() => {
    async function load() {
      const [{ data: content }, { data: logo }] = await Promise.all([
        supabase.from('site_content').select('key,value'),
        supabase.from('logo').select('url').limit(1).single(),
      ])
      const m = { ...D }
      for (const r of content || []) m[r.key] = r.value
      if (logo?.url && !m.waitlist_logo_url) m.waitlist_logo_url = logo.url
      setCms(m)
    }
    load()
  }, [])

  const submit = async () => {
    const e: Record<string, boolean> = {}
    if (!form.name.trim()) e.name = true
    if (!form.wa.trim()) e.wa = true
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    const { error } = await supabase.from('waitlist_submissions').insert({
      parent_name: form.name.trim(),
      baby_name: form.baby.trim() || null,
      whatsapp: form.wa.trim(),
      baby_age: form.age || null,
      language: lang,
    })
    if (error) { alert('Something went wrong. Please try again.'); setSubmitting(false); return }
    setDone(true)
    setSubmitting(false)
  }

  const btnColor = g('waitlist_btn_color')
  const bgUrl = g('waitlist_bg_url') || g('hero_image_url')
  const logoUrl = g('waitlist_logo_url')
  const showBabyName = g('waitlist_show_baby_name') !== 'false'
  const showBabyAge = g('waitlist_show_baby_age') !== 'false'
  const badges = [1, 2, 3, 4].map(n => ({ icon: g(`waitlist_badge${n}_icon`), label: g(isAR ? `waitlist_badge${n}_ar` : `waitlist_badge${n}_en`) }))
  const ages = isAR ? AGES_AR : AGES_EN

  const fieldFont = isAR ? "'Tajawal', 'Nunito', sans-serif" : "'Nunito', sans-serif"
  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '13px 16px', borderRadius: 14,
    border: hasError ? '2px solid #ff5555' : '1.5px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: fieldFont,
    textAlign: isAR ? 'right' : 'left', direction: isAR ? 'rtl' : 'ltr',
  })

  return (
    <div style={{
        minHeight: '100vh', fontFamily: isAR ? "'Tajawal','Nunito',sans-serif" : "'Nunito',sans-serif",
        direction: isAR ? 'rtl' : 'ltr', position: 'relative',
        backgroundImage: bgUrl ? `linear-gradient(rgba(15,7,3,0.65),rgba(15,7,3,0.65)), url(${bgUrl})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: bgUrl ? undefined : '#1C0A04',
      }}>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
          {logoUrl
            ? <img src={logoUrl} alt="Ninoz" style={{ height: 36, objectFit: 'contain' }} />
            : <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 24, color: btnColor }}>Ninoz</span>
          }
          <button onClick={() => setLang(isAR ? 'en' : 'ar')} style={{ background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: 22, padding: '6px 16px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {isAR ? 'English' : 'عربي'}
          </button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '18px 22px 10px' }}>
          <h1 style={{ margin: 0, lineHeight: 1.1 }}>
            <span style={{ display: 'block', fontSize: 'clamp(32px,9vw,52px)', fontWeight: 900, color: 'white' }}>{g(isAR ? 'waitlist_h1_ar' : 'waitlist_h1_en')}</span>
            <span style={{ display: 'block', fontSize: 'clamp(32px,9vw,52px)', fontWeight: 900, color: btnColor }}>{g(isAR ? 'waitlist_h2_ar' : 'waitlist_h2_en')}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, maxWidth: 300, margin: '12px auto 0', lineHeight: 1.6 }}>
            {g(isAR ? 'waitlist_sub_ar' : 'waitlist_sub_en')}
          </p>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '16px 20px', flexWrap: 'wrap' }}>
          {badges.map((b, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 66 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.13)', border: '1.5px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>
                {b.icon}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.3, maxWidth: 70 }}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 18px 28px' }}>
          <div style={{ width: '100%', maxWidth: 400, background: 'rgba(15,7,3,0.58)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: 26, padding: '26px 22px', border: '1px solid rgba(255,255,255,0.11)' }}>

            {done ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                <h2 style={{ color: 'white', fontSize: 19, fontWeight: 900, margin: '0 0 10px' }}>{g(isAR ? 'waitlist_success_title_ar' : 'waitlist_success_title_en')}</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{g(isAR ? 'waitlist_success_sub_ar' : 'waitlist_success_sub_en')}</p>
              </div>
            ) : (
              <>
                <h2 style={{ color: 'white', fontSize: 19, fontWeight: 900, margin: '0 0 4px', textAlign: 'center' }}>{g(isAR ? 'waitlist_form_title_ar' : 'waitlist_form_title_en')}</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.5 }}>{g(isAR ? 'waitlist_form_sub_ar' : 'waitlist_form_sub_en')}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{isAR ? 'اسمك' : 'Your Name'}</label>
                    <input placeholder={isAR ? 'اسم الأم / الأب' : 'Mom / Dad name'} value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: false })) }} style={inputStyle(errors.name)} />
                  </div>

                  {showBabyName && (
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{isAR ? 'اسم الطفل' : "Baby's Name"}</label>
                      <input placeholder={isAR ? 'اسم الطفل' : 'Baby name'} value={form.baby} onChange={e => setForm(p => ({ ...p, baby: e.target.value }))} style={inputStyle()} />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{isAR ? 'واتساب' : 'WhatsApp'}</label>
                    <input placeholder={isAR ? '966+ 5x xxxx xxx' : '966+ 5x xxx xxxx'} value={form.wa} onChange={e => { setForm(p => ({ ...p, wa: e.target.value })); setErrors(p => ({ ...p, wa: false })) }} style={{ ...inputStyle(errors.wa), direction: 'ltr', textAlign: 'left' }} type="tel" inputMode="tel" />
                  </div>

                  {showBabyAge && (
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{isAR ? 'عمر الطفل' : "Baby's Age"}</label>
                      <select value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                        <option value="" style={{ background: '#1C0A04' }}>{isAR ? 'اختر العمر' : 'Select age'}</option>
                        {ages.map(o => <option key={o} value={o} style={{ background: '#1C0A04' }}>{o}</option>)}
                      </select>
                    </div>
                  )}

                  <button onClick={submit} disabled={submitting} style={{ marginTop: 4, padding: 15, background: btnColor, color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit', transition: 'opacity 0.15s,transform 0.15s' }} onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'scale(1.02)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                    {submitting ? '...' : g(isAR ? 'waitlist_btn_ar' : 'waitlist_btn_en')}
                  </button>

                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.38)', fontSize: 11, margin: 0 }}>
                    {isAR ? 'بياناتك آمنة ولن تُشارك مع أي جهة.' : 'Your data is safe and will never be shared.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '12px 22px 20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>{g(isAR ? 'waitlist_footer_ar' : 'waitlist_footer_en')}</p>
        </div>
      </div>
    </div>
  )
}
