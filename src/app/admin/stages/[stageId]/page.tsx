// ════════════════════════════════════════════════════════════
// ADMIN PLANS PAGE — /admin/stages/[stageId]
// Shows all plans inside a stage.
// Add, remove, edit plans and upload images.
// Click a plan to see its weekly schedule.
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Stage = { id: string; name: string; age_range: string }
type Plan = {
  id: string; stage_id: string; plan_number: number
  name: string; description: string; price: string
  tag: string | null; tag_color: string; image_url: string | null; is_active: boolean
}

export default function StagePlansPage() {
  const supabase = createClient()
  const router = useRouter()
  const { stageId } = useParams<{ stageId: string }>()
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [stage, setStage] = useState<Stage | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState({ text: '', type: 'success' })
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [stageId])

  async function load() {
    setLoading(true)
    const [stageRes, plansRes] = await Promise.all([
      supabase.from('stages').select('id, name, age_range').eq('id', stageId).single(),
      supabase.from('plan_details').select('*').eq('stage_id', stageId).order('plan_number'),
    ])
    if (stageRes.data) setStage(stageRes.data)
    if (plansRes.data) setPlans(plansRes.data)
    setLoading(false)
  }

  function flash(text: string, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  // ── ADD PLAN ──
  async function addPlan() {
    const nextNum = plans.length + 1
    const { data } = await supabase.from('plan_details').insert({
      stage_id: stageId, stage: 'stage1', // kept for backward compat
      plan_number: nextNum,
      name: `Plan ${nextNum}`,
      description: 'Plan description here',
      price: '299 SAR / week',
      tag: null, tag_color: '#E8834A',
    }).select().single()
    if (data) {
      setPlans([...plans, data])
      setExpanded(data.id)
      // Create 5-day schedule
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday']
      for (let i = 0; i < days.length; i++) {
        await supabase.from('weekly_schedules').insert({
          plan_id: data.id, day: days[i], day_number: i + 1,
          breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name',
        })
      }
      flash('Plan added ✓')
    }
  }

  // ── DELETE PLAN ──
  async function deletePlan(planId: string) {
    if (!confirm('Delete this plan and its weekly schedule?')) return
    await supabase.from('weekly_schedules').delete().eq('plan_id', planId)
    await supabase.from('plan_details').delete().eq('id', planId)
    setPlans(plans.filter(p => p.id !== planId))
    flash('Plan deleted')
  }

  // ── SAVE PLAN ──
  async function savePlan(plan: Plan) {
    setSaving(plan.id)
    await supabase.from('plan_details').update({
      name: plan.name, description: plan.description,
      price: plan.price, tag: plan.tag || null,
      tag_color: plan.tag_color,
    }).eq('id', plan.id)
    setSaving(null)
    flash('Plan saved ✓')
  }

  // ── UPLOAD PLAN IMAGE ──
  async function uploadImage(planId: string, file: File) {
    if (!file.type.startsWith('image/')) { flash('Please upload an image', 'error'); return }
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

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#C9A98A', marginBottom: '4px' }
  const btn = (color: string, small = false) => ({ padding: small ? '5px 10px' : '8px 16px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: small ? '11px' : '12px', fontWeight: 600 as const })

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading plans...</div>

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#7A7068', marginBottom: '20px' }}>
        <Link href="/admin/stages" style={{ color: '#E8834A', textDecoration: 'none' }}>Stages</Link>
        <span>→</span>
        <span style={{ color: '#1C1C1A', fontWeight: 500 }}>{stage?.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>
            {stage?.name} — Plans
          </h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>{stage?.age_range} · Click a plan to edit its weekly schedule.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg.text && <div style={{ background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2', color: msg.type === 'success' ? '#2D6A4F' : '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg.text}</div>}
          <button onClick={addPlan} style={btn('#4A7C59')}>+ Add Plan</button>
        </div>
      </div>

      {/* Plans list */}
      {plans.map(plan => (
        <div key={plan.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '12px', overflow: 'hidden' }}>

          {/* Plan header */}
          <div
            onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
          >
            {/* Image preview */}
            <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#F5F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
              {plan.image_url
                ? <img src={plan.image_url} alt={plan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🍽️'
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#1C1C1A' }}>{plan.name}</div>
              <div style={{ fontSize: '12px', color: '#7A7068' }}>{plan.price}</div>
            </div>
            {plan.tag && (
              <div style={{ background: `${plan.tag_color}18`, color: plan.tag_color, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '50px' }}>{plan.tag}</div>
            )}
            {/* Go to schedule */}
            <button
              onClick={e => { e.stopPropagation(); router.push(`/admin/stages/${stageId}/${plan.id}`) }}
              style={{ ...btn('#E8834A', true), whiteSpace: 'nowrap' }}
            >
              Schedule →
            </button>
            <div style={{ color: '#C9A98A', fontSize: '16px' }}>{expanded === plan.id ? '▲' : '▼'}</div>
          </div>

          {/* Expanded edit form */}
          {expanded === plan.id && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ paddingTop: '16px' }}>

                {/* Image upload */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={lbl}>Plan Image</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E8D5C4', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3EE', fontSize: '24px', flexShrink: 0 }}>
                      {plan.image_url
                        ? <img src={plan.image_url} alt={plan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🍽️'
                      }
                    </div>
                    <div>
                      <input type="file" accept="image/*" ref={el => { fileRefs.current[plan.id] = el }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(plan.id, f) }}
                        style={{ display: 'none' }} />
                      <button onClick={() => fileRefs.current[plan.id]?.click()} style={btn(uploading === plan.id ? '#C9A98A' : '#7B5EA7')} disabled={uploading === plan.id}>
                        {uploading === plan.id ? 'Uploading...' : '📤 Upload Image'}
                      </button>
                      {plan.image_url && <div style={{ fontSize: '11px', color: '#4A7C59', marginTop: '4px' }}>✓ Image uploaded</div>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={lbl}>Plan Name</label>
                    <input value={plan.name} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Price</label>
                    <input value={plan.price} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, price: e.target.value } : p))} style={inp} placeholder="e.g. 299 SAR / week" />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={lbl}>Description</label>
                  <textarea value={plan.description} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, description: e.target.value } : p))} rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={lbl}>Tag (e.g. "Most Popular")</label>
                    <input value={plan.tag || ''} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, tag: e.target.value } : p))} style={inp} placeholder="Leave empty for no tag" />
                  </div>
                  <div>
                    <label style={lbl}>Tag Color</label>
                    <input type="color" value={plan.tag_color} onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, tag_color: e.target.value } : p))} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8D5C4', cursor: 'pointer' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => savePlan(plan)} style={btn('#E8834A')}>{saving === plan.id ? 'Saving...' : 'Save Plan'}</button>
                  <button onClick={() => deletePlan(plan.id)} style={btn('#DC2626')}>🗑 Delete Plan</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {plans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#C9A98A', background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
          No plans yet. Click "+ Add Plan" to create one.
        </div>
      )}
    </div>
  )
}
