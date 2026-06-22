'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Meal = {
  id: string; name: string; description: string; meal_type: string
  image_url: string | null; allergens: string; weight_g: string
  protein_g: string; carbs_g: string; fiber_g: string; is_active?: boolean; position?: number
  stage_id: string | null
}

type Stage = { id: string; name: string }
type Category = { id: string; name: string; slug: string; is_visible: boolean; position: number }

export default function MealsAdmin() {
  const supabase = createClient()
  const [meals, setMeals] = useState<Meal[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const [mealsRes, stagesRes, categoriesRes] = await Promise.all([
      supabase.from('meals').select('*').order('position').order('name'),
      supabase.from('stages').select('id,name').order('id'),
      supabase.from('categories').select('*').order('position'),
    ])
    setMeals(mealsRes.data || [])
    setStages(stagesRes.data || [])
    setCategories(categoriesRes.data || [])
    setLoading(false)
  }

  function update(id: string, key: keyof Meal, val: any) {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, [key]: val } : m))
  }

  async function save(meal: Meal) {
    setSaving(meal.id)
    const { error } = await supabase.from('meals').update({
      name: meal.name, description: meal.description, meal_type: meal.meal_type,
      allergens: meal.allergens, weight_g: meal.weight_g, protein_g: meal.protein_g,
      carbs_g: meal.carbs_g, fiber_g: meal.fiber_g, is_active: meal.is_active,
      stage_id: meal.stage_id,
    }).eq('id', meal.id)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  async function uploadImage(id: string, file: File) {
    setUploading(id)
    const ext = file.name.split('.').pop()
    const path = `meal-${id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('meals').upload(path, file, { upsert: true })
    if (error) { flash('Upload failed'); setUploading(null); return }
    const { data: urlData } = supabase.storage.from('meals').getPublicUrl(path)
    await supabase.from('meals').update({ image_url: urlData.publicUrl }).eq('id', id)
    update(id, 'image_url', urlData.publicUrl)
    setUploading(null)
    flash('Photo uploaded!')
  }

  async function addMeal() {
    if (!stages.length) { flash('Error: add a stage first under "Stages"'); return }
    if (!categories.length) { flash('Error: add a category first under "Categories"'); return }
    const newType = filter === 'all' ? categories[0].slug : filter
    const { data, error } = await supabase.from('meals').insert({
      name: 'New Meal', description: '', meal_type: newType,
      allergens: '', weight_g: 0, protein_g: 0, carbs_g: 0, fiber_g: 0,
      is_active: true, position: meals.length + 1, stage_id: stages[0].id,
    }).select().single()
    if (error) { flash('Error: ' + error.message); return }
    if (data) setMeals(prev => [...prev, data])
  }

  async function deleteMeal(id: string) {
    if (!confirm('Delete this meal?')) return
    await supabase.from('meals').delete().eq('id', id)
    setMeals(prev => prev.filter(m => m.id !== id))
    flash('Deleted')
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const displayed = filter === 'all' ? meals : meals.filter(m => m.meal_type === filter)
  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading meals…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Meals</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Manage your menu. {meals.length} meal{meals.length !== 1 ? 's' : ''} total.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={addMeal} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Meal
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{
          padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
          background: filter === 'all' ? '#C84B0F' : '#F2EDE8',
          color: filter === 'all' ? 'white' : '#5A5048',
        }}>all</button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setFilter(c.slug)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700,
            background: filter === c.slug ? '#C84B0F' : '#F2EDE8',
            color: filter === c.slug ? 'white' : '#5A5048',
          }}>{c.name}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 20 }}>
        {displayed.map(meal => (
          <div key={meal.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', opacity: meal.is_active === false ? 0.6 : 1 }}>
            <div style={{ height: 160, background: '#F5EDE0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
              {meal.image_url
                ? <img src={meal.image_url} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🍽️'}
              <button
                onClick={() => fileRefs.current[meal.id]?.click()}
                disabled={uploading === meal.id}
                style={{ position: 'absolute', bottom: 8, right: 8, padding: '5px 10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {uploading === meal.id ? 'Uploading…' : '📷 Photo'}
              </button>
              <input type="file" accept="image/*" ref={el => { fileRefs.current[meal.id] = el }}
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(meal.id, f) }} />
            </div>

            <div style={{ padding: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Name</label>
              <input style={inp} value={meal.name} onChange={e => update(meal.id, 'name', e.target.value)} />

              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Description</label>
              <textarea style={{ ...inp, height: 60, resize: 'vertical' }} value={meal.description} onChange={e => update(meal.id, 'description', e.target.value)} />

              <div className="meal-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Type</label>
                  <select style={{ ...inp, marginBottom: 0 }} value={meal.meal_type} onChange={e => update(meal.id, 'meal_type', e.target.value)}>
                    {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Weight (g)</label>
                  <input style={{ ...inp, marginBottom: 0 }} value={meal.weight_g} onChange={e => update(meal.id, 'weight_g', e.target.value)} placeholder="150" />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Stage</label>
                <select style={{ ...inp, marginBottom: 0 }} value={meal.stage_id ?? ''} onChange={e => update(meal.id, 'stage_id', e.target.value)}>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="meal-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                {[
                  { label: 'Protein (g)', key: 'protein_g' as keyof Meal },
                  { label: 'Carbs (g)', key: 'carbs_g' as keyof Meal },
                  { label: 'Fiber (g)', key: 'fiber_g' as keyof Meal },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>{f.label}</label>
                    <input style={{ ...inp, marginBottom: 0 }} value={String(meal[f.key] ?? '')} onChange={e => update(meal.id, f.key, e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Allergens</label>
                <input style={{ ...inp, marginBottom: 0 }} value={meal.allergens} onChange={e => update(meal.id, 'allergens', e.target.value)} placeholder="e.g. dairy, gluten" />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E', margin: '12px 0' }}>
                <input type="checkbox" checked={meal.is_active !== false} onChange={e => update(meal.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                Active (visible on site)
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => deleteMeal(meal.id)} style={{ padding: '7px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                <button onClick={() => save(meal)} disabled={saving === meal.id} style={{ flex: 1, padding: '7px 16px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === meal.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {saving === meal.id ? 'Saving…' : 'Save Meal'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍼</div>
          <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 15 }}>No meals yet</div>
          <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Click "+ Add Meal" to add your first meal.</div>
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          .meal-2col, .meal-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
