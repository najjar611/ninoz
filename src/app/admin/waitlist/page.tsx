'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'submissions' | 'settings'

const FONTS = ['Quicksand', 'Nunito', 'Poppins', 'Tajawal', 'Cairo', 'Baloo 2', 'Comfortaa']

const KEYS = [
  'waitlist_logo_url', 'waitlist_logo_height', 'waitlist_bg_url', 'waitlist_btn_color', 'waitlist_font',
  'waitlist_h1_en', 'waitlist_h1_ar', 'waitlist_h2_en', 'waitlist_h2_ar',
  'waitlist_sub_en', 'waitlist_sub_ar',
  'waitlist_form_title_en', 'waitlist_form_title_ar',
  'waitlist_form_sub_en', 'waitlist_form_sub_ar',
  'waitlist_btn_en', 'waitlist_btn_ar',
  'waitlist_footer_en', 'waitlist_footer_ar',
  'waitlist_show_baby_name', 'waitlist_show_baby_age', 'waitlist_show_stage',
  'waitlist_badge1_icon', 'waitlist_badge1_en', 'waitlist_badge1_ar',
  'waitlist_badge2_icon', 'waitlist_badge2_en', 'waitlist_badge2_ar',
  'waitlist_badge3_icon', 'waitlist_badge3_en', 'waitlist_badge3_ar',
  'waitlist_badge4_icon', 'waitlist_badge4_en', 'waitlist_badge4_ar',
]

const DEFAULTS: Record<string, string> = {
  waitlist_btn_color: '#C84B0F',
  waitlist_logo_height: '40',
  waitlist_font: 'Quicksand',
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
  waitlist_show_baby_name: 'true', waitlist_show_baby_age: 'true', waitlist_show_stage: 'true',
  waitlist_badge1_icon: '🥗', waitlist_badge1_en: 'Fresh Ingredients', waitlist_badge1_ar: 'مكونات طازجة',
  waitlist_badge2_icon: '🚫', waitlist_badge2_en: 'No Preservatives', waitlist_badge2_ar: 'بدون مواد حافظة',
  waitlist_badge3_icon: '🍳', waitlist_badge3_en: 'Cooked Daily', waitlist_badge3_ar: 'طُهي يومياً',
  waitlist_badge4_icon: '👶', waitlist_badge4_en: 'Pediatrician Approved', waitlist_badge4_ar: 'موصى به طبياً',
}

export default function WaitlistAdmin() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('submissions')
  const [entries, setEntries] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [settings, setSettings] = useState<Record<string, string>>({ ...DEFAULTS })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [msg, setMsg] = useState('')

  const logoRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSubmissions()
    loadSettings()
  }, [])

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from('waitlist_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setFetchError(error.message)
    setEntries(data || [])
    setLoadingData(false)
  }

  async function loadSettings() {
    const { data } = await supabase.from('site_content').select('key,value').in('key', KEYS)
    const m = { ...DEFAULTS }
    for (const r of data || []) m[r.key] = r.value
    setSettings(m)
  }

  function set(key: string, val: string) {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  async function saveAll() {
    setSaving(true)
    await Promise.all(
      KEYS.map(k =>
        supabase.from('site_content').upsert(
          { key: k, value: settings[k] ?? DEFAULTS[k] ?? '', label: k, section: 'waitlist' },
          { onConflict: 'key' }
        )
      )
    )
    setSaving(false)
    flash('Saved!')
  }

  async function uploadImg(bucket: string, file: File, key: string) {
    setUploading(key)
    const path = `${key}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { flash('Upload failed: ' + error.message); setUploading(''); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    set(key, data.publicUrl)
    await supabase.from('site_content').upsert(
      { key, value: data.publicUrl, label: key, section: 'waitlist' },
      { onConflict: 'key' }
    )
    setUploading('')
    flash('Uploaded!')
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const csvHref = () => {
    const rows = [
      ['#', 'Name', "Baby's Name", 'WhatsApp', "Baby's Age", 'Language', 'Date'],
      ...entries.map((e, i) => [
        i + 1, e.parent_name, e.baby_name || '', e.whatsapp,
        e.baby_age || '', e.language === 'ar' ? 'Arabic' : 'English',
        new Date(e.created_at).toLocaleDateString(),
      ]),
    ]
    return 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  }

  const card: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #EDEBE8', marginBottom: 14 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }
  const activeTab: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: '#C84B0F', color: 'white' }
  const inactiveTab: React.CSSProperties = { ...activeTab, background: 'transparent', color: '#7A7068' }
  const uploadBtn: React.CSSProperties = { padding: '8px 16px', background: '#FAF5EE', border: '1.5px solid #EDE8E0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

  const logoHeight = parseInt(settings.waitlist_logo_height || '40')

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#1C1C1A', fontFamily: 'Nunito, sans-serif' }}>Waitlist</h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '3px 0 0' }}>
            {loadingData ? '…' : `${entries.length} ${entries.length === 1 ? 'person' : 'people'} signed up`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {msg && <span style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{msg}</span>}
          <a href="/waitlist" target="_blank" rel="noreferrer" style={{ padding: '9px 16px', background: '#FAF5EE', color: '#C84B0F', border: '1.5px solid #EDE8E0', borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            Preview ↗
          </a>
          {tab === 'submissions' && entries.length > 0 && (
            <a href={csvHref()} download="waitlist.csv" style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Export CSV
            </a>
          )}
          {tab === 'settings' && (
            <button onClick={saveAll} disabled={saving} style={{ padding: '9px 20px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 3, background: '#F2EDE8', borderRadius: 11, padding: 3, width: 'fit-content', marginBottom: 24 }}>
        <button style={tab === 'submissions' ? activeTab : inactiveTab} onClick={() => setTab('submissions')}>📋 Submissions</button>
        <button style={tab === 'settings' ? activeTab : inactiveTab} onClick={() => setTab('settings')}>⚙️ Page Settings</button>
      </div>

      {/* ── SUBMISSIONS ── */}
      {tab === 'submissions' && (
        <>
          {fetchError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '14px 18px', marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
              <strong>Cannot load data:</strong> {fetchError}<br />
              Run this in Supabase → SQL Editor:<br />
              <code style={{ background: 'rgba(0,0,0,0.06)', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginTop: 6, fontSize: 12 }}>
                CREATE POLICY &quot;Admin select waitlist&quot; ON waitlist_submissions FOR SELECT TO authenticated USING (true);
              </code>
            </div>
          )}

          {loadingData ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A7068', fontSize: 14 }}>Loading…</div>
          ) : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #EDEBE8', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100vw' }}>
              <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF5EE', borderBottom: '1px solid #eee' }}>
                    {['#', 'Name', "Baby's Name", 'WhatsApp', "Baby's Age", 'Lang', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '13px 16px', color: '#B0A098', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1C1C1A' }}>{e.parent_name}</td>
                      <td style={{ padding: '13px 16px', color: '#4A3C34' }}>{e.baby_name || <span style={{ color: '#C9A98A' }}>—</span>}</td>
                      <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 13 }}>{e.whatsapp}</td>
                      <td style={{ padding: '13px 16px', color: '#4A3C34' }}>{e.baby_age || <span style={{ color: '#C9A98A' }}>—</span>}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: e.language === 'ar' ? '#EEF2FF' : '#E8F5EE', color: e.language === 'ar' ? '#3B5BDB' : '#2D6A4F', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {e.language === 'ar' ? 'AR' : 'EN'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#7A7068', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(e.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {entries.length === 0 && !fetchError && (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: 34, marginBottom: 10 }}>📋</div>
                  <p style={{ color: '#7A7068', fontSize: 14, fontWeight: 600, margin: 0 }}>No signups yet.</p>
                  <p style={{ color: '#A0958D', fontSize: 13, margin: '6px 0 0' }}>Share <strong>/waitlist</strong> on Instagram to start collecting.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── SETTINGS ── */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 680 }}>

          {/* Logo */}
          <div style={card}>
            <label style={lbl}>Logo on Waitlist Page</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              {settings.waitlist_logo_url
                ? <img src={settings.waitlist_logo_url} alt="Logo" style={{ height: logoHeight, maxWidth: 200, objectFit: 'contain', background: '#1C0A04', borderRadius: 8, padding: '6px 10px' }} />
                : <div style={{ height: logoHeight, minWidth: 100, background: '#1C0A04', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito,sans-serif', fontSize: 17, fontWeight: 900, color: '#C84B0F', padding: '0 12px' }}>Ninoz</div>
              }
              <button onClick={() => logoRef.current?.click()} disabled={uploading === 'waitlist_logo_url'} style={uploadBtn}>
                {uploading === 'waitlist_logo_url' ? 'Uploading…' : settings.waitlist_logo_url ? 'Replace Logo' : 'Upload Logo'}
              </button>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImg('logo', f, 'waitlist_logo_url') }} />
            </div>

            {/* Logo size slider */}
            <label style={{ ...lbl, marginBottom: 6 }}>Logo Size — {logoHeight}px</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#A08070' }}>Small</span>
              <input
                type="range" min="24" max="120" step="4"
                value={logoHeight}
                onChange={e => set('waitlist_logo_height', e.target.value)}
                style={{ flex: 1, accentColor: '#C84B0F', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, color: '#A08070' }}>Large</span>
            </div>
            <p style={{ fontSize: 12, color: '#A08070', margin: '8px 0 0' }}>Falls back to the main site logo if not set. Hit "Save Changes" to apply.</p>
          </div>

          {/* Background */}
          <div style={card}>
            <label style={lbl}>Background Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              {settings.waitlist_bg_url && <img src={settings.waitlist_bg_url} alt="BG" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 9 }} />}
              <button onClick={() => bgRef.current?.click()} disabled={uploading === 'waitlist_bg_url'} style={uploadBtn}>
                {uploading === 'waitlist_bg_url' ? 'Uploading…' : settings.waitlist_bg_url ? 'Replace Background' : 'Upload Background'}
              </button>
              <input ref={bgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImg('hero', f, 'waitlist_bg_url') }} />
            </div>
            <p style={{ fontSize: 12, color: '#A08070', margin: 0 }}>Falls back to the main site hero image if not set.</p>
          </div>

          {/* Button color */}
          <div style={card}>
            <label style={lbl}>Button & Accent Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={settings.waitlist_btn_color} onChange={e => set('waitlist_btn_color', e.target.value)} style={{ width: 42, height: 42, border: 'none', borderRadius: 9, cursor: 'pointer', padding: 2, background: 'none' }} />
              <input value={settings.waitlist_btn_color} onChange={e => set('waitlist_btn_color', e.target.value)} style={{ ...inp, width: 110 }} />
              <div style={{ width: 42, height: 42, borderRadius: 9, background: settings.waitlist_btn_color, border: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }} />
            </div>
          </div>

          {/* Font */}
          <div style={card}>
            <label style={lbl}>Page Font</label>
            <p style={{ fontSize: 12, color: '#A08070', margin: '0 0 12px' }}>This font applies only to the waitlist page — it's independent from the main site font.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {FONTS.map(f => (
                <button key={f} onClick={() => set('waitlist_font', f)} style={{
                  padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: `'${f}', sans-serif`,
                  fontSize: 13, fontWeight: 700, border: settings.waitlist_font === f ? '2px solid #C84B0F' : '1.5px solid #EDE8E0',
                  background: settings.waitlist_font === f ? '#FFF4ED' : 'white', color: '#2C1A0E',
                }}>{f}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4 }}>OR TYPE A GOOGLE FONT NAME</div>
            <input value={settings.waitlist_font || ''} onChange={e => set('waitlist_font', e.target.value)} style={inp} placeholder="Quicksand" />
            <p style={{ fontSize: 24, fontWeight: 700, color: '#2C1A0E', margin: '14px 0 0', fontFamily: `'${settings.waitlist_font || 'Quicksand'}', sans-serif` }}>
              You Care. We Prepare. — أنت تهتم. نحن نُعِد.
            </p>
          </div>

          {/* Text content */}
          <div style={card}>
            <label style={{ ...lbl, marginBottom: 18 }}>Page Text</label>
            {[
              { en: 'waitlist_h1_en', ar: 'waitlist_h1_ar', label: 'Headline Line 1' },
              { en: 'waitlist_h2_en', ar: 'waitlist_h2_ar', label: 'Headline Line 2 (colored)' },
              { en: 'waitlist_sub_en', ar: 'waitlist_sub_ar', label: 'Subtitle' },
              { en: 'waitlist_form_title_en', ar: 'waitlist_form_title_ar', label: 'Form Title' },
              { en: 'waitlist_form_sub_en', ar: 'waitlist_form_sub_ar', label: 'Form Subtitle' },
              { en: 'waitlist_btn_en', ar: 'waitlist_btn_ar', label: 'Button Text' },
              { en: 'waitlist_footer_en', ar: 'waitlist_footer_ar', label: 'Footer' },
            ].map(row => (
              <div key={row.en} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>{row.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4 }}>ENGLISH</div>
                    <input value={settings[row.en] || ''} onChange={e => set(row.en, e.target.value)} style={inp} placeholder="English text" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4, textAlign: 'right' }}>عربي</div>
                    <input value={settings[row.ar] || ''} onChange={e => set(row.ar, e.target.value)} style={{ ...inp, direction: 'rtl', textAlign: 'right' }} placeholder="النص العربي" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={card}>
            <label style={{ ...lbl, marginBottom: 16 }}>Feature Badges</label>
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="badge-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(56px, 80px) 1fr 1fr', gap: 8, marginBottom: 10, alignItems: 'end', minWidth: 0 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4 }}>ICON</div>
                  <input value={settings[`waitlist_badge${n}_icon`] || ''} onChange={e => set(`waitlist_badge${n}_icon`, e.target.value)} style={{ ...inp, textAlign: 'center', fontSize: 18, padding: '7px 4px' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4 }}>ENGLISH</div>
                  <input value={settings[`waitlist_badge${n}_en`] || ''} onChange={e => set(`waitlist_badge${n}_en`, e.target.value)} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4, textAlign: 'right' }}>عربي</div>
                  <input value={settings[`waitlist_badge${n}_ar`] || ''} onChange={e => set(`waitlist_badge${n}_ar`, e.target.value)} style={{ ...inp, direction: 'rtl', textAlign: 'right' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Field visibility */}
          <div style={card}>
            <label style={{ ...lbl, marginBottom: 10 }}>Form Fields</label>
            <p style={{ fontSize: 12, color: '#A08070', margin: '0 0 14px' }}>Name and WhatsApp are always shown. Toggle optional fields below.</p>
            {[
              { key: 'waitlist_show_baby_name', label: "Show Baby's Name field" },
              { key: 'waitlist_show_baby_age', label: "Show Baby's Age dropdown" },
              { key: 'waitlist_show_stage', label: "Show Baby's Stage dropdown" },
            ].map(f => (
              <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings[f.key] !== 'false'} onChange={e => set(f.key, e.target.checked ? 'true' : 'false')} style={{ accentColor: '#C84B0F', width: 16, height: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{f.label}</span>
              </label>
            ))}
          </div>

        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .ticker-row { flex-wrap: wrap; }
          .badge-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
