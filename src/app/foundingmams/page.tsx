'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lang = 'en' | 'ar'
type Stage = { id: string; name: string; age_range: string; min_age_months: number | null; max_age_months: number | null }

function ageInMonths(dateStr: string): number | null {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months--
  return Math.max(0, months)
}

const D: Record<string, string> = {
  waitlist_btn_color: '#C84B0F',
  waitlist_font: 'Quicksand',
  waitlist_h1_en: 'You Care.', waitlist_h1_ar: 'أنت تهتم.',
  waitlist_h2_en: 'We Prepare.', waitlist_h2_ar: 'نحن نُعِد.',
  waitlist_badge_title_en: 'Founding Mamas', waitlist_badge_title_ar: 'أمهات نينوز',
  waitlist_sub_en: 'Join the first 20 mamas and be part of the Ninoz story from day one',
  waitlist_sub_ar: 'انضمي لأول 20 أم وكوني جزءاً من قصة نينوز من البداية',
  waitlist_form_title_en: 'Reserve your Founding Mama spot', waitlist_form_title_ar: 'احجزي مكانك كـ أمهات نينوز',
  waitlist_form_sub_en: 'Limited to 20 mamas only', waitlist_form_sub_ar: 'أماكن محدودة · 20 فقط',
  waitlist_btn_en: 'Join Now 👑', waitlist_btn_ar: 'انضمي الآن 👑',
  waitlist_footer_en: 'Your data is safe · Limited to 20 mamas', waitlist_footer_ar: 'بياناتك محمية · أماكن محدودة',
  waitlist_benefit1_value_en: '25', waitlist_benefit1_value_ar: '25',
  waitlist_benefit1_label_en: 'Founding Mamas discount', waitlist_benefit1_label_ar: 'خصم أمهات نينوز',
  waitlist_benefit2_icon: '🔒',
  waitlist_benefit2_label_en: 'Price locked for life', waitlist_benefit2_label_ar: 'سعر مجمّد للأبد',
  waitlist_benefit3_icon: '👩‍⚕️',
  waitlist_benefit3_label_en: 'Direct access to a pediatric nutrition specialist', waitlist_benefit3_label_ar: 'وصول مباشر لاستشاري تغذية الأطفال',
  waitlist_badge1_icon: '🥦', waitlist_badge1_en: 'Fresh Ingredients', waitlist_badge1_ar: 'مكونات طازجة',
  waitlist_badge2_icon: '🚫', waitlist_badge2_en: 'No Preservatives', waitlist_badge2_ar: 'بدون مواد حافظة',
  waitlist_badge3_icon: '🔄', waitlist_badge3_en: 'Cooked Daily', waitlist_badge3_ar: 'يُطبخ يومياً',
  waitlist_badge4_icon: '🩺', waitlist_badge4_en: 'Pediatrician Approved', waitlist_badge4_ar: 'معتمد طبياً',
  waitlist_success_title_en: "You're in! 🎉", waitlist_success_title_ar: 'تم تسجيلك! 🎉',
  waitlist_success_sub_en: "Welcome to the Founding Mamas family. We'll reach out on WhatsApp soon.",
  waitlist_success_sub_ar: 'مرحباً بك في عائلة أمهات نينوز. سنتواصل معك عبر واتساب قريباً.',
}

export default function WaitlistPage() {
  const supabase = createClient()
  const [lang, setLang] = useState<Lang>('ar')
  const [cms, setCms] = useState<Record<string, string>>(D)
  const [stages, setStages] = useState<Stage[]>([])
  const [form, setForm] = useState({ name: '', baby: '', wa: '', birthday: '', stage: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [recommended, setRecommended] = useState<Stage | null>(null)

  const isAR = lang === 'ar'
  const g = (k: string) => cms[k] || D[k] || ''

  useEffect(() => {
    async function load() {
      const [{ data: content }, { data: logo }, { data: stagesData }] = await Promise.all([
        supabase.from('site_content').select('key,value'),
        supabase.from('logo').select('url').limit(1).single(),
        supabase.from('stages').select('id,name,age_range,min_age_months,max_age_months').eq('is_active', true).order('position'),
      ])
      const m = { ...D }
      for (const r of content || []) m[r.key] = r.value
      if (logo?.url && !m.waitlist_logo_url) m.waitlist_logo_url = logo.url
      setCms(m)
      setStages(stagesData || [])
    }
    load()
  }, [])

  useEffect(() => {
    const font = cms.waitlist_font || D.waitlist_font || 'Quicksand'
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap`
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [cms.waitlist_font])

  useEffect(() => {
    const months = ageInMonths(form.birthday)
    if (months === null || stages.length === 0) { setRecommended(null); return }
    const match = stages.find(s =>
      s.min_age_months !== null && s.max_age_months !== null &&
      months >= s.min_age_months && months <= s.max_age_months
    )
    if (match) {
      setRecommended(match)
      setForm(p => ({ ...p, stage: match.id }))
    } else {
      setRecommended(null)
    }
  }, [form.birthday, stages])

  const submit = async () => {
    const e: Record<string, boolean> = {}
    if (!form.name.trim()) e.name = true
    if (!form.wa.trim()) e.wa = true
    else if (!/^0\d{9}$/.test(form.wa.trim())) e.wa = true
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    const { error } = await supabase.from('waitlist_submissions').insert({
      parent_name: form.name.trim(),
      baby_name: form.baby.trim() || null,
      whatsapp: form.wa.trim(),
      baby_age: form.birthday || null,
      language: lang,
    })
    if (error) {
      console.error('Waitlist insert error:', error)
      alert('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
  }

  const btnColor = g('waitlist_btn_color') || '#C84B0F'
  const bgUrl = g('waitlist_bg_url') || g('hero_image_url')
  const logoUrl = g('waitlist_logo_url')
  const logoHeight = parseInt(g('waitlist_logo_height') || '40')
  const badges = [1, 2, 3, 4].map(n => ({
    icon: g(`waitlist_badge${n}_icon`),
    label: g(isAR ? `waitlist_badge${n}_ar` : `waitlist_badge${n}_en`)
  }))

  const waitlistFont = g('waitlist_font') || 'Quicksand'
  const ff = isAR ? `'Tajawal','${waitlistFont}',sans-serif` : `'${waitlistFont}',sans-serif`

  const inp = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '14px 16px', borderRadius: 16,
    border: hasError ? '2px solid #ff6b6b' : '1.5px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 15,
    outline: 'none', boxSizing: 'border-box', fontFamily: ff,
    textAlign: isAR ? 'right' : 'left', direction: isAR ? 'rtl' : 'ltr',
    backdropFilter: 'blur(4px)', transition: 'border-color 0.18s, background 0.18s, transform 0.12s',
  })

  const selectStyle: React.CSSProperties = {
    ...inp(), cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9' fill='none'%3E%3Cpath d='M1 1L7 7L13 1' stroke='${encodeURIComponent(btnColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: isAR ? '16px center' : 'calc(100% - 16px) center',
    paddingInlineEnd: isAR ? 16 : 42, paddingInlineStart: isAR ? 42 : 16,
  }

  const focusGlow = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = btnColor
    e.currentTarget.style.background = 'rgba(255,255,255,0.11)'
  }
  const blurGlow = (hasError?: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = hasError ? '#ff6b6b' : 'rgba(255,255,255,0.16)'
    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
  }

  return (
    <div style={{
      minHeight: '100vh', fontFamily: ff, direction: isAR ? 'rtl' : 'ltr',
      backgroundImage: bgUrl
        ? `linear-gradient(rgba(10,5,2,0.72),rgba(10,5,2,0.72)), url(${bgUrl})`
        : 'linear-gradient(rgba(10,5,2,0.72),rgba(10,5,2,0.72))',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      backgroundColor: '#1C0A04',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .ninoz-lang-btn:hover { background: rgba(255,255,255,0.2) !important; transform: scale(1.05); }
        .ninoz-submit-btn:active { transform: scale(0.97) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.7; }
        input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
        select option { padding: 10px; }
      `}</style>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div>
          {logoUrl
            ? <img src={logoUrl} alt="Ninoz" style={{ height: logoHeight, maxWidth: 160, objectFit: 'contain' }} />
            : <span style={{ fontWeight: 900, fontSize: 22, color: btnColor }}>Ninoz</span>}
        </div>
        <button className="ninoz-lang-btn" onClick={() => setLang(isAR ? 'en' : 'ar')} style={{
          background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)',
          borderRadius: 20, padding: '6px 18px', color: 'white', fontSize: 13,
          fontWeight: 700, cursor: 'pointer', fontFamily: ff, transition: 'transform 0.15s, background 0.15s',
        }}>
          {isAR ? 'English' : 'عربي'}
        </button>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 48px' }}>

        {/* Hero text */}
        <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          <h1 style={{ margin: '0 0 16px', lineHeight: 1.1 }}>
            <span style={{ display: 'block', fontSize: 'clamp(36px,10vw,56px)', fontWeight: 900, color: 'white' }}>
              {g(isAR ? 'waitlist_h1_ar' : 'waitlist_h1_en')}
            </span>
            <span style={{ display: 'block', fontSize: 'clamp(36px,10vw,56px)', fontWeight: 900, color: btnColor }}>
              {g(isAR ? 'waitlist_h2_ar' : 'waitlist_h2_en')}
            </span>
          </h1>

          {/* Founding Mamas badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: btnColor, borderRadius: 50, padding: '10px 28px', marginBottom: 18 }}>
            <span style={{ fontSize: 18 }}>👑</span>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 17 }}>
              {g(isAR ? 'waitlist_badge_title_ar' : 'waitlist_badge_title_en')}
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, maxWidth: 360, margin: '0 auto', lineHeight: 1.65 }}>
            {g(isAR ? 'waitlist_sub_ar' : 'waitlist_sub_en')}
          </p>
        </div>

        {/* 3 Benefit cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {/* Card 1 — 25% */}
          <div style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '16px 12px', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: btnColor, marginBottom: 6 }}>
              {g(isAR ? 'waitlist_benefit1_value_ar' : 'waitlist_benefit1_value_en')}%
            </div>
            <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11, lineHeight: 1.4 }}>
              {g(isAR ? 'waitlist_benefit1_label_ar' : 'waitlist_benefit1_label_en')}
            </div>
          </div>
          {/* Card 2 — locked price */}
          <div style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '16px 12px', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{g('waitlist_benefit2_icon')}</div>
            <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11, lineHeight: 1.4 }}>
              {g(isAR ? 'waitlist_benefit2_label_ar' : 'waitlist_benefit2_label_en')}
            </div>
          </div>
          {/* Card 3 — specialist */}
          <div style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '16px 12px', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{g('waitlist_benefit3_icon')}</div>
            <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11, lineHeight: 1.4 }}>
              {g(isAR ? 'waitlist_benefit3_label_ar' : 'waitlist_benefit3_label_en')}
            </div>
          </div>
        </div>

        {/* 4 circular badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          {badges.map((b, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {b.icon}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, textAlign: 'center', maxWidth: 72, lineHeight: 1.3 }}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={{ background: 'rgba(20,10,5,0.55)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderRadius: 24, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.12)' }}>

          {done ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🎉</div>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 12px' }}>
                {g(isAR ? 'waitlist_success_title_ar' : 'waitlist_success_title_en')}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                {g(isAR ? 'waitlist_success_sub_ar' : 'waitlist_success_sub_en')}
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 6px', textAlign: 'center' }}>
                {g(isAR ? 'waitlist_form_title_ar' : 'waitlist_form_title_en')}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '0 0 22px', textAlign: 'center' }}>
                {g(isAR ? 'waitlist_form_sub_ar' : 'waitlist_form_sub_en')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Name row — 2 columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, marginBottom: 6, textAlign: isAR ? 'right' : 'left' }}>
                      {isAR ? 'اسمك' : 'Your Name'}
                    </label>
                    <input
                      placeholder={isAR ? 'أم سارة' : 'Mom name'}
                      value={form.name}
                      onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: false })) }}
                      style={inp(errors.name)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, marginBottom: 6, textAlign: isAR ? 'right' : 'left' }}>
                      {isAR ? 'اسم طفلك' : "Baby's Name"}
                    </label>
                    <input
                      placeholder={isAR ? 'سارة' : 'Baby name'}
                      value={form.baby}
                      onChange={e => setForm(p => ({ ...p, baby: e.target.value }))}
                      style={inp()}
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, marginBottom: 6, textAlign: isAR ? 'right' : 'left' }}>
                    {isAR ? 'رقم الواتساب' : 'WhatsApp'}
                  </label>
                  <input
                    placeholder={isAR ? '05xxxxxxxx' : '05xxxxxxxx'}
                    value={form.wa}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setForm(p => ({ ...p, wa: digits }))
                      setErrors(p => ({ ...p, wa: false }))
                    }}
                    onFocus={focusGlow}
                    onBlur={blurGlow(errors.wa)}
                    style={{ ...inp(errors.wa), direction: 'ltr', textAlign: 'left' }}
                    type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10}
                  />
                  {errors.wa && form.wa && (
                    <p style={{ color: '#FCA5A5', fontSize: 11, marginTop: 6 }}>
                      {isAR ? 'يجب أن يبدأ الرقم بـ 0 ويتكون من 10 أرقام' : 'Number must start with 0 and be 10 digits'}
                    </p>
                  )}
                </div>

                {/* Baby's Birthday */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, marginBottom: 6, textAlign: isAR ? 'right' : 'left' }}>
                    {isAR ? 'تاريخ ميلاد طفلك' : "Baby's Birthday"}
                  </label>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                    onFocus={focusGlow}
                    onBlur={blurGlow()}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ ...inp(), direction: 'ltr', textAlign: 'left', colorScheme: 'dark' }}
                  />
                </div>

                {/* Recommended stage banner — shown even if the dropdown itself is hidden */}
                {recommended && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: `${btnColor}26`, border: `1.5px solid ${btnColor}55`,
                    borderRadius: 14, padding: '10px 14px', marginBottom: 10,
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    <span style={{ fontSize: 17 }}>✨</span>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
                      {isAR
                        ? <>المرحلة الموصى بها هي: <span style={{ color: btnColor }}>{recommended.name}</span></>
                        : <>Our recommended stage is: <span style={{ color: btnColor }}>{recommended.name}</span></>}
                    </span>
                  </div>
                )}

                {/* Baby's Stage */}
                {g('waitlist_show_stage') !== 'false' && (
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, marginBottom: 6, textAlign: isAR ? 'right' : 'left' }}>
                    {isAR ? 'مرحلة طفلك' : "Baby's Stage"}
                  </label>

                  <select
                    value={form.stage}
                    onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                    onFocus={focusGlow}
                    onBlur={blurGlow()}
                    style={selectStyle}
                  >
                    <option value="" style={{ background: '#1C0A04', color: 'white' }}>
                      {isAR ? 'اختر المرحلة' : 'Select stage'}
                    </option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id} style={{ background: '#1C0A04', color: 'white' }}>
                        {s.name} — {s.age_range}
                      </option>
                    ))}
                  </select>
                </div>
                )}

                {/* Submit */}
                <button
                  className="ninoz-submit-btn"
                  onClick={submit}
                  disabled={submitting}
                  style={{
                    marginTop: 4, padding: '17px', background: btnColor, color: 'white',
                    border: 'none', borderRadius: 16, fontSize: 17, fontWeight: 900,
                    cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                    fontFamily: ff, transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1), opacity 0.15s, box-shadow 0.18s',
                    boxShadow: `0 6px 24px ${btnColor}77`,
                  }}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'scale(1.035) translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${btnColor}99` } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 24px ${btnColor}77` }}
                >
                  {submitting ? '...' : g(isAR ? 'waitlist_btn_ar' : 'waitlist_btn_en')}
                </button>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>
                  {g(isAR ? 'waitlist_footer_ar' : 'waitlist_footer_en')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
