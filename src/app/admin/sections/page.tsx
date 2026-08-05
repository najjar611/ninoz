'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type HowStep = { id: string; icon_url: string | null; icon_bg: string; description: string; description_ar: string | null }
type WhyPoint = { id: string; title: string; description: string; title_color: string; title_ar: string | null; description_ar: string | null }
type Ingredient = { id: string; name: string; description: string; image_url: string | null; name_ar: string | null; description_ar: string | null }
type TickerItem = { id: string; text: string; highlight: string; text_ar: string | null; highlight_ar: string | null }

const TABS = ['How It Works', 'Why Points', 'Ingredients', 'Ticker'] as const
type Tab = typeof TABS[number]

export default function SectionsAdmin() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('How It Works')
  const [howSteps, setHowSteps] = useState<HowStep[]>([])
  const [whyPoints, setWhyPoints] = useState<WhyPoint[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [h, w, i, t] = await Promise.all([
      supabase.from('how_steps').select('*').order('id'),
      supabase.from('why_points').select('*').order('id'),
      supabase.from('ingredients').select('*').order('id'),
      supabase.from('ticker_items').select('*').order('id'),
    ])
    setHowSteps(h.data || [])
    setWhyPoints(w.data || [])
    setIngredients(i.data || [])
    setTickerItems(t.data || [])
    setLoading(false)
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }
  const lblAr: React.CSSProperties = { ...lbl, textAlign: 'right' }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }
  const card: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #EDEBE8' }
  const delBtn: React.CSSProperties = { padding: '7px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
  const saveBtn = (active: boolean): React.CSSProperties => ({ padding: '7px 24px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: active ? 0.6 : 1, fontFamily: 'inherit' })

  // ---- How Steps ----
  function updateHow(id: string, key: keyof HowStep, val: any) {
    setHowSteps(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s))
  }
  async function saveHow(s: HowStep) {
    setSaving(s.id)
    const { error } = await supabase.from('how_steps').update({
      icon_url: s.icon_url, icon_bg: s.icon_bg, description: s.description, description_ar: s.description_ar,
    }).eq('id', s.id)
    setSaving(null)
    flash(error ? 'Error: ' + error.message : 'Saved!')
  }
  async function addHow() {
    const { data } = await supabase.from('how_steps').insert({ icon_bg: '#FDF0E8', description: 'New step' }).select().single()
    if (data) setHowSteps(prev => [...prev, data])
  }
  async function removeHow(id: string) {
    if (!confirm('Delete this step?')) return
    await supabase.from('how_steps').delete().eq('id', id)
    setHowSteps(prev => prev.filter(s => s.id !== id))
    flash('Deleted')
  }

  // ---- Why Points ----
  function updateWhy(id: string, key: keyof WhyPoint, val: any) {
    setWhyPoints(prev => prev.map(w => w.id === id ? { ...w, [key]: val } : w))
  }
  async function saveWhy(w: WhyPoint) {
    setSaving(w.id)
    const { error } = await supabase.from('why_points').update({
      title: w.title, description: w.description, title_color: w.title_color, title_ar: w.title_ar, description_ar: w.description_ar,
    }).eq('id', w.id)
    setSaving(null)
    flash(error ? 'Error: ' + error.message : 'Saved!')
  }
  async function addWhy() {
    const { data } = await supabase.from('why_points').insert({ title: 'New Point', description: '', title_color: '#C84B0F' }).select().single()
    if (data) setWhyPoints(prev => [...prev, data])
  }
  async function removeWhy(id: string) {
    if (!confirm('Delete this point?')) return
    await supabase.from('why_points').delete().eq('id', id)
    setWhyPoints(prev => prev.filter(w => w.id !== id))
    flash('Deleted')
  }

  // ---- Ingredients ----
  function updateIng(id: string, key: keyof Ingredient, val: any) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [key]: val } : i))
  }
  async function saveIng(i: Ingredient) {
    setSaving(i.id)
    const { error } = await supabase.from('ingredients').update({
      name: i.name, description: i.description, image_url: i.image_url, name_ar: i.name_ar, description_ar: i.description_ar,
    }).eq('id', i.id)
    setSaving(null)
    flash(error ? 'Error: ' + error.message : 'Saved!')
  }
  async function addIng() {
    const { data } = await supabase.from('ingredients').insert({ name: 'New Ingredient', description: '' }).select().single()
    if (data) setIngredients(prev => [...prev, data])
  }
  async function removeIng(id: string) {
    if (!confirm('Delete this ingredient?')) return
    await supabase.from('ingredients').delete().eq('id', id)
    setIngredients(prev => prev.filter(i => i.id !== id))
    flash('Deleted')
  }

  // ---- Ticker Items ----
  function updateTicker(id: string, key: keyof TickerItem, val: any) {
    setTickerItems(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))
  }
  async function saveTicker(t: TickerItem) {
    setSaving(t.id)
    const { error } = await supabase.from('ticker_items').update({
      text: t.text, highlight: t.highlight, text_ar: t.text_ar, highlight_ar: t.highlight_ar,
    }).eq('id', t.id)
    setSaving(null)
    flash(error ? 'Error: ' + error.message : 'Saved!')
  }
  async function addTicker() {
    const { data } = await supabase.from('ticker_items').insert({ text: 'New Claim', highlight: '100%' }).select().single()
    if (data) setTickerItems(prev => [...prev, data])
  }
  async function removeTicker(id: string) {
    if (!confirm('Delete this ticker item?')) return
    await supabase.from('ticker_items').delete().eq('id', id)
    setTickerItems(prev => prev.filter(t => t.id !== id))
    flash('Deleted')
  }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Homepage Sections</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Manage How It Works, Why Ninoz, Ingredients, and the scrolling ticker — in English and Arabic.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700,
            background: tab === t ? '#C84B0F' : '#F2EDE8',
            color: tab === t ? 'white' : '#5A5048',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'How It Works' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {howSteps.map((s, idx) => (
            <div key={s.id} style={card}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', marginBottom: 10 }}>Step {idx + 1}</div>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Description (English)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={s.description} onChange={e => updateHow(s.id, 'description', e.target.value)} />
                </div>
                <div>
                  <label style={lblAr}>الوصف (عربي)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical', direction: 'rtl', textAlign: 'right' }} value={s.description_ar || ''} onChange={e => updateHow(s.id, 'description_ar', e.target.value)} />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Icon URL</label>
                  <input style={inp} value={s.icon_url || ''} onChange={e => updateHow(s.id, 'icon_url', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Icon Background</label>
                  <input style={inp} value={s.icon_bg} onChange={e => updateHow(s.id, 'icon_bg', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => removeHow(s.id)} style={delBtn}>Delete</button>
                <button onClick={() => saveHow(s)} disabled={saving === s.id} style={saveBtn(saving === s.id)}>{saving === s.id ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          ))}
          <button onClick={addHow} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>+ Add Step</button>
        </div>
      )}

      {tab === 'Why Points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {whyPoints.map(w => (
            <div key={w.id} style={card}>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Title (English)</label>
                  <input style={inp} value={w.title} onChange={e => updateWhy(w.id, 'title', e.target.value)} />
                </div>
                <div>
                  <label style={lblAr}>العنوان (عربي)</label>
                  <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={w.title_ar || ''} onChange={e => updateWhy(w.id, 'title_ar', e.target.value)} />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Description (English)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={w.description} onChange={e => updateWhy(w.id, 'description', e.target.value)} />
                </div>
                <div>
                  <label style={lblAr}>الوصف (عربي)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical', direction: 'rtl', textAlign: 'right' }} value={w.description_ar || ''} onChange={e => updateWhy(w.id, 'description_ar', e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 12, maxWidth: 220 }}>
                <label style={lbl}>Title Color</label>
                <input style={inp} value={w.title_color} onChange={e => updateWhy(w.id, 'title_color', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => removeWhy(w.id)} style={delBtn}>Delete</button>
                <button onClick={() => saveWhy(w)} disabled={saving === w.id} style={saveBtn(saving === w.id)}>{saving === w.id ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          ))}
          <button onClick={addWhy} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>+ Add Point</button>
        </div>
      )}

      {tab === 'Ingredients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ingredients.map(i => (
            <div key={i.id} style={card}>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Name (English)</label>
                  <input style={inp} value={i.name} onChange={e => updateIng(i.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label style={lblAr}>الاسم (عربي)</label>
                  <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={i.name_ar || ''} onChange={e => updateIng(i.id, 'name_ar', e.target.value)} />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Description (English)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={i.description} onChange={e => updateIng(i.id, 'description', e.target.value)} />
                </div>
                <div>
                  <label style={lblAr}>الوصف (عربي)</label>
                  <textarea style={{ ...inp, height: 70, resize: 'vertical', direction: 'rtl', textAlign: 'right' }} value={i.description_ar || ''} onChange={e => updateIng(i.id, 'description_ar', e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Image URL</label>
                <input style={inp} value={i.image_url || ''} onChange={e => updateIng(i.id, 'image_url', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => removeIng(i.id)} style={delBtn}>Delete</button>
                <button onClick={() => saveIng(i)} disabled={saving === i.id} style={saveBtn(saving === i.id)}>{saving === i.id ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          ))}
          <button onClick={addIng} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>+ Add Ingredient</button>
        </div>
      )}

      {tab === 'Ticker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tickerItems.map(t => (
            <div key={t.id} style={card}>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Highlight (English) e.g. 100%</label>
                  <input style={inp} value={t.highlight} onChange={e => updateTicker(t.id, 'highlight', e.target.value)} />
                </div>
                <div>
                  <label style={lblAr}>الرقم البارز (عربي)</label>
                  <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={t.highlight_ar || ''} onChange={e => updateTicker(t.id, 'highlight_ar', e.target.value)} />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Text (English)</label>
                  <input style={inp} value={t.text} onChange={e => updateTicker(t.id, 'text', e.target.value)} />
                </div>
                <div>
                  <label style={lblAr}>النص (عربي)</label>
                  <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={t.text_ar || ''} onChange={e => updateTicker(t.id, 'text_ar', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => removeTicker(t.id)} style={delBtn}>Delete</button>
                <button onClick={() => saveTicker(t)} disabled={saving === t.id} style={saveBtn(saving === t.id)}>{saving === t.id ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          ))}
          <button onClick={addTicker} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>+ Add Ticker Item</button>
        </div>
      )}
    </div>
  )
}
