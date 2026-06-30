'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Field = {
  id: string; field_key: string; label_en: string; label_ar: string | null
  field_type: 'text' | 'number' | 'date' | 'select'; options: string[] | null
  is_required: boolean; position: number; is_active: boolean
}

export default function CustomerFieldsAdmin() {
  const supabase = createClient()
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('customer_fields').select('*').order('position')
    setFields(data || [])
    setLoading(false)
  }

  function update(id: string, key: keyof Field, val: any) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))
  }

  async function save(f: Field) {
    setSaving(f.id)
    const { error } = await supabase.from('customer_fields').update({
      field_key: f.field_key, label_en: f.label_en, label_ar: f.label_ar, field_type: f.field_type,
      options: f.field_type === 'select' ? f.options : null, is_required: f.is_required, is_active: f.is_active,
    }).eq('id', f.id)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  async function add() {
    const { data, error } = await supabase.from('customer_fields').insert({
      field_key: 'new_field_' + Date.now(), label_en: 'New Field', label_ar: '', field_type: 'text',
      is_required: false, position: fields.length + 1, is_active: true,
    }).select().single()
    if (data) setFields(prev => [...prev, data])
    if (error) flash('Error: ' + error.message)
  }

  async function remove(id: string) {
    if (!confirm('Delete this field? Existing customer answers for it will remain in their data but the form will no longer show it.')) return
    await supabase.from('customer_fields').delete().eq('id', id)
    setFields(prev => prev.filter(f => f.id !== id))
    flash('Deleted')
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading customer fields…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Customer Profile Fields</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Control what information you collect from customers on the account profile page, and whether each one is required.</p>
        </div>
        <button onClick={add} style={{ background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>+ Add Field</button>
      </div>

      {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 14, display: 'inline-block' }}>{msg}</div>}

      {fields.map(f => (
        <div key={f.id} style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#7A7068' }}>Key (internal, no spaces)</label>
              <input style={inp} value={f.field_key} onChange={e => update(f.id, 'field_key', e.target.value.replace(/\s+/g, '_'))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#7A7068' }}>Type</label>
              <select style={inp} value={f.field_type} onChange={e => update(f.id, 'field_type', e.target.value)}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select (dropdown)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#7A7068' }}>Label (English)</label>
              <input style={inp} value={f.label_en} onChange={e => update(f.id, 'label_en', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#7A7068' }}>Label (Arabic)</label>
              <input style={{ ...inp, direction: 'rtl' }} value={f.label_ar || ''} onChange={e => update(f.id, 'label_ar', e.target.value)} />
            </div>
            {f.field_type === 'select' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7A7068' }}>Options (comma separated)</label>
                <input style={inp} value={(f.options || []).join(', ')} onChange={e => update(f.id, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#1C1C1A', cursor: 'pointer' }}>
              <input type="checkbox" checked={f.is_required} onChange={e => update(f.id, 'is_required', e.target.checked)} /> Required
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#1C1C1A', cursor: 'pointer' }}>
              <input type="checkbox" checked={f.is_active} onChange={e => update(f.id, 'is_active', e.target.checked)} /> Active (shown on profile page)
            </label>
            <div style={{ flex: 1 }} />
            <button onClick={() => save(f)} disabled={saving === f.id} style={{ background: '#1E6091', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', opacity: saving === f.id ? 0.6 : 1 }}>{saving === f.id ? 'Saving…' : 'Save'}</button>
            <button onClick={() => remove(f.id)} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      ))}

      {fields.length === 0 && <p style={{ color: '#B0A098', fontSize: 13 }}>No custom fields yet. Click "+ Add Field" to collect extra information from customers (e.g. kid's birthdate, allergies).</p>}
    </div>
  )
}
