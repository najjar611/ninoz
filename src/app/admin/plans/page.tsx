// ════════════════════════════════════════════════════════════
// ADMIN STAGES & PLANS PAGE
// Manage all stages and their plans:
//   - Edit stage card (homepage)
//   - Add / remove plans per stage
//   - Edit plan name, description, price, tag
//   - Upload image directly on each plan card
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type PlanDetail = {
  id: string; stage: string; plan_number: number
  name: string; description: string; price: string
  tag: string | null; tag_color: string; image_url: string | null; is_active: boolean
}
type StageCard = {
  id: string; stage: string; title: string; age_range: string
  description: string; tag: string | null; tag_color: string
}

export default function PlansPage() {
  const supabase = createClient()
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [tab, setTab] = useState<'stage1' | 'stage2' | 'stage3'>('stage1')
  const [plans, setPlans] = useState<PlanDetail[]>([])
  const [stageCards, setStageCards] = useState<StageCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [p, s] = await Promise.all([
      supabase.from('plan_details').select('*').order('stage').order('plan_number'),
      supabase.from('stage_cards').select('*').order('position'),
    ])
    if (p.data) setPlans(p.data)
    if (s.data) setStageCards(s.data)
    setLoading(false)
  }

  function flash(text: string, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  // ── SAVE PLAN ──
  async function savePlan(plan: PlanDetail) {
    setSaving(plan.id)
    await supabase.from('plan_details').update({
      name: plan.name, description: plan.description,
      price: plan.price, tag: plan.tag || null,
      tag_color: plan.tag_color, image_url: plan.image_url,
    }).eq('id', plan.id)
    setSaving(null)
    flash('Plan saved ✓')
  }

  // ── UPLOAD IMAGE FOR PLAN ──
  async function uploadPlanImage(planId: string, file: File) {
    if (!file.type.startsWith('image/')) { flash('Please upload an image file', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { flash('Image must be under 5MB', 'error'); return }
    setUploading(planId)
    const ext = file.name.split('.').pop()
    const fileName = `plan-${planId}.${ext}`
    const { error } = await supabase.storage.from('plans').upload(fileName, file, { upsert: true })
    if (error) { flash(`Upload failed: ${error.message}`, 'error'); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('plans').getPublicUrl(fileName)
    await supabase.from('plan_details').update({ image_url: publicUrl }).eq('id', planId)
    setPlans(plans.map(p => p.id === planId ? { ...p, image_url: publicUrl } : p))
    setUploading(null)
    flash('Image uploaded ✓')
  }

  // ── ADD NEW PLAN ──
  async function addPlan() {
    const stagePlans = plans.filter(p => p.stage === tab)
    const nextNumber = stagePlans.length + 1
    const { data } = await supabase.from('plan_details').insert({
      stage: tab, plan_number: nextNumber,
      name: `Plan ${nextNumber}`,
      description: 'Plan description here',
      price: tab === 'stage1' ? '299 SAR / week' : tab === 'stage2' ? '349 SAR / week' : '399 SAR / week',
      tag: null, tag_color: '#E8834A',
    }).select().single()
    if (data) {
      setPlans([...plans, data])
      // Create 5-day schedule for this plan
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday']
      for (let i = 0; i < days.length; i++) {
        await supabase.from('weekly_schedules').insert({
          plan_id: data.id, day: days[i], day_number: i + 1,
          breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name',
        })
      }
      flash('New plan added ✓')
    }
  }

  // ── DELETE PLAN ──
  async function deletePlan(planId: string) {
    if (!confirm('Delete this plan? This will also delete its weekly schedule.')) return
    await supabase.from('weekly_schedules').delete().eq('plan_id', planId)
    await supabase.from('plan_details').delete().eq('id', planId)
    setPlans(plans.filter(p => p.id !== planId))
    flash('Plan deleted')
  }

  // ── SAVE STAGE CARD ──
  async function saveStageCard(card: StageCard) {
    setSaving(card.id)
    await supabase.from('stage_cards').update({
      title: card.title, age_range: card.age_range,
      description: card.description, tag: card.tag || null, tag_color: card.tag_color,
    }).eq('id', card.id)
    setSaving(null)
    flash('Stage card saved ✓')
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#C9A98A', marginBottom: '4px' }
  const cardStyle = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '12px' }
  const btnStyle = (color: string, small = false) => ({
    padding: small ? '6px 12px' : '8px 16px', borderRadius: '7px', border: 'none',
    background: color, color: 'white', cursor: 'pointer',
    fontSize: small ? '11px' : '12px', fontWeight: 600 as const,
  })

  const stagePlans = plans.filter(p => p.stage === tab)
  const stageCard = stageCards.find(s => s.stage === tab)

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Stages & Plans</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>Manage stage cards, plan names, prices, images. Add or remove plans.</p>
        </div>
        {msg.text && (
          <div style={{ background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2', color: msg.type === 'success' ? '#2D6A4F' : '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '4px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '20px', width: 'fit-content' }}>
        {(['stage1', 'stage2', 'stage3'] as const).map(s => (
          <button key={s} onClick={() => setTab(s)} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: tab === s ? '#1C1C1A' : 'transparent', color: tab === s ? 'white' : '#7A7068' }}>
            {s === 'stage1' ? '🍼 Stage 1' : s === 'stage2' ? '🥄 Stage 2' : '🥘 Stage 3'}
          </button>
        ))}
      </div>

      {/* Stage card — homepage */}
      {stageCard && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9A98A', marginBottom: '10px' }}>
            🏠 Homepage Card
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={lbl}>Stage Title</label>
                <input value={stageCard.title} onChange={e => setStageCards(stageCards.map(s => s.id === stageCard.id ? { ...s, title: e.target.value } : s))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Age Range</label>
                <input value={stageCard.age_range} onChange={e => setStageCards(stageCards.map(s => s.id === stageCard.id ? { ...s, age_range: e.target.value } : s))} style={inp} />
              </div>
            </div>
            <label style={lbl}>Description</label>
            <textarea value={stageCard.description} onChange={e => setStageCards(stageCards.map(s => s.id === stageCard.id ? { ...s, description: e.target.value } : s))} rows={2} style={{ ...inp, resize: 'vertical', marginBottom: '10px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Tag</label>
                <input value={stageCard.tag || ''} onChange={e => setStageCards(stageCards.map(s => s.id === stageCard.id ? { ...s, tag: e.target.value } : s))} style={inp} placeholder="e.g. Most Popular" />
              </div>
              <div>
                <label style={lbl}>Tag Color</label>
                <input type="color" value={stageCard.tag_color} onChange={e => setStageCards(stageCards.map(s => s.id === stageCard.id ? { ...s, tag_color: e.target.value } : s))} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8D5C4', cursor: 'pointer' }} />
              </div>
            </div>
            <button onClick={() => saveStageCard(stageCard)} style={btnStyle('#E8834A')}>
              {saving === stageCard.id ? 'Saving...' : 'Save Stage Card'}
            </button>
          </div>
        </div>
      )}

      {/* Plans list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9A98A' }}>
          📋 Plans ({stagePlans.length})
        </div>
        <button onClick={addPlan} style={btnStyle('#4A7C59')}>+ Add Plan</button>
      </div>

      {stagePlans.map((plan, index) => (
        <div key={plan.id} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8834A' }}>Plan {plan.plan_number}</div>
            <button onClick={() => deletePlan(plan.id)} style={btnStyle('#DC2626', true)}>🗑 Delete</button>
          </div>

          {/* Image upload */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Plan Image</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Preview */}
              <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E8D5C4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3EE', fontSize: '24px' }}>
                {plan.image_url
                  ? <img src={plan.image_url} alt={plan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🍽️'
                }
              </div>
              {/* Upload button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={el => { fileRefs.current[plan.id] = el }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPlanImage(plan.id, f) }}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileRefs.current[plan.id]?.click()}
                  style={btnStyle(uploading === plan.id ? '#C9A98A' : '#7B5EA7')}
                  disabled={uploading === plan.id}
                >
                  {uploading === plan.id ? 'Uploading...' : '📤 Upload Image'}
                </button>
                {plan.image_url && (
                  <div style={{ fontSize: '11px', color: '#4A7C59', marginTop: '4px' }}>✓ Image uploaded</div>
                )}
              </div>
            </div>
          </div>

          {/* Plan details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={lbl}>Plan Name</label>
              <input value={plan.name} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p))} style={inp} placeholder="e.g. Classic Plan" />
            </div>
            <div>
              <label style={lbl}>Price</label>
              <input value={plan.price} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, price: e.target.value } : p))} style={inp} placeholder="e.g. 299 SAR / week" />
            </div>
          </div>
          <label style={lbl}>Description</label>
          <textarea value={plan.description} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, description: e.target.value } : p))} rows={2} style={{ ...inp, resize: 'vertical', marginBottom: '10px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Tag (e.g. "Most Popular")</label>
              <input value={plan.tag || ''} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, tag: e.target.value } : p))} style={inp} placeholder="Leave empty for no tag" />
            </div>
            <div>
              <label style={lbl}>Tag Color</label>
              <input type="color" value={plan.tag_color} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, tag_color: e.target.value } : p))} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8D5C4', cursor: 'pointer' }} />
            </div>
          </div>
          <button onClick={() => savePlan(plan)} style={btnStyle('#E8834A')}>
            {saving === plan.id ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      ))}

      {stagePlans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#C9A98A', fontSize: '14px', background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)' }}>
          No plans yet for this stage. Click "+ Add Plan" to create one.
        </div>
      )}
    </div>
  )
}
