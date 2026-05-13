// ADMIN SETTINGS
// Edit WhatsApp number, Instagram handle, and other site settings
// Changes save to Supabase and update the website

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Setting = { key: string; value: string; label: string }

// What each setting means — shown as hint text
const hints: Record<string, string> = {
  whatsapp_number:  'No + sign. Example: 966512345678',
  instagram_handle: 'No @ sign. Example: ninoz.sa',
  delivery_areas:   'Example: Riyadh, Al Khobar',
  min_order_notice: 'Cutoff hour (24h). Example: 22 = 10pm',
}

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('site_settings').select('*').order('key')
    if (data) setSettings(data)
    setLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    for (const s of settings) {
      await supabase.from('site_settings').update({ value: s.value, updated_at: new Date().toISOString() }).eq('key', s.key)
    }
    setSaving(false)
    setMsg('All settings saved ✓')
    setTimeout(() => setMsg(''), 3000)
  }

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Site Settings</h1>
          <p style={{ color: '#7A7068', fontSize: '13px' }}>Update contact info and business settings.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}
      </div>

      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', maxWidth: '560px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {settings.map(s => (
            <div key={s.key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1C1C1A', marginBottom: '4px' }}>
                {s.label || s.key}
              </label>
              {hints[s.key] && <div style={{ fontSize: '11px', color: '#C9A98A', marginBottom: '6px' }}>{hints[s.key]}</div>}
              <input
                value={s.value}
                onChange={e => setSettings(settings.map(x => x.key === s.key ? { ...x, value: e.target.value } : x))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
        <button onClick={saveAll} disabled={saving} style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#E8834A', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
