// ════════════════════════════════════════════════════════════
// ADMIN SETTINGS PAGE
// Edit:
//   - WhatsApp number
//   - Instagram handle
//   - Delivery areas
//   - Order cutoff time
//   - Footer links (add, edit, remove)
//   - Footer column titles
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Setting = { key: string; value: string; label: string }
type FooterLink = { id: string; col: string; label: string; url: string; position: number; is_active: boolean }

const hints: Record<string, string> = {
  whatsapp_number:  'No + sign. Example: 966512345678',
  instagram_handle: 'No @ sign. Example: ninoz.sa',
  delivery_areas:   'Example: Riyadh, Al Khobar',
  min_order_notice: 'Order cutoff hour (24h). Example: 22 = 10pm',
}
const icons: Record<string, string> = {
  whatsapp_number: '💬', instagram_handle: '📸',
  delivery_areas: '🚚', min_order_notice: '⏰',
}

export default function SettingsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'contact' | 'footer'>('contact')
  const [settings, setSettings] = useState<Setting[]>([])
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingLink, setSavingLink] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [s, f] = await Promise.all([
      supabase.from('site_settings').select('*').order('key'),
      supabase.from('footer_links').select('*').order('col').order('position'),
    ])
    if (s.data) setSettings(s.data)
    if (f.data) setFooterLinks(f.data)
    setLoading(false)
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  // ── SAVE CONTACT SETTINGS ──
  async function saveSettings() {
    setSaving(true)
    for (const s of settings) {
      await supabase.from('site_settings').update({ value: s.value, updated_at: new Date().toISOString() }).eq('key', s.key)
    }
    setSaving(false)
    flash('Settings saved ✓')
  }

  // ── SAVE FOOTER LINK ──
  async function saveLink(link: FooterLink) {
    setSavingLink(link.id)
    await supabase.from('footer_links').update({ label: link.label, url: link.url, col: link.col, is_active: link.is_active }).eq('id', link.id)
    setSavingLink(null)
    flash('Link saved ✓')
  }

  // ── ADD FOOTER LINK ──
  async function addLink(col: string) {
    const colLinks = footerLinks.filter(f => f.col === col)
    const { data } = await supabase.from('footer_links').insert({
      col, label: 'New Link', url: '#', position: colLinks.length + 1, is_active: true,
    }).select().single()
    if (data) setFooterLinks([...footerLinks, data])
  }

  // ── DELETE FOOTER LINK ──
  async function deleteLink(id: string) {
    if (!confirm('Delete this link?')) return
    await supabase.from('footer_links').delete().eq('id', id)
    setFooterLinks(footerLinks.filter(f => f.id !== id))
    flash('Link deleted')
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const btnStyle = (color: string, small = false) => ({
    padding: small ? '5px 10px' : '10px 20px', borderRadius: '8px', border: 'none',
    background: color, color: 'white', cursor: 'pointer',
    fontSize: small ? '11px' : '13px', fontWeight: 600 as const,
  })

  // Get unique columns
  const columns = [...new Set(footerLinks.map(f => f.col))]

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Site Settings</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>Manage contact info and footer links.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '4px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '20px', width: 'fit-content' }}>
        {[
          { id: 'contact', label: '📞 Contact Info' },
          { id: 'footer',  label: '🔗 Footer Links' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: tab === t.id ? '#1C1C1A' : 'transparent', color: tab === t.id ? 'white' : '#7A7068' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTACT TAB ── */}
      {tab === 'contact' && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', maxWidth: '560px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {settings.map(s => (
              <div key={s.key} style={{ padding: '14px', background: '#FAFAF8', borderRadius: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#1C1C1A', marginBottom: '4px' }}>
                  <span>{icons[s.key] || '⚙️'}</span> {s.label || s.key}
                </label>
                {hints[s.key] && <div style={{ fontSize: '11px', color: '#C9A98A', marginBottom: '6px' }}>{hints[s.key]}</div>}
                <input value={s.value} onChange={e => setSettings(settings.map(x => x.key === s.key ? { ...x, value: e.target.value } : x))}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#E8834A'}
                  onBlur={e => e.target.style.borderColor = '#E8D5C4'}
                />
              </div>
            ))}
          </div>
          <button onClick={saveSettings} disabled={saving} style={{ ...btnStyle('#E8834A'), marginTop: '20px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      )}

      {/* ── FOOTER TAB ── */}
      {tab === 'footer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {columns.map(col => (
            <div key={col} style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid rgba(0,0,0,0.05)' }}>
              {/* Column title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9A98A' }}>
                  {col}
                </div>
                <button onClick={() => addLink(col)} style={btnStyle('#4A7C59', true)}>+ Add</button>
              </div>

              {/* Links in this column */}
              {footerLinks.filter(f => f.col === col).map(link => (
                <div key={link.id} style={{ marginBottom: '10px', padding: '10px', background: '#FAFAF8', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#C9A98A', marginBottom: '3px' }}>LABEL</div>
                      <input value={link.label} onChange={e => setFooterLinks(footerLinks.map(f => f.id === link.id ? { ...f, label: e.target.value } : f))}
                        style={{ ...inp, fontSize: '12px', padding: '6px 10px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#C9A98A', marginBottom: '3px' }}>URL</div>
                      <input value={link.url} onChange={e => setFooterLinks(footerLinks.map(f => f.id === link.id ? { ...f, url: e.target.value } : f))}
                        style={{ ...inp, fontSize: '12px', padding: '6px 10px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => saveLink(link)} style={btnStyle('#E8834A', true)}>{savingLink === link.id ? '...' : 'Save'}</button>
                    <button onClick={() => setFooterLinks(footerLinks.map(f => f.id === link.id ? { ...f, is_active: !f.is_active } : f))} style={btnStyle(link.is_active ? '#4A7C59' : '#C9A98A', true)}>
                      {link.is_active ? '👁' : '🙈'}
                    </button>
                    <button onClick={() => deleteLink(link.id)} style={btnStyle('#DC2626', true)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
