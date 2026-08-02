'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type News = { id: string; title: string; title_en: string | null; body: string; body_en: string | null; is_active: boolean; position: number }

export default function NewsAdmin() {
  const supabase = createClient()
  const [items, setItems] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const [titleAr, setTitleAr] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [bodyAr, setBodyAr] = useState('')
  const [bodyEn, setBodyEn] = useState('')

  async function load() {
    const { data } = await supabase.from('news_items').select('*').order('position')
    setItems((data as any) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 1600) }

  async function add() {
    if (!titleAr.trim()) return
    const pos = items.length ? Math.max(...items.map(i => i.position)) + 1 : 0
    const { error } = await supabase.from('news_items').insert({ title: titleAr.trim(), title_en: titleEn.trim() || null, body: bodyAr.trim(), body_en: bodyEn.trim() || null, position: pos, is_active: true })
    if (error) { flash(error.message); return }
    setTitleAr(''); setTitleEn(''); setBodyAr(''); setBodyEn(''); flash('Added'); load()
  }
  async function update(id: string, patch: Partial<News>) {
    await supabase.from('news_items').update(patch).eq('id', id); load()
  }
  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex(i => i.id === id)
    const swap = idx + dir
    if (swap < 0 || swap >= items.length) return
    const a = items[idx], b = items[swap]
    await Promise.all([
      supabase.from('news_items').update({ position: b.position }).eq('id', a.id),
      supabase.from('news_items').update({ position: a.position }).eq('id', b.id),
    ])
    load()
  }
  async function del(id: string) {
    if (!confirm('Delete this news card?')) return
    await supabase.from('news_items').delete().eq('id', id); flash('Deleted'); load()
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #EDEBE8', padding: '18px 20px', marginBottom: 16 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: '#7A7068', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #EDE8E0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }
  const btn: React.CSSProperties = { padding: '9px 16px', background: '#C84B0F', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
  const mini: React.CSSProperties = { padding: '5px 9px', background: '#F2EDE8', color: '#7A7068', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
  const del2: React.CSSProperties = { ...mini, background: '#FBEAE5', color: '#C84B0F' }

  if (loading) return <div style={{ padding: 40, color: '#B0A098', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 820 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1A', margin: '0 0 4px' }}>News</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>Cards shown in the swipeable news box on the homepage. Customers can tap a card to expand it (e.g. the districts you serve). Reorder with the arrows.</p>
      {msg && <div style={{ background: '#EAF6EE', color: '#2D6A4F', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 9, marginBottom: 14, display: 'inline-block' }}>{msg}</div>}

      <div style={card}>
        <label style={lbl}>Add a card</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inp, flex: 1, minWidth: 150, direction: 'rtl', textAlign: 'right' }} placeholder="العنوان" value={titleAr} onChange={e => setTitleAr(e.target.value)} />
          <input style={{ ...inp, flex: 1, minWidth: 150 }} placeholder="Title (English)" value={titleEn} onChange={e => setTitleEn(e.target.value)} />
        </div>
        <textarea style={{ ...inp, height: 60, resize: 'vertical', marginBottom: 8, direction: 'rtl', textAlign: 'right' }} placeholder="النص (يظهر عند الضغط)" value={bodyAr} onChange={e => setBodyAr(e.target.value)} />
        <textarea style={{ ...inp, height: 60, resize: 'vertical', marginBottom: 10 }} placeholder="Body (English, shown on tap)" value={bodyEn} onChange={e => setBodyEn(e.target.value)} />
        <button style={btn} onClick={add}>Add card</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 && <p style={{ fontSize: 13, color: '#B0A098' }}>No cards yet.</p>}
        {items.map((it, i) => (
          <div key={it.id} style={{ ...card, marginBottom: 0, opacity: it.is_active ? 1 : 0.55 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input style={{ ...inp, flex: 1, minWidth: 150, direction: 'rtl', textAlign: 'right' }} value={it.title} onChange={e => setItems(xs => xs.map(x => x.id === it.id ? { ...x, title: e.target.value } : x))} onBlur={e => update(it.id, { title: e.target.value })} />
              <input style={{ ...inp, flex: 1, minWidth: 150 }} placeholder="English" value={it.title_en || ''} onChange={e => setItems(xs => xs.map(x => x.id === it.id ? { ...x, title_en: e.target.value } : x))} onBlur={e => update(it.id, { title_en: e.target.value || null })} />
            </div>
            <textarea style={{ ...inp, height: 54, resize: 'vertical', marginBottom: 8, direction: 'rtl', textAlign: 'right' }} value={it.body} onChange={e => setItems(xs => xs.map(x => x.id === it.id ? { ...x, body: e.target.value } : x))} onBlur={e => update(it.id, { body: e.target.value })} />
            <textarea style={{ ...inp, height: 54, resize: 'vertical', marginBottom: 10 }} placeholder="English" value={it.body_en || ''} onChange={e => setItems(xs => xs.map(x => x.id === it.id ? { ...x, body_en: e.target.value } : x))} onBlur={e => update(it.id, { body_en: e.target.value || null })} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={mini} onClick={() => move(it.id, -1)} disabled={i === 0}>↑</button>
              <button style={mini} onClick={() => move(it.id, 1)} disabled={i === items.length - 1}>↓</button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#7A7068' }}>
                <input type="checkbox" checked={it.is_active} onChange={e => update(it.id, { is_active: e.target.checked })} style={{ accentColor: '#C84B0F' }} /> Active
              </label>
              <button style={del2} onClick={() => del(it.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
