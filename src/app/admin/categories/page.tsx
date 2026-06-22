'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = {
  id: string; name: string; slug: string
  is_visible: boolean; position: number
}

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export default function CategoriesAdmin() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('position')
    setCategories(data || [])
    setLoading(false)
  }

  function update(id: string, key: keyof Category, val: any) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c))
  }

  async function save(cat: Category) {
    setSaving(cat.id)
    const { error } = await supabase.from('categories').update({
      name: cat.name, slug: cat.slug, is_visible: cat.is_visible, position: cat.position,
    }).eq('id', cat.id)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  async function addCategory() {
    const name = 'New Category'
    const { data, error } = await supabase.from('categories').insert({
      name, slug: slugify(name) + '_' + Date.now().toString(36),
      is_visible: true, position: categories.length + 1,
    }).select().single()
    if (error) { flash('Error: ' + error.message); return }
    if (data) setCategories(prev => [...prev, data])
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Meals already assigned to it will keep their old type but it will disappear from the menu.')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { flash('Error: ' + error.message); return }
    setCategories(prev => prev.filter(c => c.id !== id))
    flash('Deleted')
  }

  function move(id: string, dir: -1 | 1) {
    const idx = categories.findIndex(c => c.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= categories.length) return
    const next = [...categories]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    next.forEach((c, i) => { c.position = i + 1 })
    setCategories(next)
    Promise.all(next.map(c => supabase.from('categories').update({ position: c.position }).eq('id', c.id)))
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading categories…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Meal Categories</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Manage the categories meals can belong to (e.g. Breakfast, Snack). These power the menu tabs on the homepage.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={addCategory} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Category
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #EDEBE8', overflow: 'hidden' }}>
        {categories.map((cat, i) => (
          <div key={cat.id} style={{
            display: 'flex', alignItems: 'flex-end', gap: 10, padding: '16px 18px',
            borderBottom: i < categories.length - 1 ? '1px solid #F5F0EB' : 'none', flexWrap: 'wrap',
            opacity: cat.is_visible ? 1 : 0.55,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => move(cat.id, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: '#B0A098', fontSize: 12, padding: 2 }}>▲</button>
              <button onClick={() => move(cat.id, 1)} disabled={i === categories.length - 1} style={{ background: 'none', border: 'none', cursor: i === categories.length - 1 ? 'default' : 'pointer', color: '#B0A098', fontSize: 12, padding: 2 }}>▼</button>
            </div>

            <div style={{ flex: '1 1 160px', minWidth: 160 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Name (shown on site)</label>
              <input style={inp} value={cat.name} onChange={e => update(cat.id, 'name', e.target.value)} />
            </div>

            <div style={{ flex: '1 1 140px', minWidth: 140 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Slug (internal)</label>
              <input style={{ ...inp, fontFamily: 'monospace' }} value={cat.slug} onChange={e => update(cat.id, 'slug', slugify(e.target.value))} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E', paddingBottom: 8 }}>
              <input type="checkbox" checked={cat.is_visible} onChange={async e => {
                const visible = e.target.checked
                update(cat.id, 'is_visible', visible)
                const { error } = await supabase.from('categories').update({ is_visible: visible }).eq('id', cat.id)
                flash(error ? 'Error: ' + error.message : (visible ? 'Now visible on site' : 'Hidden from site'))
              }} style={{ accentColor: '#C84B0F' }} />
              Visible
            </label>

            <button onClick={() => deleteCategory(cat.id)} style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Delete
            </button>
            <button onClick={() => save(cat)} disabled={saving === cat.id} style={{ padding: '8px 16px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === cat.id ? 0.6 : 1, fontFamily: 'inherit' }}>
              {saving === cat.id ? 'Saving…' : 'Save'}
            </button>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 15 }}>No categories yet</div>
          <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Click "+ Add Category" to create your first one.</div>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#B0A098', marginTop: 16, lineHeight: 1.6 }}>
        "Visible" controls whether the category's tab shows up on the homepage menu. Hidden categories still exist for organizing meals in the admin, but won't show to customers. Drag order with the ▲▼ buttons — it matches the tab order on the site.
      </p>
    </div>
  )
}
