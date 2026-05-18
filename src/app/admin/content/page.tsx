'use client'

// src/app/admin/content/page.tsx — v6
// Edit ALL website text from one place
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentItem = { key: string; value: string; label: string; section: string }

const SECTION_LABELS: Record<string, string> = {
  navbar: '🔝 Navbar',
  hero: '🏠 Hero Section',
  ticker: '📢 Ticker Bar',
  stages: '🍼 Stages Section',
  how: '📋 How It Works',
  menu: '🍽️ Menu Section',
  ingredients: '🥕 Ingredients Section',
  footer: '🔗 Footer',
  popup: '📋 Subscription Popup',
}

export default function ContentAdmin() {
  const supabase = createClient()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('site_content').select('*').order('section').order('key')
    setItems(data || [])
    setLoading(false)
  }

  async function save(item: ContentItem) {
    setSaving(item.key)
    const { error } = await supabase.from('site_content').update({ value: item.value }).eq('key', item.key)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  function update(key: string, value: string) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, value } : i))
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const sections = [...new Set(items.map(i => i.section))]
  const filtered = items.filter(i => i.section === activeSection)

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #EDE8E0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Content & Text</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Edit all website text. Changes appear on site immediately after saving.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Section tabs */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {sections.map(section => (
            <button key={section}
              onClick={() => setActiveSection(section)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                marginBottom: 4,
                background: activeSection === section ? '#C84B0F' : 'white',
                color: activeSection === section ? 'white' : '#7A7068',
              }}>
              {SECTION_LABELS[section] || section}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(item => (
            <div key={item.key} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.label}
              </label>
              {item.value.length > 80 ? (
                <textarea
                  style={{ ...inp, height: 80, resize: 'vertical' }}
                  value={item.value}
                  onChange={e => update(item.key, e.target.value)}
                />
              ) : (
                <input style={inp} value={item.value} onChange={e => update(item.key, e.target.value)} />
              )}
              <button
                onClick={() => save(item)}
                disabled={saving === item.key}
                style={{ marginTop: 8, padding: '7px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === item.key ? 0.6 : 1, fontFamily: 'inherit' }}>
                {saving === item.key ? 'Saving...' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
