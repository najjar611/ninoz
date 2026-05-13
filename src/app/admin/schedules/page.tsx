// ════════════════════════════════════════════════════════════
// ADMIN SCHEDULES PAGE
// Edit weekly meal schedules — flexible days (add/remove)
// Each day has image upload for meal photo
// Switch between plans using the selector
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type PlanDetail = { id: string; stage: string; plan_number: number; name: string }
type DaySchedule = {
  id: string; plan_id: string; day: string; day_number: number
  breakfast: string; lunch: string; dinner: string; image_url?: string | null
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MEAL_COLORS = { breakfast: '#E8834A', lunch: '#4A7C59', dinner: '#7B5EA7' }
const MEAL_BG = { breakfast: '#FFF0EA', lunch: '#E8F5EE', dinner: '#F0ECF9' }

export default function SchedulesPage() {
  const supabase = createClient()
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [plans, setPlans] = useState<PlanDetail[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  useEffect(() => { loadPlans() }, [])
  useEffect(() => { if (selectedPlan) loadSchedule(selectedPlan) }, [selectedPlan])

  async function loadPlans() {
    setLoading(true)
    const { data } = await supabase.from('plan_details').select('id, stage, plan_number, name').order('stage').order('plan_number')
    if (data) {
      setPlans(data)
      if (data.length > 0) setSelectedPlan(data[0].id)
    }
    setLoading(false)
  }

  async function loadSchedule(planId: string) {
    const { data } = await supabase.from('weekly_schedules').select('*').eq('plan_id', planId).order('day_number')
    if (data) setSchedule(data)
  }

  function flash(text: string, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  // ── SAVE ONE DAY ──
  async function saveDay(day: DaySchedule) {
    setSaving(day.id)
    await supabase.from('weekly_schedules').update({
      breakfast: day.breakfast, lunch: day.lunch, dinner: day.dinner,
    }).eq('id', day.id)
    setSaving(null)
    flash('Day saved ✓')
  }

  // ── SAVE ALL DAYS ──
  async function saveAll() {
    setSavingAll(true)
    for (const day of schedule) {
      await supabase.from('weekly_schedules').update({
        breakfast: day.breakfast, lunch: day.lunch, dinner: day.dinner,
      }).eq('id', day.id)
    }
    setSavingAll(false)
    flash('All days saved ✓')
  }

  // ── ADD A DAY ──
  async function addDay() {
    const nextNum = schedule.length + 1
    if (nextNum > 7) { flash('Maximum 7 days', 'error'); return }
    const dayName = DAY_NAMES[nextNum - 1] || `Day ${nextNum}`
    const { data } = await supabase.from('weekly_schedules').insert({
      plan_id: selectedPlan, day: dayName, day_number: nextNum,
      breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name',
    }).select().single()
    if (data) setSchedule([...schedule, data])
    flash('Day added ✓')
  }

  // ── REMOVE LAST DAY ──
  async function removeLastDay() {
    if (schedule.length === 0) return
    if (!confirm('Remove the last day from this schedule?')) return
    const lastDay = schedule[schedule.length - 1]
    await supabase.from('weekly_schedules').delete().eq('id', lastDay.id)
    setSchedule(schedule.slice(0, -1))
    flash('Day removed')
  }

  // ── UPLOAD IMAGE FOR DAY ──
  async function uploadDayImage(dayId: string, file: File) {
    if (!file.type.startsWith('image/')) { flash('Please upload an image file', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { flash('Image must be under 5MB', 'error'); return }
    setUploading(dayId)
    const ext = file.name.split('.').pop()
    const fileName = `day-${dayId}.${ext}`
    const { error } = await supabase.storage.from('meals').upload(fileName, file, { upsert: true })
    if (error) { flash(`Upload failed: ${error.message}`, 'error'); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('meals').getPublicUrl(fileName)
    // Store image_url in the day record if column exists, otherwise just show it locally
    setSchedule(schedule.map(d => d.id === dayId ? { ...d, image_url: publicUrl } : d))
    setUploading(null)
    flash('Meal photo uploaded ✓')
  }

  const inp = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #E8D5C4', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }
  const btnStyle = (color: string, small = false) => ({
    padding: small ? '5px 10px' : '8px 16px', borderRadius: '7px', border: 'none',
    background: color, color: 'white', cursor: 'pointer',
    fontSize: small ? '11px' : '12px', fontWeight: 600 as const,
  })

  const selectedPlanInfo = plans.find(p => p.id === selectedPlan)

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Weekly Schedules</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>Edit meals day by day. Add or remove days. Upload meal photos.</p>
        </div>
        {msg.text && (
          <div style={{ background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2', color: msg.type === 'success' ? '#2D6A4F' : '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Plan selector */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#C9A98A', marginBottom: '8px' }}>SELECT PLAN</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {plans.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
              padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 500,
              background: selectedPlan === plan.id ? '#1C1C1A' : '#F5F3EE',
              color: selectedPlan === plan.id ? 'white' : '#7A7068',
            }}>
              {plan.stage === 'stage1' ? '🍼' : plan.stage === 'stage2' ? '🥄' : '🥘'} {plan.name}
            </button>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      {schedule.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1A' }}>
            {selectedPlanInfo?.name} — {schedule.length} day{schedule.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={removeLastDay} style={btnStyle('#7A7068', true)}>− Remove Last Day</button>
            <button onClick={addDay} disabled={schedule.length >= 7} style={btnStyle('#4A7C59', true)}>+ Add Day</button>
            <button onClick={saveAll} disabled={savingAll} style={btnStyle('#E8834A')}>
              {savingAll ? 'Saving...' : '💾 Save All'}
            </button>
          </div>
        </div>
      )}

      {/* Day cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {schedule.map(day => (
          <div key={day.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>

            {/* Day header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#FFF0EA', color: '#E8834A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {day.day_number}
                </div>
                <input
                  value={day.day}
                  onChange={e => setSchedule(schedule.map(d => d.id === day.id ? { ...d, day: e.target.value } : d))}
                  style={{ fontWeight: 700, fontSize: '14px', color: '#1C1C1A', border: 'none', outline: 'none', background: 'transparent', width: '100px' }}
                />
              </div>
              {/* Image upload for this day */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={el => { fileRefs.current[day.id] = el }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadDayImage(day.id, f) }}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileRefs.current[day.id]?.click()}
                  style={{ ...btnStyle(uploading === day.id ? '#C9A98A' : '#7B5EA7', true), display: 'flex', alignItems: 'center', gap: '4px' }}
                  disabled={uploading === day.id}
                >
                  {day.image_url ? '🔄' : '📤'} {uploading === day.id ? '...' : 'Photo'}
                </button>
              </div>
            </div>

            {/* Meal photo preview */}
            {day.image_url && (
              <div style={{ marginBottom: '10px' }}>
                <img src={day.image_url} alt={day.day} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
            )}

            {/* Meals */}
            {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
              <div key={meal} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '50px', background: MEAL_BG[meal], color: MEAL_COLORS[meal], marginBottom: '3px' }}>
                  {meal}
                </div>
                <input
                  value={day[meal]}
                  onChange={e => setSchedule(schedule.map(d => d.id === day.id ? { ...d, [meal]: e.target.value } : d))}
                  style={inp}
                  placeholder={`${meal} meal name`}
                />
              </div>
            ))}

            <button onClick={() => saveDay(day)} style={{ ...btnStyle('#E8834A'), width: '100%', marginTop: '6px' }}>
              {saving === day.id ? 'Saving...' : 'Save Day'}
            </button>
          </div>
        ))}
      </div>

      {schedule.length === 0 && selectedPlan && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#C9A98A', fontSize: '14px', background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)' }}>
          No days in this schedule yet. Click "+ Add Day" to start.
          <div style={{ marginTop: '12px' }}>
            <button onClick={addDay} style={btnStyle('#4A7C59')}>+ Add Day</button>
          </div>
        </div>
      )}
    </div>
  )
}
