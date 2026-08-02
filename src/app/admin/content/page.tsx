'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Row = { key: string; value: string; label: string; section: string }
type Group = { key: string; arKey: string | null; label: string; section: string; value: string; valueAr: string }

const SECTIONS = ['hero', 'how', 'why', 'ingredients', 'pricing', 'faq', 'footer', 'general']

export default function ContentAdmin() {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('site_content').select('key,value,label,section').order('section').order('key')
    const all = data || []
    setRows(all)

    const byKey = new Map(all.map(r => [r.key, r]))
    const built: Group[] = []
    const seen = new Set<string>()

    for (const r of all) {
      if (r.key.endsWith('_ar')) continue
      const arKey = `${r.key}_ar`
      const arRow = byKey.get(arKey)
      built.push({
        key: r.key, arKey: arRow ? arKey : null,
        label: r.label || r.key, section: r.section,
        value: r.value || '', valueAr: arRow?.value || '',
      })
      seen.add(r.key); if (arRow) seen.add(arKey)
    }
    // Arabic-only rows with no English counterpart (edge case) still show up
    for (const r of all) {
      if (seen.has(r.key)) continue
      built.push({ key: r.key, arKey: null, label: r.label || r.key, section: r.section, value: r.value || '', valueAr: '' })
    }

    setGroups(built)
    setLoading(false)
  }

  function update(key: string, field: 'value' | 'valueAr', val: string) {
    setGroups(prev => prev.map(g => g.key === key ? { ...g, [field]: val } : g))
  }

  async function save(group: Group) {
    setSaving(group.key)
    const writes = [
      supabase.from('site_content').upsert({ key: group.key, value: group.value, label: group.label, section: group.section }, { onConflict: 'key' }),
    ]
    if (group.arKey) {
      writes.push(supabase.from('site_content').upsert({ key: group.arKey, value: group.valueAr, label: `${group.label} (Arabic)`, section: group.section }, { onConflict: 'key' }))
    }
    await Promise.all(writes)
    setSaving(null)
    flash('Saved!')
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const sections = [...new Set(rows.map(r => r.section).filter(Boolean))]
  const displaySections = sections.length > 0 ? sections : SECTIONS
  const filtered = groups.filter(g => g.section === activeSection)

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading content…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Homepage Text</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Just the wording/copy on the homepage (headlines, labels, footer), in English &amp; Arabic. For cards/items use “Homepage Cards &amp; Items”; for logo/colours use “Branding &amp; Settings”.</p>
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
        {filtered.map(group => (
          <div key={group.key} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #EDEBE8' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              {group.label}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: group.arKey ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4 }}>ENGLISH</div>
                {group.value.length > 80 ? (
                  <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={group.value} onChange={e => update(group.key, 'value', e.target.value)} />
                ) : (
                  <input style={inp} value={group.value} onChange={e => update(group.key, 'value', e.target.value)} />
                )}
              </div>
              {group.arKey && (
                <div>
                  <div style={{ fontSize: 10, color: '#A08070', fontWeight: 600, marginBottom: 4, textAlign: 'right' }}>عربي</div>
                  {group.valueAr.length > 80 ? (
                    <textarea style={{ ...inp, height: 80, resize: 'vertical', direction: 'rtl', textAlign: 'right' }} value={group.valueAr} onChange={e => update(group.key, 'valueAr', e.target.value)} />
                  ) : (
                    <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={group.valueAr} onChange={e => update(group.key, 'valueAr', e.target.value)} />
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                onClick={() => save(group)}
                disabled={saving === group.key}
                style={{ padding: '7px 20px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === group.key ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {saving === group.key ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
