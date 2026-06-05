'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lang = 'en' | 'ar'

const T = {
  en: {
    tagline1: 'You Care.',
    tagline2: 'We Prepare.',
    sub: 'Delicious, healthy meals for your little one — delivered to your door.',
    badges: [
      { icon: '🥗', label: 'Fresh Ingredients' },
      { icon: '🚫', label: 'No Preservatives' },
      { icon: '🍳', label: 'Cooked Daily' },
      { icon: '👶', label: 'Pediatrician Approved' },
    ],
    formTitle: 'Join the Waitlist',
    formSub: 'Be first to know when we launch in Riyadh',
    name: 'Your Name', name_ph: 'Mom / Dad name',
    baby: "Baby's Name", baby_ph: 'Baby name',
    wa: 'WhatsApp', wa_ph: '966+ 5x xxx xxxx',
    age: "Baby's Age", age_ph: 'Select age',
    ages: ['0–3 months', '3–6 months', '6–9 months', '9–12 months', '12–18 months', '18–24 months', '2–3 years'],
    btn: 'Reserve My Spot →',
    privacy: 'Your data is safe and will never be shared.',
    success_title: "You're on the list! 🎉",
    success_sub: "We'll reach out on WhatsApp as soon as we launch in Riyadh.",
    footer: '© 2026 Ninoz · Riyadh, KSA',
    toggle: 'عربي',
  },
  ar: {
    tagline1: 'أنت تهتم.',
    tagline2: 'نحن نُعِد.',
    sub: 'وجبات صحية ولذيذة لطفلك — توصيل إلى باب منزلك.',
    badges: [
      { icon: '🥗', label: 'مكونات طازجة' },
      { icon: '🚫', label: 'بدون مواد حافظة' },
      { icon: '🍳', label: 'طُهي يومياً' },
      { icon: '👶', label: 'موصى به طبياً' },
    ],
    formTitle: 'انضم لقائمة الانتظار',
    formSub: 'كن أول من يعلم عند إطلاقنا في الرياض',
    name: 'اسمك', name_ph: 'اسم الأم / الأب',
    baby: 'اسم الطفل', baby_ph: 'اسم الطفل',
    wa: 'واتساب', wa_ph: '966+ 5x xxxx xxx',
    age: 'عمر الطفل', age_ph: 'اختر العمر',
    ages: ['0–3 أشهر', '3–6 أشهر', '6–9 أشهر', '9–12 شهر', '12–18 شهر', '18–24 شهر', '2–3 سنوات'],
    btn: '← احجز مكانك',
    privacy: 'بياناتك آمنة ولن تُشارك مع أي جهة.',
    success_title: 'أنت في القائمة! 🎉',
    success_sub: 'سنتواصل معك عبر واتساب فور الإطلاق في الرياض.',
    footer: '© 2026 Ninoz · الرياض، المملكة العربية السعودية',
    toggle: 'English',
  },
}

export default function WaitlistPage() {
  const supabase = createClient()
  const [lang, setLang] = useState<Lang>('en')
  const [bgUrl, setBgUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [btnColor, setBtnColor] = useState('#C84B0F')
  const [form, setForm] = useState({ name: '', baby: '', wa: '', age: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const t = T[lang]
  const isRTL = lang === 'ar'

  useEffect(() => {
    async function loadSettings() {
      const [{ data: content }, { data: logo }] = await Promise.all([
        supabase.from('site_content').select('key,value').in('key', ['waitlist_bg_url', 'waitlist_btn_color', 'hero_image_url']),
        supabase.from('logo').select('url').limit(1).single(),
      ])
      const m: Record<string, string> = {}
      for (const r of content || []) m[r.key] = r.value
      setBgUrl(m['waitlist_bg_url'] || m['hero_image_url'] || '')
      setBtnColor(m['waitlist_btn_color'] || '#C84B0F')
      setLogoUrl(logo?.url || '')
    }
    loadSettings()
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
    if (error) {
      console.error('Waitlist submit error:', error)
      alert('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
  }

  const fieldFont = isRTL ? "'Tajawal', 'Nunito', sans-serif" : "'Nunito', sans-serif"

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '13px 16px', borderRadius: '14px',
    border: hasError ? '2px solid #ff5555' : '1.5px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', backdropFilter: 'blur(4px)',
    fontFamily: fieldFont,
    textAlign: isRTL ? 'right' : 'left',
    direction: isRTL ? 'rtl' : 'ltr',
  })

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: isRTL ? "'Tajawal', 'Nunito', sans-serif" : "'Nunito', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {bgUrl
          ? <img src={bgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #1C0A04 0%, #3D1A08 50%, #7A3010 100%)' }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 7, 3, 0.65)' }} />
      </div>

      {/* Page */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
          {logoUrl
            ? <img src={logoUrl} alt="Ninoz" style={{ height: 38, objectFit: 'contain' }} />
            : <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 26, color: btnColor, letterSpacing: '-0.02em' }}>Ninoz</span>
          }
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            style={{ background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: 24, padding: '7px 18px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)', fontFamily: 'inherit' }}
          >
            {t.toggle}
          </button>
        </div>

        {/* Hero text */}
        <div style={{ textAlign: 'center', padding: '20px 24px 12px' }}>
          <h1 style={{ margin: 0, lineHeight: 1.1 }}>
            <span style={{ display: 'block', fontSize: 'clamp(34px, 9vw, 54px)', fontWeight: 900, color: 'white' }}>{t.tagline1}</span>
            <span style={{ display: 'block', fontSize: 'clamp(34px, 9vw, 54px)', fontWeight: 900, color: btnColor }}>{t.tagline2}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, marginTop: 12, maxWidth: 300, margin: '12px auto 0', lineHeight: 1.6 }}>{t.sub}</p>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '18px 20px', flexWrap: 'wrap' }}>
          {t.badges.map(b => (
            <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 68 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.13)', border: '1.5px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, backdropFilter: 'blur(8px)' }}>
                {b.icon}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.3, maxWidth: 72 }}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 20px 28px' }}>
          <div style={{ width: '100%', maxWidth: 400, background: 'rgba(15,7,3,0.58)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: 28, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.11)' }}>

            {done ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🎉</div>
                <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 10px' }}>{t.success_title}</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{t.success_sub}</p>
              </div>
            ) : (
              <>
                <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 4px', textAlign: 'center' }}>{t.formTitle}</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 22px', textAlign: 'center', lineHeight: 1.5 }}>{t.formSub}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.name}</label>
                    <input
                      placeholder={t.name_ph}
                      value={form.name}
                      onChange={e => { setForm({ ...form, name: e.target.value }); setErrors(p => ({ ...p, name: false })) }}
                      style={inputStyle(errors.name)}
                    />
                  </div>

                  {/* Baby name */}
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.baby}</label>
                    <input
                      placeholder={t.baby_ph}
                      value={form.baby}
                      onChange={e => setForm({ ...form, baby: e.target.value })}
                      style={inputStyle()}
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.wa}</label>
                    <input
                      placeholder={t.wa_ph}
                      value={form.wa}
                      onChange={e => { setForm({ ...form, wa: e.target.value }); setErrors(p => ({ ...p, wa: false })) }}
                      style={{ ...inputStyle(errors.wa), direction: 'ltr', textAlign: 'left' }}
                      type="tel"
                      inputMode="tel"
                    />
                  </div>

                  {/* Baby age */}
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.age}</label>
                    <select
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                      style={{ ...inputStyle(), cursor: 'pointer' }}
                    >
                      <option value="" style={{ background: '#1C0A04', color: '#ccc' }}>{t.age_ph}</option>
                      {t.ages.map(o => <option key={o} value={o} style={{ background: '#1C0A04', color: 'white' }}>{o}</option>)}
                    </select>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={submit}
                    disabled={submitting}
                    style={{ marginTop: 6, padding: '15px', background: btnColor, color: 'white', border: 'none', borderRadius: '16px', fontSize: 16, fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit', letterSpacing: '0.01em', transition: 'opacity 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'scale(1.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    {submitting ? '...' : t.btn}
                  </button>

                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.38)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{t.privacy}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '14px 24px 22px' }}>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, margin: 0 }}>{t.footer}</p>
        </div>
      </div>
    </div>
  )
}
