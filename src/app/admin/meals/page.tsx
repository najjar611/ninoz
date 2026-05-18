'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stage = { id: string; name: string; age_range: string }
type MealType = { id: string; name: string; stage_id: string; position: number }
type Meal = {
  id: string; meal_type_id: string; stage_id: string
  name: string; description: string; ingredients: string
  allergens: string; image_url: string | null; calories: string
  weight: string; protein: string; carbs: string; fiber: string
  position: number; is_active: boolean
}

export default function MealsPage() {
  const supabase = createClient()
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [stages, setStages] = useState<Stage[]>([])
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [selectedStage, setSelectedStage] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [stagesRes, typesRes, mealsRes] = await Promise.all([
      supabase.from('stages').select('id, name, age_range').order('position'),
      supabase.from('meal_types').select('*').order('position'),
      supabase.from('meals').select('*').order('position'),
    ])
    if (stagesRes.data) { setStages(stagesRes.data); if (stagesRes.data.length > 0) setSelectedStage(stagesRes.data[0].id) }
    if (typesRes.data) setMealTypes(typesRes.data)
    if (mealsRes.data) setMeals(mealsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    const typesForStage = mealTypes.filter(t => t.stage_id === selectedStage)
    if (typesForStage.length > 0) setSelectedType(typesForStage[0].id)
  }, [selectedStage, mealTypes])

  function flash(text: string, type = 'success') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 3000) }

  async function saveMeal(meal: Meal) {
    setSaving(meal.id)
    await supabase.from('meals').update({
      name: meal.name, description: meal.description,
      ingredients: meal.ingredients, allergens: meal.allergens,
      calories: meal.calories, weight: meal.weight,
      protein: meal.protein, carbs: meal.carbs, fiber: meal.fiber,
      is_active: meal.is_active,
    }).eq('id', meal.id)
    setSaving(null)
    flash('Saved ✓')
  }

  async function addMeal() {
    if (!selectedType || !selectedStage) return
    const { data } = await supabase.from('meals').insert({
      meal_type_id: selectedType, stage_id: selectedStage,
      name: 'New Meal', description: '', ingredients: '',
      allergens: '', calories: '', weight: '', protein: '', carbs: '', fiber: '',
      position: meals.filter(m => m.meal_type_id === selectedType).length + 1,
    }).select().single()
    if (data) { setMeals([...meals, data]); setExpanded(data.id) }
    flash('Added ✓')
  }

  async function deleteMeal(id: string) {
    if (!confirm('Delete this meal?')) return
    await supabase.from('meals').delete().eq('id', id)
    setMeals(meals.filter(m => m.id !== id))
  }

  async function uploadImage(mealId: string, file: File) {
    if (file.size > 5 * 1024 * 1024) { flash('Max 5MB', 'error'); return }
    setUploading(mealId)
    const ext = file.name.split('.').pop()
    const { error } = await supabase.storage.from('meals').upload(`meal-${mealId}.${ext}`, file, { upsert: true })
    if (error) { flash(error.message, 'error'); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('meals').getPublicUrl(`meal-${mealId}.${ext}`)
    await supabase.from('meals').update({ image_url: publicUrl }).eq('id', mealId)
    setMeals(meals.map(m => m.id === mealId ? { ...m, image_url: publicUrl } : m))
    setUploading(null)
    flash('Image uploaded ✓')
  }

  async function saveMealTypeName(typeId: string, name: string) {
    await supabase.from('meal_types').update({ name }).eq('id', typeId)
    setMealTypes(mealTypes.map(t => t.id === typeId ? { ...t, name } : t))
    flash('Tab name saved ✓')
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#C9A98A', marginBottom: '4px' }
  const btn = (color: string, small = false) => ({ padding: small ? '5px 10px' : '8px 16px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: small ? '11px' : '12px', fontWeight: 600 as const })

  const stageMealTypes = mealTypes.filter(t => t.stage_id === selectedStage)
  const visibleMeals = meals.filter(m => m.meal_type_id === selectedType).sort((a, b) => a.position - b.position)

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Meal Manager</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>Add meals with photos, nutrition info, and allergens.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg.text && <div style={{ background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2', color: msg.type === 'success' ? '#2D6A4F' : '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg.text}</div>}
          <button onClick={addMeal} style={btn('#4A7C59')}>+ Add Meal</button>
        </div>
      </div>

      {/* Stage selector */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '14px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#C9A98A', marginBottom: '8px' }}>STAGE</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {stages.map(stage => (
            <button key={stage.id} onClick={() => setSelectedStage(stage.id)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: selectedStage === stage.id ? '#1C1C1A' : '#F5F3EE', color: selectedStage === stage.id ? 'white' : '#7A7068' }}>
              {stage.name}
            </button>
          ))}
        </div>
      </div>

      {/* Meal type tabs */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '14px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#C9A98A', marginBottom: '8px' }}>CATEGORY — click to switch, edit name inline</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {stageMealTypes.map(mt => (
            <div key={mt.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setSelectedType(mt.id)} style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid', cursor: 'pointer', fontSize: '12px', fontWeight: 600, borderColor: selectedType === mt.id ? '#E8834A' : 'rgba(0,0,0,0.1)', background: selectedType === mt.id ? '#FFF0EA' : 'white', color: selectedType === mt.id ? '#E8834A' : '#7A7068' }}>
                {mt.name}
              </button>
              {selectedType === mt.id && (
                <input defaultValue={mt.name} onBlur={e => saveMealTypeName(mt.id, e.target.value)}
                  style={{ ...inp, width: '110px', fontSize: '12px', padding: '6px 10px' }} placeholder="Tab name" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9A98A', marginBottom: '12px' }}>
        {visibleMeals.length} meals
      </div>

      {visibleMeals.map(meal => (
        <div key={meal.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '10px', overflow: 'hidden' }}>
          <div onClick={() => setExpanded(expanded === meal.id ? null : meal.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#F5F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {meal.image_url ? <img src={meal.image_url} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1C1C1A' }}>{meal.name}</div>
              <div style={{ fontSize: '12px', color: '#7A7068' }}>{meal.calories || 'No nutrition info'}</div>
            </div>
            <div style={{ color: '#C9A98A', fontSize: '14px' }}>{expanded === meal.id ? '▲' : '▼'}</div>
          </div>

          {expanded === meal.id && (
            <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ paddingTop: '16px' }}>
                {/* Image upload */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={lbl}>Meal Photo</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '72px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E8D5C4', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3EE', fontSize: '20px', flexShrink: 0 }}>
                      {meal.image_url ? <img src={meal.image_url} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                    </div>
                    <div>
                      <input type="file" accept="image/*" ref={el => { fileRefs.current[meal.id] = el }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(meal.id, f) }} style={{ display: 'none' }} />
                      <button onClick={() => fileRefs.current[meal.id]?.click()} style={btn(uploading === meal.id ? '#C9A98A' : '#7B5EA7')} disabled={uploading === meal.id}>
                        {uploading === meal.id ? 'Uploading...' : '📤 Upload Photo'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Name & Calories */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div><label style={lbl}>Meal Name</label><input value={meal.name} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, name: e.target.value } : m))} style={inp} /></div>
                  <div><label style={lbl}>Calories</label><input value={meal.calories} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, calories: e.target.value } : m))} style={inp} placeholder="e.g. 120 kcal" /></div>
                </div>

                {/* Nutrition: Weight, Protein, Carbs, Fiber */}
                <div style={{ background: '#FFF8F5', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#C9A98A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nutrition Info (shown in meal popup)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><label style={lbl}>Weight</label><input value={meal.weight} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, weight: e.target.value } : m))} style={inp} placeholder="e.g. 240g" /></div>
                    <div><label style={lbl}>Protein</label><input value={meal.protein} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, protein: e.target.value } : m))} style={inp} placeholder="e.g. 8.5g" /></div>
                    <div><label style={lbl}>Carbs</label><input value={meal.carbs} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, carbs: e.target.value } : m))} style={inp} placeholder="e.g. 16g" /></div>
                    <div><label style={lbl}>Fiber</label><input value={meal.fiber} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, fiber: e.target.value } : m))} style={inp} placeholder="e.g. 3.2g" /></div>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}><label style={lbl}>Description</label><textarea value={meal.description} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, description: e.target.value } : m))} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
                <div style={{ marginBottom: '10px' }}><label style={lbl}>Ingredients</label><textarea value={meal.ingredients} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, ingredients: e.target.value } : m))} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="List all ingredients" /></div>
                <div style={{ marginBottom: '14px' }}><label style={lbl}>Allergens</label><input value={meal.allergens} onChange={e => setMeals(meals.map(m => m.id === meal.id ? { ...m, allergens: e.target.value } : m))} style={inp} placeholder="e.g. Dairy, Gluten, Nuts" /></div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveMeal(meal)} style={btn('#E8834A')}>{saving === meal.id ? 'Saving...' : 'Save Meal'}</button>
                  <button onClick={() => setMeals(meals.map(m => m.id === meal.id ? { ...m, is_active: !m.is_active } : m))} style={btn(meal.is_active ? '#4A7C59' : '#C9A98A', true)}>{meal.is_active ? '👁 Visible' : '🙈 Hidden'}</button>
                  <button onClick={() => deleteMeal(meal.id)} style={btn('#DC2626', true)}>🗑 Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {visibleMeals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#C9A98A', background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)', fontSize: '14px' }}>
          No meals yet. Click "+ Add Meal".
        </div>
      )}
    </div>
  )
}
