'use client'

// src/app/admin/content/page.tsx — v6.1
// Edit all text + footer links in one place
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentItem = { key: string; value: string; label: string; section: string }
type FooterLink = { id: string; label: string; url: string; position: number; is_active: boolean }

const SECTION_LABELS: Record<string, string> = {
  navbar: '🔝 Navbar',
  hero: '🏠 Hero',
  ticker: '📢 Ticker Bar',
  stages: '🍼 Stages',
  how: '📋 How It Works',
  menu: '🍽️ Menu',
  ingredients: '🥕 Ingredients',
  faq: '❓ FAQ',
  footer: '🔗 Footer Text',
}

export default function ContentAdmin() {
  const supabase = createClient()
  const [items, setItems] = useState<ContentItem[]>([])
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savingLink, setSavingLink] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => { load() }, [])

  async function load() {
    const [content, links] = await Promise.all([
      supabase.from('site_content').select('*').order('section').order('key'),
      supabase.from('footer_links').select('*').order('position'),
    ])
    // Filter out settings keys (handled in settings page)
    const filtered = (content.data || []).filter(i => !['site_font', 'ticker_animated', 'hero_image_url', 'why_image_url'].includes(i.key))
    setItems(filtered)
    setFooterLinks(links.data || [])
    setLoading(false)
  }

  async function save(item: ContentItem) {
    setSaving(item.key)
    await supabase.from('site_content').update({ value: item.value }).eq('key', item.key)
    setSaving(null)
    flash('Saved!')
  }

  function update(key: string, value: string) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, value } : i))
  }

  async function saveLink(link: FooterLink) {
    setSavingLink(link.id)
    await supabase.from('footer_links').update({ label: link.label, url: link.url, is_active: link.is_active }).eq('id', link.id)
    setSavingLink(null)
    flash('Saved!')
  }

  function updateLink(id: string, key: keyof FooterLink, val: any) {
    setFooterLinks(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l))
  }

  async function addLink() {
    const { data } = await supabase.from('footer_links').insert({ label: 'New Link', url: '#', position: footerLinks.length + 1 }).select().single()
    if (data) setFooterLinks(prev => [...prev, data])
  }

  async function deleteLink(id: string) {
    await supabase.from('footer_links').delete().eq('id', id)
    setFooterLinks(prev => prev.filter(l => l.id !== id))
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const sections = [...new Set(items.map(i => i.section))].filter(s => SECTION_LABELS[s])
  const filtered = items.filter(i => i.section === activeSection)

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #EDE8E0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Content & Text</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Edit all website text. Click Save on each field after editing.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Section tabs */}
        <div style={{ width: 170, flexShrink: 0 }}>
          {[...sections, 'footer_links'].map(section => (
            <button key={section} onClick={() => setActiveSection(section)} style={{
              width: '100%', textAlign: 'left', padding: '10px 14px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, marginBottom: 4,
              background: activeSection === section ? '#C84B0F' : 'white',
              color: activeSection === section ? 'white' : '#7A7068',
            }}>
              {section === 'footer_links' ? '🔗 Footer Links' : SECTION_LABELS[section] || section}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === 'footer_links' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={addLink} style={{ padding: '8px 16px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Add Link
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {footerLinks.map(link => (
                  <div key={link.id} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input style={{ ...inp, flex: 1, minWidth: 120 }} placeholder="Label" value={link.label} onChange={e => updateLink(link.id, 'label', e.target.value)} />
                    <input style={{ ...inp, flex: 2, minWidth: 160 }} placeholder="URL" value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={link.is_active} onChange={e => updateLink(link.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                      Active
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => deleteLink(link.id)} style={{ padding: '7px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                      <button onClick={() => saveLink(link)} disabled={savingLink === link.id} style={{ padding: '7px 14px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: savingLink === link.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                        {savingLink === link.id ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(item => (
                <div key={item.key} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {item.label}
                  </label>
                  {item.value.length > 80 ? (
                    <textarea style={{ ...inp, height: 72, resize: 'vertical', marginBottom: 8 }} value={item.value} onChange={e => update(item.key, e.target.value)} />
                  ) : (
                    <input style={{ ...inp, marginBottom: 8 }} value={item.value} onChange={e => update(item.key, e.target.value)} />
                  )}
                  <button onClick={() => save(item)} disabled={saving === item.key}
                    style={{ padding: '7px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === item.key ? 0.6 : 1, fontFamily: 'inherit' }}>
                    {saving === item.key ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
