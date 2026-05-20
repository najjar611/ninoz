'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Meal = {
  id: string
  name: string
  description: string
  meal_type: string
  stage_id: string
  image_url: string | null
  allergens: string
  weight_g: string
  protein_g: string
  carbs_g: string
  fiber_g: string
  tag: string
  is_active: boolean
  position: number
}

type Stage = { id: string; name: string }

export default function MealsAdmin() {
  const supabase = createClient()
  const [meals, setMeals] = useState<Meal[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Meal>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [m, s] = await Promise.all([
      supabase.from('meals').select('*').order('position'),
      supabase.from('stages').select('id, name').order('position'),
    ])
    setMeals(m.data || [])
    setStages(s.data || [])
    setLoading(false)
  }

  function startEdit(meal: Meal) {
    setEditingId(meal.id)
    setEditData({ ...meal })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditData({})
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    const { error } = await supabase.from('meals').update({
      name: editData.name,
      description: editData.description,
      meal_type: editData.meal_type,
      stage_id: editData.stage_id,
      allergens: editData.allergens,
      weight_g: editData.weight_g,
      protein_g: editData.protein_g,
      carbs_g: editData.carbs_g,
      fiber_g: editData.fiber_g,
      tag: editData.tag,
      is_active: editData.is_active,
    }).eq('id', editingId)
    setSaving(false)
    if (error) { flash('Error: ' + error.message); return }
    setMeals(prev => prev.map(m => m.id === editingId ? { ...m, ...editData } as Meal : m))
    cancelEdit()
    flash('Saved!')
  }

  async function addMeal() {
    const stageId = stages[0]?.id || ''
    const { data, error } = await supabase.from('meals').insert({
      name: 'New Meal',
      description: '',
      meal_type: 'breakfast',
      stage_id: stageId,
      allergens: '',
      weight_g: '',
      protein_g: '',
      carbs_g: '',
      fiber_g: '',
      tag: '',
      is_active: true,
      position: meals.length + 1,
    }).select().single()
    if (error) { flash('Error adding meal: ' + error.message); return }
    if (data) {
      setMeals(prev => [...prev, data])
      startEdit(data)
      flash('Meal added — now edit the details below')
    }
  }

  async function deleteMeal(id: string) {
    if (!confirm('Delete this meal?')) return
    await supabase.from('meals').delete().eq('id', id)
    setMeals(prev => prev.filter(m => m.id !== id))
    if (editingId === id) cancelEdit()
    flash('Deleted')
  }

  async function uploadImage(mealId: string, file: File) {
    setUploadingId(mealId)
    const ext = file.name.split('.').pop()
    const path = `meal-${mealId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('meals').upload(path, file, { upsert: true })
    if (error) { flash('Upload failed: ' + error.message); setUploadingId(null); return }
    const { data } = supabase.storage.from('meals').getPublicUrl(path)
    await supabase.from('meals').update({ image_url: data.publicUrl }).eq('id', mealId)
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, image_url: data.publicUrl } : m))
    if (editingId === mealId) setEditData(prev => ({ ...prev, image_url: data.publicUrl }))
    setUploadingId(null)
    flash('Photo uploaded!')
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const filtered = typeFilter === 'all' ? meals : meals.filter(m => m.meal_type === typeFilter)

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading meals...</div>

  return (
    <div>
      {/* Header with Allergen Manager Jump Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Meals</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>{meals.length} total meals</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {msg && (
            <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>
          )}
          <Link href="/admin/allergens" style={{ padding: '10px 16px', background: '#F7F4F0', borderRadius: 8, textDecoration: 'none', color: '#C84B0F', fontWeight: 700, fontSize: 13 }}>
            🥕 Manage Allergens
          </Link>
          <button onClick={addMeal} style={{ padding: '10px 20px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Meal
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'breakfast', 'lunch', 'dinner'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            background: typeFilter === t ? '#C84B0F' : 'white',
            color: typeFilter === t ? 'white' : '#7A7068',
          }}>
            {t === 'all' ? `All (${meals.length})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${meals.filter(m => m.meal_type === t).length})`}
          </button>
        ))}
      </div>

      {/* Meals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(meal => {
          const isEditing = editingId === meal.id
          const stageName = stages.find(s => s.id === meal.stage_id)?.name || '—'

          return (
            <div key={meal.id} style={{
              background: 'white', borderRadius: 14,
              border: isEditing ? '2px solid #C84B0F' : '1.5px solid rgba(0,0,0,0.06)',
              overflow: 'hidden', opacity: meal.is_active ? 1 : 0.6,
            }}>
              {!isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: '#FAF5EE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden' }}>
                    {meal.image_url ? <img src={meal.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1C1C1A', fontSize: 14, marginBottom: 2 }}>{meal.name}</div>
                    <div style={{ fontSize: 11, color: '#7A7068' }}>{stageName} · {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(meal)} style={{ padding: '7px 16px', background: '#FAF5EE', color: '#2C1A0E', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => deleteMeal(meal.id)} style={{ padding: '7px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 20 }}>
                  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: '#1C1C1A', marginBottom: 18 }}>Editing: {meal.name}</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Meal Name</label>
                      <input style={inp} value={editData.name || ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Tag</label>
                      <input style={inp} value={editData.tag || ''} onChange={e => setEditData(p => ({ ...p, tag: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Description</label>
                    <textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={editData.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Stage</label>
                      <select style={inp} value={editData.stage_id || ''} onChange={e => setEditData(p => ({ ...p, stage_id: e.target.value }))}>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Meal Type</label>
                      <select style={inp} value={editData.meal_type || 'breakfast'} onChange={e => setEditData(p => ({ ...p, meal_type: e.target.value }))}>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#C84B0F', marginBottom: 8, textTransform: 'uppercase' }}>Nutrition Info</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {[{ key: 'weight_g', label: 'Weight' }, { key: 'protein_g', label: 'Protein' }, { key: 'carbs_g', label: 'Carbs' }, { key: 'fiber_g', label: 'Fiber' }].map(field => (
                        <div key={field.key}>
                          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4 }}>{field.label}</label>
                          <input style={{ ...inp, padding: '7px 10px', fontSize: 12 }} value={(editData as any)[field.key] || ''} onChange={e => setEditData(p => ({ ...p, [field.key]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingId === meal.id} style={{ padding: '8px 16px', background: '#FAF5EE', border: '1.5px solid #EDE8E0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#2C1A0E' }}>
                      {uploadingId === meal.id ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(meal.id, f) }} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                      <input type="checkbox" checked={editData.is_active ?? true} onChange={e => setEditData(p => ({ ...p, is_active: e.target.checked }))} style={{ accentColor: '#C84B0F' }} />
                      Active (shown in menu)
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={cancelEdit} style={{ padding: '10px 20px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#7A7068', fontFamily: 'inherit' }}>Cancel</button>
                    <button type="button" onClick={saveEdit} disabled={saving} style={{ padding: '10px 24px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Save Meal'}</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}