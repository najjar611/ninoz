'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TermsAdmin() {
  const supabase = createClient()
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('site_content').select('key, value').in('key', ['terms_content', 'terms_content_ar']).then(({ data }) => {
      const m: Record<string, string> = {}
      ;((data as any[]) || []).forEach(r => { m[r.key] = r.value })
      setEn(m.terms_content || '')
      setAr(m.terms_content_ar || '')
      setLoading(false)
    })
  }, [])

  async function save() {
    setMsg('Saving…')
    await supabase.from('site_content').upsert({ key: 'terms_content', value: en, label: 'Terms', section: 'terms' }, { onConflict: 'key' })
    await supabase.from('site_content').upsert({ key: 'terms_content_ar', value: ar, label: 'Terms (Arabic)', section: 'terms' }, { onConflict: 'key' })
    setMsg('Saved!'); setTimeout(() => setMsg(''), 1800)
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #EDEBE8', padding: '18px 20px', marginBottom: 16 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const ta: React.CSSProperties = { width: '100%', minHeight: 220, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.7, resize: 'vertical' }
  const btn: React.CSSProperties = { padding: '10px 18px', background: '#C84B0F', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

  if (loading) return <div style={{ padding: 40, color: '#B0A098', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 820 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1A', margin: '0 0 4px' }}>Terms &amp; Conditions</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>Shown read-only in the customer&apos;s account under &ldquo;Terms&rdquo;. Arabic is shown to Arabic users, English to English users.</p>
      <div style={card}>
        <label style={lbl}>Arabic (العربية)</label>
        <textarea style={{ ...ta, direction: 'rtl', textAlign: 'right' }} value={ar} onChange={e => setAr(e.target.value)} placeholder="اكتب الشروط والأحكام هنا…" />
      </div>
      <div style={card}>
        <label style={lbl}>English</label>
        <textarea style={ta} value={en} onChange={e => setEn(e.target.value)} placeholder="Write the terms & conditions here…" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={btn} onClick={save}>Save Terms</button>
        {msg && <span style={{ color: '#2D6A4F', fontWeight: 700, fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  )
}
