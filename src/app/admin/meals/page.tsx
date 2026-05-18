'use client'

// ══════════════════════════════════════════════════════════
// /admin/meals/page.tsx — v5
// Adds nutrition fields: Weight, Protein, Carbs, Fiber, Allergens
// All fields editable, saved to Supabase
// ══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Meal = {
  id: string
  name: string
  description: string
  meal_type: 'breakfast' | 'lunch' | 'dinner'
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

type Stage = {
  id: string
  name: string
  age_range: string
}

const EMPTY_MEAL: Omit<Meal, 'id'> = {
  name: 'New Meal',
  description: '',
  meal_type: 'breakfast',
  stage_id: '',
  image_url: null,
  allergens: '',
  weight_g: '',
  protein_g: '',
  carbs_g: '',
  fiber_g: '',
  tag: '',
  is_active: true,
  position: 0,
}

export default function MealsAdmin() {
  const supabase = createClient()
  const [meals, setMeals] = useState<Meal[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Meal>>({})
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from('meals').select('*').order('stage_id').order('meal_type').order('position'),
      supabase.from('stages').select('id, name, age_range').order('position'),
    ])
    setMeals(m || [])
    setStages(s || [])
    if (s && s.length > 0 && !editData.stage_id) {
      setEditData(prev => ({ ...prev, stage_id: s[0].id }))
    }
    setLoading(false)
  }

  function startEdit(meal: Meal) {
    setEditingId(meal.id)
    setEditData({ ...meal })
  }

  function cancelEdit() { setEditingId(null); setEditData({}) }

  async function saveEdit() {
    if (!editingId || !editData) return
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
    const { data, error } = await supabase
      .from('meals')
      .insert({ ...EMPTY_MEAL, stage_id: stageId, position: meals.length + 1 })
      .select()
      .single()
    if (!error && data) {
      setMeals(prev => [...prev, data])
      startEdit(data)
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
    const { error: upErr } = await supabase.storage.from('meals').upload(path, file, { upsert: true })
    if (upErr) { flash('Upload failed: ' + upErr.message); setUploadingId(null); return }
    const { data: urlData } = supabase.storage.from('meals').getPublicUrl(path)
    const url = urlData.publicUrl
    await supabase.from('meals').update({ image_url: url }).eq('id', mealId)
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, image_url: url } : m))
    if (editingId === mealId) setEditData(prev => ({ ...prev, image_url: url }))
    setUploadingId(null)
    flash('Photo uploaded!')
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const inp = {
    width: '100%', padding: '8px 11px', borderRadius: '8px',
    border: '1.5px solid #EDE8E0', fontSize: '13px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  }
  const smallInp = { ...inp, padding: '6px 10px', fontSize: '12px' }

  const filtered = meals.filter(m => {
    if (stageFilter !== 'all' && m.stage_id !== stageFilter) return false
    if (typeFilter !== 'all' && m.meal_type !== typeFilter) return false
    return true
  })

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading meals...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>Meals</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>{meals.length} total meals across all stages</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{msg}</div>}
          <button onClick={addMeal} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Add Meal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ ...smallInp, width: 'auto' }}>
          <option value="all">All Stages</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...smallInp, width: 'auto' }}>
          <option value="all">All Types</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <span style={{ fontSize: 12, color: '#7A7068', alignSelf: 'center' }}>
          Showing {filtered.length} meals
        </span>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(meal => {
          const isEditing = editingId === meal.id
          const stageName = stages.find(s => s.id === meal.stage_id)?.name || meal.stage_id

          return (
            <div key={meal.id} style={{
              background: 'white',
              borderRadius: 14,
              border: isEditing ? '2px solid #C84B0F' : '1.5px solid rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              {/* Collapsed row */}
              {!isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                  {/* Thumb */}
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: '#FAF5EE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {meal.image_url ? (
                      <img src={meal.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '🍽️'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1C1C1A', fontSize: 14, marginBottom: 2 }}>{meal.name}</div>
                    <div style={{ fontSize: 11, color: '#7A7068' }}>
                      {stageName} · {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      {!meal.is_active && ' · 🔴 Inactive'}
                    </div>
                    {/* Nutrition preview */}
                    {meal.weight_g && (
                      <div style={{ fontSize: 11, color: '#C84B0F', marginTop: 2 }}>
                        {meal.weight_g && `${meal.weight_g} · `}
                        {meal.protein_g && `P:${meal.protein_g} · `}
                        {meal.carbs_g && `C:${meal.carbs_g} · `}
                        {meal.fiber_g && `F:${meal.fiber_g}`}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(meal)} style={{ padding: '6px 14px', background: '#FAF5EE', color: '#2C1A0E', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteMeal(meal.id)} style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ) : (
                /* Expanded edit form */
                <div style={{ padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1A', marginBottom: 16 }}>Editing: {meal.name}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Name</label>
                      <input style={inp} value={editData.name || ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Tag (optional)</label>
                      <input style={inp} placeholder="e.g. Popular, New" value={editData.tag || ''} onChange={e => setEditData(p => ({ ...p, tag: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Description</label>
                    <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={editData.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
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
                      <select style={inp} value={editData.meal_type || 'breakfast'} onChange={e => setEditData(p => ({ ...p, meal_type: e.target.value as any }))}>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                      </select>
                    </div>
                  </div>

                  {/* Nutrition fields */}
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#C84B0F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🍊 Nutrition Info</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {[
                        { key: 'weight_g', label: 'Weight' },
                        { key: 'protein_g', label: 'Protein' },
                        { key: 'carbs_g', label: 'Carbs' },
                        { key: 'fiber_g', label: 'Fiber' },
                      ].map(field => (
                        <div key={field.key}>
                          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>{field.label}</label>
                          <input
                            style={smallInp}
                            placeholder="e.g. 240g"
                            value={(editData as any)[field.key] || ''}
                            onChange={e => setEditData(p => ({ ...p, [field.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Allergens</label>
                    <input style={inp} placeholder="e.g. Eggs, Dairy" value={editData.allergens || ''} onChange={e => setEditData(p => ({ ...p, allergens: e.target.value }))} />
                  </div>

                  {/* Photo upload */}
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {editData.image_url && (
                      <img src={editData.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
                    )}
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingId === meal.id}
                      style={{ padding: '7px 14px', background: '#FAF5EE', border: '1.5px solid #EDE8E0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#2C1A0E' }}
                    >
                      {uploadingId === meal.id ? 'Uploading...' : '📷 Upload Photo'}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) uploadImage(meal.id, file)
                      }}
                    />
                  </div>

                  {/* Active toggle */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                      <input
                        type="checkbox"
                        checked={editData.is_active ?? true}
                        onChange={e => setEditData(p => ({ ...p, is_active: e.target.checked }))}
                        style={{ accentColor: '#C84B0F' }}
                      />
                      Active (shown on menu page)
                    </label>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={cancelEdit} style={{ padding: '9px 18px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#7A7068' }}>
                      Cancel
                    </button>
                    <button onClick={saveEdit} disabled={saving} style={{ padding: '9px 20px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                      {saving ? 'Saving...' : 'Save Meal'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#C9A98A' }}>
          <div style={{ fontSize: 40 }}>🍽️</div>
          <p style={{ marginTop: 8 }}>No meals yet. Add your first meal above.</p>
        </div>
      )}
    </div>
  )
}
