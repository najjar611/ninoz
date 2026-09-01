'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAccountLang, setAccountLang } from '@/lib/accountLang'

// Public privacy policy page (used as the Play Store / App Store privacy URL).
// Content is fully admin-editable via Admin → Website → Privacy. Arabic shows in
// Arabic, English in English, with a language toggle.
export default function PrivacyPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('ar')
  const isAR = lang === 'ar'
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { setLang(getAccountLang()) }, [])
  useEffect(() => {
    const sb = createClient()
    sb.from('site_content').select('key, value').in('key', ['privacy_content', 'privacy_content_ar', 'logo_url']).then(({ data }) => {
      const m: Record<string, string> = {}
      ;((data as any[]) || []).forEach(r => { m[r.key] = r.value })
      setEn(m.privacy_content || ''); setAr(m.privacy_content_ar || ''); setLogo(m.logo_url || null)
      setLoading(false)
    })
  }, [])
  function toggle() { setLang(l => { const nl = l === 'ar' ? 'en' : 'ar'; setAccountLang(nl); return nl }) }

  const body = (isAR ? ar : en).trim()
  const fallback = isAR ? 'سياسة الخصوصية غير متوفرة بعد.' : 'Privacy policy is not available yet.'

  return (
    <div dir={isAR ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'radial-gradient(120% 90% at 50% -10%, #122A22, #0C1A15)', fontFamily: "'Baloo Bhaijaan 2','Tajawal',-apple-system,system-ui,sans-serif", color: '#EAF3EE', padding: '0 0 60px' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" />

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', maxWidth: 780, margin: '0 auto', direction: 'ltr' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {logo ? <img src={logo} alt="Ninoz" style={{ height: 54, objectFit: 'contain' }} /> : <span style={{ fontSize: 26, fontWeight: 800, color: '#FF7A33' }}>Ninoz</span>}
        </a>
        <button onClick={toggle} style={{ border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#EAF3EE', borderRadius: 999, padding: '7px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          {isAR ? 'English' : 'عربي'}
        </button>
      </header>

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '10px 22px' }}>
        <h1 style={{ fontSize: 'clamp(1.7rem,5vw,2.3rem)', fontWeight: 800, margin: '10px 0 6px' }}>{isAR ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
        <div style={{ height: 3, width: 54, background: 'linear-gradient(90deg,#FF7A33,#F5C77E)', borderRadius: 3, marginBottom: 22 }} />
        {loading ? (
          <p style={{ color: '#9DB4A8' }}>{isAR ? 'جارٍ التحميل…' : 'Loading…'}</p>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, fontSize: '1rem', color: '#D7E5DC' }}>{body || fallback}</div>
        )}
      </main>
    </div>
  )
}
