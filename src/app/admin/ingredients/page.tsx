'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ingredient = { id: string; name: string; benefit: string; image_url: string | null; position: number; is_active: boolean }

export default function IngredientsPage() {
  const supabase = createClient()
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [items, setItems] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('ingredients').select('*').order('position')
    if (data) setItems(data)
    setLoading(false)
  }

  function flash(text: string, type = 'success') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 3000) }

  async function save(item: Ingredient) {
    setSaving(item.id)
    await supabase.from('ingredients').update({ name: item.name, benefit: item.benefit, is_active: item.is_active }).eq('id', item.id)
    setSaving(null)
    flash('Saved ✓')
  }

  async function add() {
    const { data } = await supabase.from('ingredients').insert({ name: 'New Ingredient', benefit: 'Health benefit here', position: items.length + 1 }).select().single()
    if (data) { setItems([...items, data]) }
    flash('Added ✓')
  }

  async function remove(id: string) {
    if (!confirm('Delete this ingredient?')) return
    await supabase.from('ingredients').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  async function uploadImage(id: string, file: File) {
    if (file.size > 5 * 1024 * 1024) { flash('Max 5MB', 'error'); return }
    setUploading(id)
    const ext = file.name.split('.').pop()
    const { error } = await supabase.storage.from('ingredients').upload(`ingredient-${id}.${ext}`, file, { upsert: true })
    if (error) { flash(error.message, 'error'); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('ingredients').getPublicUrl(`ingredient-${id}.${ext}`)
    await supabase.from('ingredients').update({ image_url: publicUrl }).eq('id', id)
    setItems(items.map(i => i.id === id ? { ...i, image_url: publicUrl } : i))
    setUploading(null)
    flash('Image uploaded ✓')
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#C9A98A', marginBottom: '4px' }
  const btn = (color: string, small = false) => ({ padding: small ? '5px 10px' : '8px 16px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: small ? '11px' : '12px', fontWeight: 600 as const })

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Ingredients Showcase</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>These show in the "Only Real Ingredients" section on the homepage.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg.text && <div style={{ background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2', color: msg.type === 'success' ? '#2D6A4F' : '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg.text}</div>}
          <button onClick={add} style={btn('#4A7C59')}>+ Add Ingredient</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
        {items.map(item => (
          <div key={item.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.06)', opacity: item.is_active ? 1 : 0.6 }}>
            {/* Image */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', background: '#F5F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '8px' }}>
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥕'}
              </div>
              <input type="file" accept="image/*" ref={el => { fileRefs.current[item.id] = el }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(item.id, f) }} style={{ display: 'none' }} />
              <button onClick={() => fileRefs.current[item.id]?.click()} style={{ ...btn(uploading === item.id ? '#C9A98A' : '#7B5EA7'), width: '100%', fontSize: '11px' }} disabled={uploading === item.id}>
                {uploading === item.id ? 'Uploading...' : '📤 Upload Photo'}
              </button>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={lbl}>Name</label>
              <input value={item.name} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} style={inp} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Benefit</label>
              <input value={item.benefit} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, benefit: e.target.value } : i))} style={inp} placeholder="e.g. Beta-carotene for vision" />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => save(item)} style={btn('#E8834A')}>{saving === item.id ? '...' : 'Save'}</button>
              <button onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))} style={btn(item.is_active ? '#4A7C59' : '#C9A98A', true)}>{item.is_active ? '👁' : '🙈'}</button>
              <button onClick={() => remove(item.id)} style={btn('#DC2626', true)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
