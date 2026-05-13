// ════════════════════════════════════════════════════════════
// ADMIN STAGES PAGE — /admin/stages
// Shows all stages. Click a stage to see its plans.
// Add, remove, edit stages and upload images here.
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Stage = {
  id: string; name: string; age_range: string; description: string
  image_url: string | null; emoji: string; tag: string | null
  tag_color: string; card_bg: string; position: number; is_active: boolean
}

export default function StagesPage() {
  const supabase = createClient()
  const router = useRouter()
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState({ text: '', type: 'success' })
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('stages').select('*').order('position')
    if (data) setStages(data)
    setLoading(false)
  }

  function flash(text: string, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  // ── ADD STAGE ──
  async function addStage() {
    const { data } = await supabase.from('stages').insert({
      name: 'New Stage', age_range: '0–0 months',
      description: 'Stage description here',
      emoji: '🍽️', position: stages.length + 1,
    }).select().single()
    if (data) { setStages([...stages, data]); setExpanded(data.id) }
    flash('Stage added ✓')
  }

  // ── DELETE STAGE ──
  async function deleteStage(id: string) {
    if (!confirm('Delete this stage? All plans and schedules inside will also be deleted.')) return
    await supabase.from('stages').delete().eq('id', id)
    setStages(stages.filter(s => s.id !== id))
    flash('Stage deleted')
  }

  // ── SAVE STAGE ──
  async function saveStage(stage: Stage) {
    setSaving(stage.id)
    await supabase.from('stages').update({
      name: stage.name, age_range: stage.age_range,
      description: stage.description, emoji: stage.emoji,
      tag: stage.tag || null, tag_color: stage.tag_color,
      card_bg: stage.card_bg, is_active: stage.is_active,
    }).eq('id', stage.id)
    setSaving(null)
    flash('Stage saved ✓')
  }

  // ── UPLOAD STAGE IMAGE ──
  async function uploadImage(stageId: string, file: File) {
    if (!file.type.startsWith('image/')) { flash('Please upload an image', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { flash('Image must be under 5MB', 'error'); return }
    setUploading(stageId)
    const ext = file.name.split('.').pop()
    const fileName = `stage-${stageId}.${ext}`
    const { error } = await supabase.storage.from('plans').upload(fileName, file, { upsert: true })
    if (error) { flash(`Upload failed: ${error.message}`, 'error'); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('plans').getPublicUrl(fileName)
    await supabase.from('stages').update({ image_url: publicUrl }).eq('id', stageId)
    setStages(stages.map(s => s.id === stageId ? { ...s, image_url: publicUrl } : s))
    setUploading(null)
    flash('Image uploaded ✓')
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#C9A98A', marginBottom: '4px' }
  const btn = (color: string, small = false) => ({ padding: small ? '5px 10px' : '8px 16px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: small ? '11px' : '12px', fontWeight: 600 as const })

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading stages...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Stages</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>Manage all stages. Click a stage to edit its plans and schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg.text && <div style={{ background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2', color: msg.type === 'success' ? '#2D6A4F' : '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg.text}</div>}
          <button onClick={addStage} style={btn('#4A7C59')}>+ Add Stage</button>
        </div>
      </div>

      {/* Stages list */}
      {stages.map(stage => (
        <div key={stage.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '12px', overflow: 'hidden' }}>

          {/* Stage header — click to expand */}
          <div
            onClick={() => setExpanded(expanded === stage.id ? null : stage.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
          >
            {/* Image preview */}
            <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: stage.card_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              {stage.image_url
                ? <img src={stage.image_url} alt={stage.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : stage.emoji
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#1C1C1A' }}>{stage.name}</div>
              <div style={{ fontSize: '12px', color: '#7A7068' }}>{stage.age_range}</div>
            </div>
            {stage.tag && (
              <div style={{ background: `${stage.tag_color}18`, color: stage.tag_color, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '50px' }}>{stage.tag}</div>
            )}
            {/* Go to plans button */}
            <button
              onClick={e => { e.stopPropagation(); router.push(`/admin/stages/${stage.id}`) }}
              style={{ ...btn('#E8834A', true), whiteSpace: 'nowrap' }}
            >
              See Plans →
            </button>
            <div style={{ color: '#C9A98A', fontSize: '16px' }}>{expanded === stage.id ? '▲' : '▼'}</div>
          </div>

          {/* Expanded edit form */}
          {expanded === stage.id && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ paddingTop: '16px' }}>

                {/* Image upload */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={lbl}>Stage Image</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E8D5C4', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3EE', fontSize: '24px', flexShrink: 0 }}>
                      {stage.image_url
                        ? <img src={stage.image_url} alt={stage.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : stage.emoji
                      }
                    </div>
                    <div>
                      <input type="file" accept="image/*" ref={el => { fileRefs.current[stage.id] = el }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(stage.id, f) }}
                        style={{ display: 'none' }} />
                      <button onClick={() => fileRefs.current[stage.id]?.click()} style={btn(uploading === stage.id ? '#C9A98A' : '#7B5EA7')} disabled={uploading === stage.id}>
                        {uploading === stage.id ? 'Uploading...' : '📤 Upload Image'}
                      </button>
                      {stage.image_url && <div style={{ fontSize: '11px', color: '#4A7C59', marginTop: '4px' }}>✓ Image uploaded</div>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={lbl}>Stage Name</label>
                    <input value={stage.name} onChange={e => setStages(stages.map(s => s.id === stage.id ? { ...s, name: e.target.value } : s))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Age Range</label>
                    <input value={stage.age_range} onChange={e => setStages(stages.map(s => s.id === stage.id ? { ...s, age_range: e.target.value } : s))} style={inp} />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={lbl}>Description</label>
                  <textarea value={stage.description} onChange={e => setStages(stages.map(s => s.id === stage.id ? { ...s, description: e.target.value } : s))} rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={lbl}>Emoji</label>
                    <input value={stage.emoji} onChange={e => setStages(stages.map(s => s.id === stage.id ? { ...s, emoji: e.target.value } : s))} style={{ ...inp, textAlign: 'center', fontSize: '20px' }} />
                  </div>
                  <div>
                    <label style={lbl}>Tag (e.g. "Most Popular")</label>
                    <input value={stage.tag || ''} onChange={e => setStages(stages.map(s => s.id === stage.id ? { ...s, tag: e.target.value } : s))} style={inp} placeholder="Leave empty for no tag" />
                  </div>
                  <div>
                    <label style={lbl}>Tag Color</label>
                    <input type="color" value={stage.tag_color} onChange={e => setStages(stages.map(s => s.id === stage.id ? { ...s, tag_color: e.target.value } : s))} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8D5C4', cursor: 'pointer' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveStage(stage)} style={btn('#E8834A')}>{saving === stage.id ? 'Saving...' : 'Save Stage'}</button>
                  <button onClick={() => deleteStage(stage.id)} style={btn('#DC2626')}>🗑 Delete Stage</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {stages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#C9A98A', background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
          No stages yet. Click "+ Add Stage" to create your first one.
        </div>
      )}
    </div>
  )
}
