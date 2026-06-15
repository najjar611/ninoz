'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'design' | 'images' | 'waitlist' | 'ticker'
type TickerItem = { id: string; text: string; highlight: string; position: number; is_active: boolean }

const PRESET_FONTS = [
  'Nunito', 'Poppins', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
  'Sora', 'Raleway', 'Quicksand', 'Inter', 'Montserrat',
]

export default function SettingsAdmin() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('design')
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState('')
  const [saving, setSaving] = useState(false)

  // Design
  const [font, setFont] = useState('Nunito')
  const [customFont, setCustomFont] = useState('')
  const [colorPrimary, setColorPrimary] = useState('#C84B0F')
  const [colorBlue, setColorBlue] = useState('#0A429B')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoHeight, setLogoHeight] = useState(42)
  const logoRef = useRef<HTMLInputElement>(null)

  // Images
  const [heroUrl, setHeroUrl] = useState('')
  const [whyUrl, setWhyUrl] = useState('')
  const heroRef = useRef<HTMLInputElement>(null)
  const whyRef = useRef<HTMLInputElement>(null)

  // Waitlist
  const [waitlistBgUrl, setWaitlistBgUrl] = useState('')
  const [waitlistBtnColor, setWaitlistBtnColor] = useState('#C84B0F')
  const [tickerAnimated, setTickerAnimated] = useState(true)
  const [comingSoon, setComingSoon] = useState(false)
  const waitlistBgRef = useRef<HTMLInputElement>(null)

  // Ticker
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const [content, logo, ticker] = await Promise.all([
      supabase.from('site_content').select('key,value').in('key', [
        'site_font', 'ticker_animated', 'hero_image_url', 'why_image_url',
        'waitlist_bg_url', 'waitlist_btn_color', 'theme_color_primary', 'theme_color_deep_blue',
        'logo_height', 'site_coming_soon',
      ]),
      supabase.from('logo').select('*').limit(1).single(),
      supabase.from('ticker_items').select('*').order('position'),
    ])
    const m: Record<string, string> = {}
    for (const i of content.data || []) m[i.key] = i.value
    const f = m['site_font'] || 'Nunito'
    setFont(PRESET_FONTS.includes(f) ? f : 'custom')
    setCustomFont(PRESET_FONTS.includes(f) ? '' : f)
    setColorPrimary(m['theme_color_primary'] || '#C84B0F')
    setColorBlue(m['theme_color_deep_blue'] || '#0A429B')
    setHeroUrl(m['hero_image_url'] || '')
    setWhyUrl(m['why_image_url'] || '')
    setWaitlistBgUrl(m['waitlist_bg_url'] || '')
    setWaitlistBtnColor(m['waitlist_btn_color'] || '#C84B0F')
    setTickerAnimated(m['ticker_animated'] !== 'false')
    setComingSoon(m['site_coming_soon'] === 'true')
    setLogoUrl(logo.data?.url || '')
    setLogoHeight(parseInt(m['logo_height'] || '42'))
    setTickerItems(ticker.data || [])
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  async function upsert(key: string, value: string) {
    await supabase.from('site_content').upsert({ key, value, label: key, section: 'settings' }, { onConflict: 'key' })
  }

  async function saveDesign() {
    setSaving(true)
    const finalFont = font === 'custom' ? customFont.trim() : font
    await Promise.all([
      upsert('site_font', finalFont),
      upsert('theme_color_primary', colorPrimary),
      upsert('theme_color_deep_blue', colorBlue),
      upsert('logo_height', String(logoHeight)),
    ])
    setSaving(false)
    flash('Saved! Refresh the site to see the new font and colors.')
  }

  async function saveWaitlist() {
    setSaving(true)
    await Promise.all([
      upsert('waitlist_btn_color', waitlistBtnColor),
      upsert('ticker_animated', tickerAnimated ? 'true' : 'false'),
    ])
    setSaving(false)
    flash('Saved!')
  }

  async function uploadImg(bucket: string, ref: React.RefObject<HTMLInputElement | null>, setter: (u: string) => void, key?: string) {
    const file = ref.current?.files?.[0]
    if (!file) return
    setUploading(bucket)
    const path = `${bucket}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { flash('Upload failed: ' + error.message); setUploading(''); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    setter(data.publicUrl)
    if (key) await upsert(key, data.publicUrl)
    setUploading('')
    flash('Uploaded!')
    if (ref.current) ref.current.value = ''
  }

  async function uploadLogo(ref: React.RefObject<HTMLInputElement | null>) {
    const file = ref.current?.files?.[0]
    if (!file) return
    setUploading('logo')
    const path = `logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('logo').upload(path, file, { upsert: true })
    if (error) { flash('Upload failed: ' + error.message); setUploading(''); return }
    const { data } = supabase.storage.from('logo').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    const ex = await supabase.from('logo').select('id').limit(1).single()
    if (ex.data) await supabase.from('logo').update({ url: data.publicUrl }).eq('id', ex.data.id)
    else await supabase.from('logo').insert({ url: data.publicUrl, alt_text: 'Ninoz' })
    setUploading('')
    flash('Logo uploaded!')
    if (ref.current) ref.current.value = ''
  }

  // Ticker
  function updateTicker(id: string, key: keyof TickerItem, val: any) {
    setTickerItems(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))
  }
  async function saveTicker(item: TickerItem) {
    await supabase.from('ticker_items').update({ text: item.text, highlight: item.highlight, is_active: item.is_active }).eq('id', item.id)
    flash('Saved!')
  }
  async function addTicker() {
    const { data } = await supabase.from('ticker_items').insert({ text: 'New item', highlight: '', position: tickerItems.length + 1 }).select().single()
    if (data) setTickerItems(prev => [...prev, data])
  }
  async function deleteTicker(id: string) {
    await supabase.from('ticker_items').delete().eq('id', id)
    setTickerItems(prev => prev.filter(t => t.id !== id))
  }

  const card: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '22px 24px', border: '1px solid #EDEBE8', marginBottom: 16 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 9, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }
  const activeTab: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: '#C84B0F', color: 'white' }
  const inactiveTab: React.CSSProperties = { ...activeTab, background: 'transparent', color: '#7A7068' }
  const uploadBtn: React.CSSProperties = { padding: '9px 18px', background: '#FAF5EE', border: '1.5px solid #EDE8E0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#2C1A0E' }

  return (
    <div style={{ maxWidth: 660, fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>Settings</h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '4px 0 0' }}>Logo, fonts, colors, images, and more.</p>
        </div>
        {msg && <span style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</span>}
      </div>

      {/* Coming Soon toggle */}
      <div style={{ background: comingSoon ? '#FFF4ED' : 'white', border: `1.5px solid ${comingSoon ? '#C84B0F' : '#EDEBE8'}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1C1C1A' }}>🚧 Coming Soon Mode</div>
          <div style={{ fontSize: 12, color: '#7A7068', marginTop: 3 }}>Hides the full homepage and shows only your logo. The waitlist page stays accessible.</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: comingSoon ? '#C84B0F' : '#A08070' }}>{comingSoon ? 'ON' : 'OFF'}</span>
          <input type="checkbox" checked={comingSoon} style={{ accentColor: '#C84B0F', width: 18, height: 18, cursor: 'pointer' }}
            onChange={async e => {
              setComingSoon(e.target.checked)
              await upsert('site_coming_soon', e.target.checked ? 'true' : 'false')
              flash(e.target.checked ? 'Coming Soon mode ON — homepage is now hidden' : 'Coming Soon mode OFF — homepage is live again')
            }}
          />
        </label>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 3, background: '#F2EDE8', borderRadius: 11, padding: 3, width: 'fit-content', marginBottom: 24 }}>
        {(['design', 'images', 'waitlist', 'ticker'] as Tab[]).map(t => (
          <button key={t} style={tab === t ? activeTab : inactiveTab} onClick={() => setTab(t)}>
            {{ design: '🎨 Design', images: '🖼️ Images', waitlist: '⏳ Waitlist', ticker: '📢 Ticker' }[t]}
          </button>
        ))}
      </div>

      {/* ── DESIGN TAB ── */}
      {tab === 'design' && (
        <>
          {/* Logo */}
          <div style={card}>
            <label style={lbl}>Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={{ height: 44, maxWidth: 140, objectFit: 'contain', background: '#1C0A04', borderRadius: 8, padding: '6px 10px' }} />
                : <div style={{ height: 44, width: 110, background: '#1C0A04', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#C84B0F', fontFamily: 'Nunito, sans-serif' }}>Ninoz</div>}
              <button onClick={() => logoRef.current?.click()} disabled={uploading === 'logo'} style={uploadBtn}>
                {uploading === 'logo' ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
              </button>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => uploadLogo(logoRef)} />
            </div>
            <p style={{ fontSize: 12, color: '#A08070', margin: 0 }}>PNG with transparent background recommended.</p>

            <div style={{ marginTop: 16 }}>
              <label style={{ ...lbl, marginBottom: 6 }}>Logo Size on Main Site — {logoHeight}px</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#A08070' }}>Small</span>
                <input
                  type="range" min="24" max="80" step="2"
                  value={logoHeight}
                  onChange={e => setLogoHeight(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: '#C84B0F', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 11, color: '#A08070' }}>Large</span>
              </div>
            </div>
          </div>

          {/* Font */}
          <div style={card}>
            <label style={lbl}>Website Font</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
              {PRESET_FONTS.map(f => (
                <button key={f} onClick={() => setFont(f)} style={{
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  border: font === f ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
                  background: font === f ? '#FDF5F0' : 'white',
                  fontSize: 14, fontFamily: `'${f}', sans-serif`,
                  color: font === f ? '#C84B0F' : '#2C1A0E',
                  fontWeight: font === f ? 700 : 400,
                }}>
                  {f}
                </button>
              ))}
              <button onClick={() => setFont('custom')} style={{
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                border: font === 'custom' ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
                background: font === 'custom' ? '#FDF5F0' : 'white',
                fontSize: 13, color: font === 'custom' ? '#C84B0F' : '#7A7068', fontWeight: 600,
              }}>
                Custom…
              </button>
            </div>

            {font === 'custom' && (
              <div style={{ marginBottom: 12 }}>
                <input
                  value={customFont}
                  onChange={e => setCustomFont(e.target.value)}
                  placeholder="e.g. Tajawal or MyBrandFont"
                  style={inp}
                />
                <div style={{ marginTop: 10, background: '#FFF8F0', border: '1px solid #EDE8E0', borderRadius: 9, padding: '12px 14px', fontSize: 12, color: '#5A5048', lineHeight: 1.7 }}>
                  <strong>How to add a custom (non-Google) font:</strong><br />
                  1. Drop your font file (e.g. <code>MyFont.woff2</code>) into <code>/public/fonts/</code><br />
                  2. Open <code>src/app/globals.css</code> and add:<br />
                  <code style={{ display: 'block', background: '#F2EDE8', borderRadius: 6, padding: '6px 10px', marginTop: 4 }}>
                    {'@font-face { font-family: \'MyFont\'; src: url(\'/fonts/MyFont.woff2\'); }'}
                  </code>
                  3. Type the exact font name above and save.
                </div>
              </div>
            )}
          </div>

          {/* Colors */}
          <div style={card}>
            <label style={lbl}>Brand Colors</label>
            <p style={{ fontSize: 12, color: '#A08070', margin: '0 0 16px' }}>These control buttons, accents, and headlines across the whole site.</p>
            {[
              { label: 'Primary (buttons, highlights)', val: colorPrimary, set: setColorPrimary },
              { label: 'Secondary (nav, footer, headings)', val: colorBlue, set: setColorBlue },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <input type="color" value={c.val} onChange={e => c.set(e.target.value)} style={{ width: 44, height: 44, border: 'none', borderRadius: 9, cursor: 'pointer', padding: 3, background: 'none', flexShrink: 0 }} />
                <input value={c.val} onChange={e => c.set(e.target.value)} style={{ ...inp, width: 110 }} maxLength={7} />
                <div style={{ width: 44, height: 44, borderRadius: 9, background: c.val, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#5A5048', fontWeight: 600 }}>{c.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={saveDesign} disabled={saving} style={{ padding: '11px 28px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save Design Settings'}
            </button>
          </div>
        </>
      )}

      {/* ── IMAGES TAB ── */}
      {tab === 'images' && (
        <>
          {[
            { label: 'Hero Section Photo', hint: 'Right side of the homepage hero. Best aspect ratio: 3:4 portrait.', url: heroUrl, set: setHeroUrl, bucket: 'hero', ref: heroRef, key: 'hero_image_url' },
            { label: 'Ingredients Section Photo', hint: 'Right side of the ingredients section. Best aspect ratio: 3:4 portrait.', url: whyUrl, set: setWhyUrl, bucket: 'why-section', ref: whyRef, key: 'why_image_url' },
          ].map(img => (
            <div key={img.key} style={card}>
              <label style={lbl}>{img.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                {img.url
                  ? <img src={img.url} alt={img.label} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  : <div style={{ width: 80, height: 80, background: '#F2EDE8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🖼️</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => img.ref.current?.click()} disabled={uploading === img.bucket} style={uploadBtn}>
                    {uploading === img.bucket ? 'Uploading…' : img.url ? 'Replace Photo' : 'Upload Photo'}
                  </button>
                  <input ref={img.ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => uploadImg(img.bucket, img.ref, img.set, img.key)} />
                  {img.url && (
                    <button onClick={() => { img.set(''); upsert(img.key, '') }} style={{ ...uploadBtn, background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FCA5A5', fontSize: 12 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#A08070', margin: 0 }}>{img.hint}</p>
            </div>
          ))}
        </>
      )}

      {/* ── WAITLIST TAB ── */}
      {tab === 'waitlist' && (
        <>
          <div style={{ ...card, background: '#FDF8F5', border: '1px solid #EDE8E0' }}>
            <p style={{ fontSize: 13, color: '#5A5048', margin: 0, lineHeight: 1.6 }}>
              To change the <strong>logo, text, badges, and form fields</strong> on the waitlist page, go to{' '}
              <a href="/admin/waitlist" style={{ color: '#C84B0F', fontWeight: 700, textDecoration: 'none' }}>Waitlist → Page Settings ↗</a>
            </p>
          </div>

          <div style={card}>
            <label style={lbl}>Waitlist Background Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              {waitlistBgUrl
                ? <img src={waitlistBgUrl} alt="Waitlist BG" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10 }} />
                : <div style={{ width: 80, height: 80, background: '#F2EDE8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌅</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => waitlistBgRef.current?.click()} disabled={uploading === 'hero'} style={uploadBtn}>
                  {uploading === 'hero' ? 'Uploading…' : waitlistBgUrl ? 'Replace' : 'Upload'}
                </button>
                <input ref={waitlistBgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => uploadImg('hero', waitlistBgRef, setWaitlistBgUrl, 'waitlist_bg_url')} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#A08070', margin: 0 }}>Falls back to the Hero photo if not set.</p>
          </div>

          <div style={card}>
            <label style={lbl}>Button & Accent Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={waitlistBtnColor} onChange={e => setWaitlistBtnColor(e.target.value)} style={{ width: 44, height: 44, border: 'none', borderRadius: 9, cursor: 'pointer', padding: 3, background: 'none' }} />
              <input value={waitlistBtnColor} onChange={e => setWaitlistBtnColor(e.target.value)} style={{ ...inp, width: 110 }} maxLength={7} />
              <div style={{ width: 44, height: 44, borderRadius: 9, background: waitlistBtnColor, border: '1px solid rgba(0,0,0,0.08)' }} />
              <a href="/foundingmams" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#C84B0F', fontWeight: 700, textDecoration: 'none', marginLeft: 4 }}>Preview →</a>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={saveWaitlist} disabled={saving} style={{ padding: '11px 28px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}

      {/* ── TICKER TAB ── */}
      {tab === 'ticker' && (
        <>
          <div style={card}>
            <label style={lbl}>Ticker Bar Style</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>
              <input type="checkbox" checked={tickerAnimated} onChange={async e => {
                setTickerAnimated(e.target.checked)
                await upsert('ticker_animated', e.target.checked ? 'true' : 'false')
                flash('Saved!')
              }} style={{ accentColor: '#C84B0F', width: 16, height: 16 }} />
              Animated (scrolling ticker)
            </label>
            <p style={{ fontSize: 12, color: '#A08070', margin: '8px 0 0' }}>Uncheck for a static list of items.</p>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <label style={lbl}>Ticker Items</label>
              <button onClick={addTicker} style={{ ...uploadBtn, fontSize: 12 }}>+ Add Item</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tickerItems.length === 0 && <p style={{ fontSize: 13, color: '#A08070', textAlign: 'center', padding: '16px 0' }}>No items yet.</p>}
              {tickerItems.map(item => (
                <div key={item.id} className="ticker-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input style={{ ...inp, width: 80, flexShrink: 0 }} placeholder="Bold" value={item.highlight} onChange={e => updateTicker(item.id, 'highlight', e.target.value)} title="Highlight word (e.g. 100%)" />
                  <input style={{ ...inp, flex: 1 }} placeholder="Fresh Ingredients" value={item.text} onChange={e => updateTicker(item.id, 'text', e.target.value)} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#2C1A0E', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={item.is_active} onChange={e => updateTicker(item.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                    On
                  </label>
                  <button onClick={() => saveTicker(item)} style={{ padding: '7px 14px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Save</button>
                  <button onClick={() => deleteTicker(item.id)} style={{ padding: '7px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 480px) {
          .ticker-row input { flex: 1 1 100% !important; width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
