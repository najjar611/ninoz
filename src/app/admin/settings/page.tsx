'use client'

// src/app/admin/settings/page.tsx — v6.1
// Font picker (Google Fonts), logo upload, hero image upload, ticker toggle
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONTS = [
  'Nunito', 'Poppins', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
  'Sora', 'Raleway', 'Quicksand', 'Josefin Sans', 'Karla',
  'Mulish', 'Inter', 'Lato', 'Montserrat', 'Work Sans',
]

export default function SettingsAdmin() {
  const supabase = createClient()
  const [font, setFont] = useState('Nunito')
  const [tickerAnimated, setTickerAnimated] = useState(true)
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [whyImageUrl, setWhyImageUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [msg, setMsg] = useState('')

  const heroRef = useRef<HTMLInputElement>(null)
  const whyRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [content, logo] = await Promise.all([
      supabase.from('site_content').select('key, value').in('key', ['site_font', 'ticker_animated', 'hero_image_url', 'why_image_url']),
      supabase.from('logo').select('*').limit(1).single(),
    ])
    const map: Record<string, string> = {}
    for (const item of content.data || []) map[item.key] = item.value
    setFont(map['site_font'] || 'Nunito')
    setTickerAnimated(map['ticker_animated'] !== 'false')
    setHeroImageUrl(map['hero_image_url'] || '')
    setWhyImageUrl(map['why_image_url'] || '')
    setLogoUrl(logo.data?.url || '')
  }

  async function saveContentKey(key: string, value: string) {
    await supabase.from('site_content').upsert({ key, value, label: key, section: 'settings' }, { onConflict: 'key' })
  }

  async function saveAll() {
    setSaving(true)
    await Promise.all([
      saveContentKey('site_font', font),
      saveContentKey('ticker_animated', tickerAnimated ? 'true' : 'false'),
      saveContentKey('hero_image_url', heroImageUrl),
      saveContentKey('why_image_url', whyImageUrl),
    ])
    setSaving(false)
    flash('Saved! Refresh the homepage to see changes.')
  }

  async function uploadImage(bucket: string, file: File, setter: (url: string) => void, contentKey?: string) {
    setUploading(bucket)
    const ext = file.name.split('.').pop()
    const path = `${bucket}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { flash('Upload failed: ' + error.message); setUploading(''); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    setter(data.publicUrl)
    if (contentKey) await saveContentKey(contentKey, data.publicUrl)
    setUploading('')
    flash('Uploaded!')
  }

  async function uploadLogo(file: File) {
    setUploading('logo')
    const ext = file.name.split('.').pop()
    const path = `logo-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('logo').upload(path, file, { upsert: true })
    if (error) { flash('Upload failed: ' + error.message); setUploading(''); return }
    const { data } = supabase.storage.from('logo').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    // Update logo table
    const existing = await supabase.from('logo').select('id').limit(1).single()
    if (existing.data) {
      await supabase.from('logo').update({ url: data.publicUrl }).eq('id', existing.data.id)
    } else {
      await supabase.from('logo').insert({ url: data.publicUrl, alt_text: 'Ninoz' })
    }
    setUploading('')
    flash('Logo uploaded!')
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const card = { background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(0,0,0,0.05)', marginBottom: 16 }
  const label = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Global site settings — font, logo, images, ticker.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={saveAll} disabled={saving}
            style={{ padding: '10px 24px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Logo */}
      <div style={card}>
        <label style={label}>Logo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: 48, objectFit: 'contain', borderRadius: 8, background: '#FAF5EE', padding: 8 }} />
          ) : (
            <div style={{ height: 48, width: 120, background: '#FAF5EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif', fontSize: 20, fontWeight: 900, color: '#C84B0F' }}>Ninoz</div>
          )}
          <button onClick={() => logoRef.current?.click()} disabled={uploading === 'logo'}
            style={{ padding: '9px 18px', background: '#FAF5EE', border: '1.5px solid #EDE8E0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {uploading === 'logo' ? 'Uploading...' : '📷 Upload Logo'}
          </button>
          <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
        </div>
        <p style={{ fontSize: 12, color: '#A08070' }}>Recommended: PNG with transparent background, height ~60px. Clicking the logo takes users to the homepage.</p>
      </div>

      {/* Font */}
      <div style={card}>
        <label style={label}>Website Font</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {FONTS.map(f => (
            <button key={f}
              onClick={() => setFont(f)}
              style={{
                padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                border: font === f ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
                background: font === f ? '#FDF5F0' : 'white',
                fontSize: 14, fontFamily: `'${f}', sans-serif`,
                color: font === f ? '#C84B0F' : '#2C1A0E',
                fontWeight: font === f ? 700 : 400,
                transition: 'all 0.15s',
              }}>
              {f}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#A08070' }}>Selected: <strong style={{ fontFamily: `'${font}', sans-serif`, color: '#C84B0F' }}>{font}</strong> — applies site-wide after saving.</p>
      </div>

      {/* Hero Image */}
      <div style={card}>
        <label style={label}>Hero Section Image</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          {heroImageUrl && (
            <img src={heroImageUrl} alt="Hero" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} />
          )}
          <button onClick={() => heroRef.current?.click()} disabled={uploading === 'hero'}
            style={{ padding: '9px 18px', background: '#FAF5EE', border: '1.5px solid #EDE8E0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {uploading === 'hero' ? 'Uploading...' : '📷 Upload Hero Photo'}
          </button>
          <input ref={heroRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage('hero', f, setHeroImageUrl, 'hero_image_url') }} />
        </div>
        <p style={{ fontSize: 12, color: '#A08070' }}>The main photo on the right side of the hero section. Best ratio: 3:4 portrait.</p>
      </div>

      {/* Why Section Image */}
      <div style={card}>
        <label style={label}>Ingredients Section Image (Right Side)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          {whyImageUrl && (
            <img src={whyImageUrl} alt="Why" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} />
          )}
          <button onClick={() => whyRef.current?.click()} disabled={uploading === 'why-section'}
            style={{ padding: '9px 18px', background: '#FAF5EE', border: '1.5px solid #EDE8E0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {uploading === 'why-section' ? 'Uploading...' : '📷 Upload Photo'}
          </button>
          <input ref={whyRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage('why-section', f, setWhyImageUrl, 'why_image_url') }} />
        </div>
        <p style={{ fontSize: 12, color: '#A08070' }}>The baby photo on the right side of the ingredients section. Best ratio: 3:4 portrait.</p>
      </div>

      {/* Ticker */}
      <div style={card}>
        <label style={label}>Ticker Bar</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>
            <input type="checkbox" checked={tickerAnimated} onChange={e => setTickerAnimated(e.target.checked)}
              style={{ accentColor: '#C84B0F', width: 16, height: 16 }} />
            Animated (scrolling)
          </label>
          <span style={{ fontSize: 13, color: '#A08070' }}>— uncheck for static ticker</span>
        </div>
      </div>
    </div>
  )
}
