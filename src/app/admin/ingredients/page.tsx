'use client'

// ══════════════════════════════════════════════════════════
// /admin/ingredients/page.tsx — v5
// Edit the 4 ingredient cards shown in the "Why Ninoz" section
// Edit name, description, upload photo, toggle active
// ══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ingredient = {
  id: string
  name: string
  description: string
  image_url: string | null
  position: number
  is_active: boolean
}

export default function IngredientsAdmin() {
  const supabase = createClient()
  const [items, setItems] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .order('position', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  function updateLocal(id: string, key: keyof Ingredient, val: any) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: val } : i))
  }

  async function saveItem(item: Ingredient) {
    setSaving(item.id)
    const { error } = await supabase
      .from('ingredients')
      .update({
        name: item.name,
        description: item.description,
        is_active: item.is_active,
      })
      .eq('id', item.id)

    setSaving(null)
    if (error) { setMsg('Error saving: ' + error.message); return }
    flash('Saved!')
  }

  async function uploadImage(id: string, file: File) {
    setUploadingId(id)
    const ext = file.name.split('.').pop()
    const path = `ingredient-${id}-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('ingredients')
      .upload(path, file, { upsert: true })

    if (upErr) {
      setMsg('Upload failed: ' + upErr.message)
      setUploadingId(null)
      return
    }

    const { data: urlData } = supabase.storage
      .from('ingredients')
      .getPublicUrl(path)

    const imageUrl = urlData.publicUrl

    const { error: dbErr } = await supabase
      .from('ingredients')
      .update({ image_url: imageUrl })
      .eq('id', id)

    if (dbErr) { setMsg('DB update failed: ' + dbErr.message) }
    else {
      updateLocal(id, 'image_url', imageUrl)
      flash('Photo uploaded!')
    }
    setUploadingId(null)
  }

  async function addIngredient() {
    const { data, error } = await supabase
      .from('ingredients')
      .insert({ name: 'New Ingredient', description: '', position: items.length + 1 })
      .select()
      .single()
    if (!error && data) setItems(prev => [...prev, data])
  }

  async function deleteIngredient(id: string) {
    if (!confirm('Delete this ingredient?')) return
    await supabase.from('ingredients').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    flash('Deleted')
  }

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2500)
  }

  const inp = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1.5px solid #EDE8E0',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  }

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading ingredients...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>Ingredients</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>
            Shown in the "Why Ninoz" section on the homepage. Max 4 shown (ordered by position).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && (
            <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
              {msg}
            </div>
          )}
          <button
            onClick={addIngredient}
            style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Ingredient
          </button>
        </div>
      </div>

      {/* Ingredient cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {items.map(item => (
          <div key={item.id} style={{
            background: 'white',
            borderRadius: 14,
            border: '1.5px solid rgba(0,0,0,0.06)',
            overflow: 'hidden',
            opacity: item.is_active ? 1 : 0.6,
          }}>
            {/* Image area */}
            <div style={{ position: 'relative', height: 160, background: '#FAF5EE' }}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                  🥕
                </div>
              )}
              <button
                onClick={() => fileRefs.current[item.id]?.click()}
                disabled={uploadingId === item.id}
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  padding: '6px 12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {uploadingId === item.id ? 'Uploading...' : '📷 Change Photo'}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={el => { fileRefs.current[item.id] = el }}
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(item.id, file)
                }}
              />
            </div>

            {/* Fields */}
            <div style={{ padding: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label>
                <input
                  style={inp}
                  value={item.name}
                  onChange={e => updateLocal(item.id, 'name', e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
                <textarea
                  style={{ ...inp, height: 80, resize: 'vertical' }}
                  value={item.description}
                  onChange={e => updateLocal(item.id, 'description', e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#2C1A0E', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={e => updateLocal(item.id, 'is_active', e.target.checked)}
                    style={{ accentColor: '#C84B0F' }}
                  />
                  Active
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => deleteIngredient(item.id)}
                    style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => saveItem(item)}
                    disabled={saving === item.id}
                    style={{ padding: '6px 14px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === item.id ? 0.6 : 1 }}
                  >
                    {saving === item.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
