'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stage = {
  id: string; name: string; age_range: string; description: string
  name_ar: string | null; age_range_ar: string | null; description_ar: string | null
  emoji: string; card_bg: string; image_url: string | null
  tag: string | null; tag_color: string; is_clickable: boolean
  is_active: boolean; position: number
  min_age_months: number | null; max_age_months: number | null
}

export default function StagesAdmin() {
  const supabase = createClient()
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('stages').select('*').order('position')
    setStages(data || [])
    setLoading(false)
  }

  function update(id: string, key: keyof Stage, val: any) {
    setStages(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s))
  }

  async function save(stage: Stage) {
    setSaving(stage.id)
    const { error } = await supabase.from('stages').update({
      name: stage.name, age_range: stage.age_range, description: stage.description,
      name_ar: stage.name_ar, age_range_ar: stage.age_range_ar, description_ar: stage.description_ar,
      emoji: stage.emoji, card_bg: stage.card_bg, tag: stage.tag,
      tag_color: stage.tag_color, is_clickable: stage.is_clickable, is_active: stage.is_active,
      min_age_months: stage.min_age_months, max_age_months: stage.max_age_months,
    }).eq('id', stage.id)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  async function uploadImage(id: string, file: File) {
    setUploading(id)
    const ext = file.name.split('.').pop()
    const path = `stage-${id}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('stages').upload(path, file, { upsert: true })
    if (upErr) { flash('Upload failed'); setUploading(null); return }
    const { data: urlData } = supabase.storage.from('stages').getPublicUrl(path)
    await supabase.from('stages').update({ image_url: urlData.publicUrl }).eq('id', id)
    update(id, 'image_url', urlData.publicUrl)
    setUploading(null)
    flash('Photo uploaded!')
  }

  async function addStage() {
    const { data } = await supabase.from('stages').insert({
      name: 'New Stage', age_range: '+X Months', description: '',
      emoji: '🍽️', card_bg: '#F5EDE0', position: stages.length + 1,
    }).select().single()
    if (data) setStages(prev => [...prev, data])
  }

  async function deleteStage(id: string) {
    if (!confirm('Delete this stage? All meals linked to it will also be deleted.')) return
    await supabase.from('stages').delete().eq('id', id)
    setStages(prev => prev.filter(s => s.id !== id))
    flash('Deleted')
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #EDE8E0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: '12px' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading stages…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Stages</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Manage your meal stages. They appear as swipeable cards on the homepage.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={addStage} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Stage
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 20 }}>
        {stages.map(stage => (
          <div key={stage.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', opacity: stage.is_active ? 1 : 0.6 }}>
            <div style={{ height: 180, background: stage.card_bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              {stage.image_url ? (
                <img src={stage.image_url} alt={stage.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : stage.emoji}
              <button
                onClick={() => fileRefs.current[stage.id]?.click()}
                disabled={uploading === stage.id}
                style={{ position: 'absolute', bottom: 8, right: 8, padding: '6px 12px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {uploading === stage.id ? 'Uploading…' : '📷 Change Photo'}
              </button>
              <input type="file" accept="image/*" ref={el => { fileRefs.current[stage.id] = el }}
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(stage.id, f) }} />
            </div>

            <div style={{ padding: 18 }}>
              <div className="stage-name-emoji" style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: 10, marginBottom: 0 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Stage Name (English)</label>
                  <input style={inp} value={stage.name} onChange={e => update(stage.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Emoji</label>
                  <input style={{ ...inp, textAlign: 'center', fontSize: 20 }} value={stage.emoji} onChange={e => update(stage.id, 'emoji', e.target.value)} />
                </div>
              </div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase', textAlign: 'right' }}>اسم المرحلة (عربي)</label>
              <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={stage.name_ar || ''} onChange={e => update(stage.id, 'name_ar', e.target.value)} />

              <div className="stage-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Age Range (English)</label>
                  <input style={inp} value={stage.age_range} placeholder="+9 Months" onChange={e => update(stage.id, 'age_range', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase', textAlign: 'right' }}>الفئة العمرية (عربي)</label>
                  <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={stage.age_range_ar || ''} placeholder="+9 أشهر" onChange={e => update(stage.id, 'age_range_ar', e.target.value)} />
                </div>
              </div>

              <div className="stage-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Description (English)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={stage.description} onChange={e => update(stage.id, 'description', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase', textAlign: 'right' }}>الوصف (عربي)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical', direction: 'rtl', textAlign: 'right' }} value={stage.description_ar || ''} onChange={e => update(stage.id, 'description_ar', e.target.value)} />
                </div>
              </div>

              <div className="stage-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Min Age (months)</label>
                  <input type="number" min={0} style={inp} value={stage.min_age_months ?? ''} onChange={e => update(stage.id, 'min_age_months', e.target.value === '' ? null : parseInt(e.target.value))} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Max Age (months)</label>
                  <input type="number" min={0} style={inp} value={stage.max_age_months ?? ''} onChange={e => update(stage.id, 'max_age_months', e.target.value === '' ? null : parseInt(e.target.value))} placeholder="6" />
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#A08070', margin: '-6px 0 12px' }}>Used to auto-recommend this stage on the waitlist page based on baby's age.</p>

              <div className="stage-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Card Background</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={stage.card_bg} onChange={e => update(stage.id, 'card_bg', e.target.value)}
                      style={{ width: 40, height: 36, borderRadius: 8, border: '1.5px solid #EDE8E0', cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inp, flex: 1, marginBottom: 0 }} value={stage.card_bg} onChange={e => update(stage.id, 'card_bg', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Tag (optional)</label>
                  <input style={{ ...inp, marginBottom: 0 }} value={stage.tag || ''} placeholder="e.g. Popular" onChange={e => update(stage.id, 'tag', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, margin: '12px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                  <input type="checkbox" checked={stage.is_active} onChange={e => update(stage.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                  Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                  <input type="checkbox" checked={stage.is_clickable} onChange={e => update(stage.id, 'is_clickable', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                  Clickable
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => deleteStage(stage.id)}
                  style={{ padding: '7px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Delete
                </button>
                <button onClick={() => save(stage)} disabled={saving === stage.id}
                  style={{ flex: 1, padding: '7px 16px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === stage.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {saving === stage.id ? 'Saving…' : 'Save Stage'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍼</div>
          <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 15 }}>No stages yet</div>
          <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Click "+ Add Stage" to create your first meal stage.</div>
        </div>
      )}

      <style>{`
        @media (max-width: 400px) {
          .stage-2col { grid-template-columns: 1fr !important; }
          .stage-name-emoji { grid-template-columns: 1fr 50px !important; }
        }
      `}</style>
    </div>
  )
}
