'use client'

// src/app/admin/settings/page.tsx — v8
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONTS = ['Nunito','Poppins','DM Sans','Plus Jakarta Sans','Outfit','Sora','Raleway','Quicksand','Josefin Sans','Karla','Mulish','Inter','Lato','Montserrat','Work Sans']

type TickerItem = { id: string; text: string; highlight: string; position: number; is_active: boolean }

export default function SettingsAdmin() {
  const supabase = createClient()
  const [font, setFont] = useState('Nunito')
  const [tickerAnimated, setTickerAnimated] = useState(false)
  const [heroUrl, setHeroUrl] = useState('')
  const [whyUrl, setWhyUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [msg, setMsg] = useState('')

  const heroRef = useRef<HTMLInputElement>(null)
  const whyRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [content, logo, ticker] = await Promise.all([
      supabase.from('site_content').select('key,value').in('key',['site_font','ticker_animated','hero_image_url','why_image_url']),
      supabase.from('logo').select('*').limit(1).single(),
      supabase.from('ticker_items').select('*').order('position'),
    ])
    const m: Record<string,string> = {}
    for (const i of content.data || []) m[i.key] = i.value
    setFont(m['site_font'] || 'Nunito')
    setTickerAnimated(m['ticker_animated'] === 'true')
    setHeroUrl(m['hero_image_url'] || '')
    setWhyUrl(m['why_image_url'] || '')
    setLogoUrl(logo.data?.url || '')
    setTickerItems(ticker.data || [])
  }

  async function saveKey(key: string, value: string) {
    await supabase.from('site_content').upsert({ key, value, label: key, section: 'settings' }, { onConflict: 'key' })
  }

  async function saveAll() {
    setSaving(true)
    await Promise.all([
      saveKey('site_font', font),
      saveKey('ticker_animated', tickerAnimated ? 'true' : 'false'),
      saveKey('hero_image_url', heroUrl),
      saveKey('why_image_url', whyUrl),
    ])
    setSaving(false)
    flash('Saved! Refresh the site to see changes.')
  }

  async function uploadImg(bucket: string, file: File, setter: (u: string) => void, key?: string) {
    setUploading(bucket)
    const path = `${bucket}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { flash('Upload failed: ' + error.message); setUploading(''); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    setter(data.publicUrl)
    if (key) await saveKey(key, data.publicUrl)
    setUploading('')
    flash('Uploaded!')
  }

  async function uploadLogo(file: File) {
    setUploading('logo')
    const path = `logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('logo').upload(path, file, { upsert: true })
    if (error) { flash('Upload failed'); setUploading(''); return }
    const { data } = supabase.storage.from('logo').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    const ex = await supabase.from('logo').select('id').limit(1).single()
    if (ex.data) await supabase.from('logo').update({ url: data.publicUrl }).eq('id', ex.data.id)
    else await supabase.from('logo').insert({ url: data.publicUrl, alt_text: 'Ninoz' })
    setUploading('')
    flash('Logo uploaded!')
  }

  // Ticker CRUD
  function updateTicker(id: string, key: keyof TickerItem, val: any) {
    setTickerItems(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))
  }
  async function saveTicker(item: TickerItem) {
    await supabase.from('ticker_items').update({ text: item.text, highlight: item.highlight, is_active: item.is_active }).eq('id', item.id)
    flash('Ticker item saved!')
  }
  async function addTicker() {
    const { data } = await supabase.from('ticker_items').insert({ text: 'New Item', highlight: '', position: tickerItems.length + 1 }).select().single()
    if (data) setTickerItems(prev => [...prev, data])
  }
  async function deleteTicker(id: string) {
    await supabase.from('ticker_items').delete().eq('id', id)
    setTickerItems(prev => prev.filter(t => t.id !== id))
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const card: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(0,0,0,0.05)', marginBottom: 16 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:'Nunito,sans-serif', fontSize:22, fontWeight:900, color:'#1C1C1A', marginBottom:4 }}>Settings</h1>
          <p style={{ fontSize:13, color:'#7A7068' }}>Font, logo, images, ticker bar.</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {msg && <div style={{ background:'#E8F5EE', color:'#2D6A4F', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600 }}>{msg}</div>}
          <button onClick={saveAll} disabled={saving} style={{ padding:'10px 24px', background:'#C84B0F', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving?0.6:1, fontFamily:'inherit' }}>
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Logo */}
      <div style={card}>
        <label style={lbl}>Logo</label>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:10 }}>
          {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height:44, objectFit:'contain', borderRadius:8, background:'#FAF5EE', padding:8 }} />
            : <div style={{ height:44, width:110, background:'#FAF5EE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito,sans-serif', fontSize:18, fontWeight:900, color:'#C84B0F' }}>Ninoz</div>}
          <button onClick={() => logoRef.current?.click()} disabled={uploading==='logo'} style={{ padding:'9px 18px', background:'#FAF5EE', border:'1.5px solid #EDE8E0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {uploading==='logo' ? 'Uploading...' : 'Upload Logo'}
          </button>
          <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f) uploadLogo(f) }} />
        </div>
        <p style={{ fontSize:12, color:'#A08070' }}>PNG with transparent background recommended. Clicking the logo takes users to the homepage.</p>
      </div>

      {/* Font */}
      <div style={card}>
        <label style={lbl}>Website Font</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
          {FONTS.map(f => (
            <button key={f} onClick={() => setFont(f)} style={{ padding:'10px 8px', borderRadius:10, cursor:'pointer', border:font===f?'2px solid #C84B0F':'1.5px solid #EDE8E0', background:font===f?'#FDF5F0':'white', fontSize:14, fontFamily:`'${f}',sans-serif`, color:font===f?'#C84B0F':'#2C1A0E', fontWeight:font===f?700:400, transition:'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
        <p style={{ fontSize:12, color:'#A08070' }}>Selected: <strong style={{ fontFamily:`'${font}',sans-serif`, color:'#C84B0F' }}>{font}</strong></p>
      </div>

      {/* Hero image */}
      <div style={card}>
        <label style={lbl}>Hero Section Photo</label>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
          {heroUrl && <img src={heroUrl} alt="Hero" style={{ width:72, height:72, objectFit:'cover', borderRadius:12 }} />}
          <button onClick={() => heroRef.current?.click()} disabled={uploading==='hero'} style={{ padding:'9px 18px', background:'#FAF5EE', border:'1.5px solid #EDE8E0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {uploading==='hero' ? 'Uploading...' : 'Upload Hero Photo'}
          </button>
          <input ref={heroRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f) uploadImg('hero',f,setHeroUrl,'hero_image_url') }} />
        </div>
        <p style={{ fontSize:12, color:'#A08070' }}>Right side of hero section. Best: 3:4 portrait.</p>
      </div>

      {/* Why section image */}
      <div style={card}>
        <label style={lbl}>Ingredients Section Photo</label>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
          {whyUrl && <img src={whyUrl} alt="Why" style={{ width:72, height:72, objectFit:'cover', borderRadius:12 }} />}
          <button onClick={() => whyRef.current?.click()} disabled={uploading==='why-section'} style={{ padding:'9px 18px', background:'#FAF5EE', border:'1.5px solid #EDE8E0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {uploading==='why-section' ? 'Uploading...' : 'Upload Photo'}
          </button>
          <input ref={whyRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f) uploadImg('why-section',f,setWhyUrl,'why_image_url') }} />
        </div>
        <p style={{ fontSize:12, color:'#A08070' }}>Right side of the ingredients section. Best: 3:4 portrait.</p>
      </div>

      {/* Ticker */}
      <div style={card}>
        <label style={lbl}>Ticker Bar</label>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, fontWeight:600, color:'#2C1A0E' }}>
            <input type="checkbox" checked={tickerAnimated} onChange={e => setTickerAnimated(e.target.checked)} style={{ accentColor:'#C84B0F', width:16, height:16 }} />
            Animated (scrolling)
          </label>
          <span style={{ fontSize:12, color:'#A08070' }}>— uncheck for static</span>
        </div>

        <div style={{ marginBottom:10, fontWeight:700, fontSize:12, color:'#2C1A0E' }}>Ticker Items</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
          {tickerItems.map(item => (
            <div key={item.id} style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input style={{ ...inp, width:70, flexShrink:0 }} placeholder="100%" value={item.highlight} onChange={e => updateTicker(item.id,'highlight',e.target.value)} title="Highlight (e.g. 100%)" />
              <input style={{ ...inp, flex:1 }} placeholder="Fresh Ingredients" value={item.text} onChange={e => updateTicker(item.id,'text',e.target.value)} />
              <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#2C1A0E', flexShrink:0 }}>
                <input type="checkbox" checked={item.is_active} onChange={e => updateTicker(item.id,'is_active',e.target.checked)} style={{ accentColor:'#C84B0F' }} />
                On
              </label>
              <button onClick={() => saveTicker(item)} style={{ padding:'6px 12px', background:'#C84B0F', color:'white', border:'none', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>Save</button>
              <button onClick={() => deleteTicker(item.id)} style={{ padding:'6px 10px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={addTicker} style={{ padding:'8px 16px', background:'#FAF5EE', border:'1.5px solid #EDE8E0', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#2C1A0E' }}>
          + Add Ticker Item
        </button>
      </div>
    </div>
  )
}
