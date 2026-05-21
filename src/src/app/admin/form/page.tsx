// ════════════════════════════════════════════════════════════
// ADMIN FORM FIELDS PAGE — /admin/form
// Control the subscription form:
//   - Show/hide fields
//   - Required/optional
//   - Field type (text, phone, dropdown, textarea)
//   - Dropdown options
//   - Field label
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type FormField = {
  id: string; field_key: string; label: string; field_type: string
  placeholder: string; is_active: boolean; is_required: boolean
  position: number; options: string
}

export default function FormFieldsPage() {
  const supabase = createClient()
  const [fields, setFields] = useState<FormField[]>([])
  const [stages, setStages] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [fieldsRes, stagesRes] = await Promise.all([
      supabase.from('form_fields').select('*').order('position'),
      supabase.from('stages').select('id, name').order('position'),
    ])
    if (fieldsRes.data) setFields(fieldsRes.data)
    if (stagesRes.data) setStages(stagesRes.data)
    setLoading(false)
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  async function saveField(field: FormField) {
    setSaving(field.id)
    await supabase.from('form_fields').update({
      label: field.label, field_type: field.field_type,
      placeholder: field.placeholder, is_active: field.is_active,
      is_required: field.is_required, options: field.options,
    }).eq('id', field.id)
    setSaving(null)
    flash('Saved ✓')
  }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#C9A98A', marginBottom: '4px' }
  const btn = (color: string) => ({ padding: '7px 14px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 as const })

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Subscription Form</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>Control which fields appear in the subscription form, and how they behave.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}
      </div>

      {/* Stage dropdown options info */}
      <div style={{ background: '#FFF0EA', border: '1px solid rgba(200,75,15,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', fontSize: '13px', color: '#7A6055' }}>
        💡 The <strong>Plan</strong> dropdown automatically shows all your stages and plans. No need to set options manually.
      </div>

      {/* Field cards */}
      {fields.map(field => (
        <div key={field.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '10px', padding: '18px', opacity: field.is_active ? 1 : 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1C1C1A' }}>{field.label}</div>
              <div style={{ fontSize: '10px', color: '#C9A98A', background: '#F5F3EE', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{field.field_key}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {/* Active toggle */}
              <button onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f))}
                style={{ ...btn(field.is_active ? '#4A7C59' : '#C9A98A'), fontSize: '11px' }}>
                {field.is_active ? '👁 Visible' : '🙈 Hidden'}
              </button>
              {/* Required toggle */}
              <button onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, is_required: !f.is_required } : f))}
                style={{ ...btn(field.is_required ? '#E8834A' : '#7A7068'), fontSize: '11px' }}>
                {field.is_required ? '★ Required' : '○ Optional'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={lbl}>Field Label</label>
              <input value={field.label} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Field Type</label>
              <select value={field.field_type} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, field_type: e.target.value } : f))}
                style={{ ...inp, background: 'white' }}>
                <option value="text">Text Input</option>
                <option value="phone">Phone Number</option>
                <option value="dropdown">Dropdown</option>
                <option value="textarea">Text Area (long text)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={lbl}>Placeholder Text</label>
            <input value={field.placeholder} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, placeholder: e.target.value } : f))} style={inp} placeholder="Hint text shown inside the field" />
          </div>

          {field.field_type === 'dropdown' && field.field_key !== 'plan' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={lbl}>Dropdown Options (comma separated)</label>
              <input value={field.options} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, options: e.target.value } : f))} style={inp} placeholder="Option 1, Option 2, Option 3" />
            </div>
          )}

          <button onClick={() => saveField(field)} style={btn('#E8834A')}>
            {saving === field.id ? 'Saving...' : 'Save Field'}
          </button>
        </div>
      ))}
    </div>
  )
}
