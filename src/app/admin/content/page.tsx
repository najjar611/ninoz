'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Row = { key: string; value: string; label: string; section: string }

const SECTIONS = ['hero', 'how', 'why', 'ingredients', 'pricing', 'faq', 'footer', 'general']

export default function ContentAdmin() {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('site_content').select('key,value,label,section').order('section').order('key')
    setRows(data || [])
    setLoading(false)
  }

  function update(key: string, value: string) {
    setRows(prev => prev.map(r => r.key === key ? { ...r, value } : r))
  }

  async function save(row: Row) {
    setSaving(row.key)
    await supabase.from('site_content').upsert({ ...row }, { onConflict: 'key' })
    setSaving(null)
    flash('Saved!')
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const sections = [...new Set(rows.map(r => r.section).filter(Boolean))]
  const displaySections = sections.length > 0 ? sections : SECTIONS
  const filtered = rows.filter(r => r.section === activeSection)

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading content…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Edit Text</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Edit all homepage text content by section.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {displaySections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
            background: activeSection === s ? '#C84B0F' : '#F2EDE8',
            color: activeSection === s ? 'white' : '#5A5048',
          }}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#B0A098', fontSize: 14 }}>
          No content entries for this section yet.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(row => (
          <div key={row.key} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #EDEBE8' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              {row.label || row.key}
            </label>
            {row.value && row.value.length > 80 ? (
              <textarea
                style={{ ...inp, height: 80, resize: 'vertical' }}
                value={row.value}
                onChange={e => update(row.key, e.target.value)}
              />
            ) : (
              <input style={inp} value={row.value} onChange={e => update(row.key, e.target.value)} />
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => save(row)}
                disabled={saving === row.key}
                style={{ padding: '7px 20px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === row.key ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {saving === row.key ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
