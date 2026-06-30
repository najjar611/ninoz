'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stage = { id: string; name: string; emoji: string }
type Meal = { id: string; name: string; stage_id: string | null; meal_type: string }
type Category = { id: string; name: string; slug: string; position: number }
type Entry = { id: string; stage_id: string; meal_id: string; meal_type: string }

// Use local calendar date, not toISOString() (which is UTC and can land on
// the wrong day depending on timezone/time of day), so the admin's date
// picker matches the customer dashboard's local "tomorrow".
function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DailyMenuAdmin() {
  const supabase = createClient()
  const [stages, setStages] = useState<Stage[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [date, setDate] = useState(tomorrowISO())
  const [selections, setSelections] = useState<Record<string, string>>({}) // key: `${stageId}:${categorySlug}` -> mealId
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  useEffect(() => { loadForDate(date) }, [date])

  async function load() {
    const [s, m, c] = await Promise.all([
      supabase.from('stages').select('id,name,emoji').eq('is_active', true).order('position'),
      supabase.from('meals').select('id,name,stage_id,meal_type').eq('is_active', true),
      supabase.from('categories').select('id,name,slug,position').order('position'),
    ])
    setStages(s.data || [])
    setMeals(m.data || [])
    setCategories(c.data || [])
    setLoading(false)
  }

  async function loadForDate(d: string) {
    const { data } = await supabase.from('daily_menu').select('id,stage_id,meal_id,meal_type').eq('menu_date', d)
    const map: Record<string, string> = {}
    ;(data as Entry[] || []).forEach(e => { map[`${e.stage_id}:${e.meal_type}`] = e.meal_id })
    setSelections(map)
  }

  function setMealFor(stageId: string, categorySlug: string, mealId: string) {
    setSelections(prev => ({ ...prev, [`${stageId}:${categorySlug}`]: mealId }))
  }

  async function save() {
    setSaving(true)
    setMsg('')
    const rows = Object.entries(selections).filter(([, mealId]) => mealId).map(([key, mealId]) => {
      const [stageId, categorySlug] = key.split(':')
      return { stage_id: stageId, menu_date: date, meal_id: mealId, meal_type: categorySlug }
    })
    const { error } = await supabase.from('daily_menu').upsert(rows, { onConflict: 'stage_id,menu_date,meal_type' })
    setSaving(false)
    setMsg(error ? 'Error: ' + error.message : 'Saved!')
  }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>Daily Menu</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>Pick what each stage gets for each meal time on a given day. Subscribers will see this on their dashboard as "tomorrow's meal".</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 14, fontFamily: 'inherit' }} />
      </div>

      {categories.length === 0 && (
        <div style={{ fontSize: 13, color: '#DC2626', marginBottom: 16 }}>No categories found — add meal categories (Breakfast, Lunch, Dinner, Snack) under Content → Categories first.</div>
      )}

      {stages.map(s => (
        <div key={s.id} style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1C1C1A', marginBottom: 10 }}>{s.emoji} {s.name}</div>
          {categories.map(c => {
            const stageMeals = meals.filter(m => m.stage_id === s.id && m.meal_type === c.slug)
            return (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A7068', marginBottom: 4 }}>{c.name}</label>
                <select
                  value={selections[`${s.id}:${c.slug}`] || ''}
                  onChange={e => setMealFor(s.id, c.slug, e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, fontFamily: 'inherit' }}
                >
                  <option value="">— No meal selected —</option>
                  {stageMeals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {stageMeals.length === 0 && <div style={{ fontSize: 11.5, color: '#B0A098', marginTop: 4 }}>No "{c.name}" meals tagged to this stage yet — add some under Meals.</div>}
              </div>
            )
          })}
        </div>
      ))}

      {msg && <div style={{ fontSize: 13, color: msg.startsWith('Error') ? '#DC2626' : '#2D6A4F', marginBottom: 12 }}>{msg}</div>}
      <button onClick={save} disabled={saving} style={{ padding: '11px 24px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save Menu'}
      </button>
    </div>
  )
}
