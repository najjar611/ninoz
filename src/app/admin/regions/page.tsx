'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Region = { id: string; name: string; name_en: string | null; is_active: boolean; position: number }
type District = { id: string; region_id: string | null; name: string; name_en: string | null; is_active: boolean; position: number }

export default function RegionsAdmin() {
  const supabase = createClient()
  const [regions, setRegions] = useState<Region[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  // New-row drafts
  const [rAr, setRAr] = useState('')
  const [rEn, setREn] = useState('')
  const [dRegion, setDRegion] = useState('')
  const [dAr, setDAr] = useState('')
  const [dEn, setDEn] = useState('')

  async function load() {
    const [{ data: rs }, { data: ds }] = await Promise.all([
      supabase.from('service_regions').select('*').order('position'),
      supabase.from('service_districts').select('*').order('position'),
    ])
    setRegions((rs as any) || [])
    setDistricts((ds as any) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 1600) }

  async function addRegion() {
    if (!rAr.trim()) return
    const pos = regions.length ? Math.max(...regions.map(r => r.position)) + 1 : 0
    const { error } = await supabase.from('service_regions').insert({ name: rAr.trim(), name_en: rEn.trim() || null, position: pos, is_active: true })
    if (error) { flash(error.message); return }
    setRAr(''); setREn(''); flash('Added'); load()
  }
  async function updateRegion(id: string, patch: Partial<Region>) {
    await supabase.from('service_regions').update(patch).eq('id', id)
    load()
  }
  async function delRegion(id: string) {
    if (!confirm('Delete this region and its districts?')) return
    await supabase.from('service_districts').delete().eq('region_id', id)
    await supabase.from('service_regions').delete().eq('id', id)
    flash('Deleted'); load()
  }

  async function addDistrict() {
    if (!dAr.trim()) return
    const inRegion = districts.filter(d => d.region_id === (dRegion || null))
    const pos = inRegion.length ? Math.max(...inRegion.map(d => d.position)) + 1 : 0
    const { error } = await supabase.from('service_districts').insert({ region_id: dRegion || null, name: dAr.trim(), name_en: dEn.trim() || null, position: pos, is_active: true })
    if (error) { flash(error.message); return }
    setDAr(''); setDEn(''); flash('Added'); load()
  }
  async function updateDistrict(id: string, patch: Partial<District>) {
    await supabase.from('service_districts').update(patch).eq('id', id)
    load()
  }
  async function delDistrict(id: string) {
    if (!confirm('Delete this district?')) return
    await supabase.from('service_districts').delete().eq('id', id)
    flash('Deleted'); load()
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #EDEBE8', padding: '18px 20px', marginBottom: 16 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const inp: React.CSSProperties = { padding: '9px 12px', borderRadius: 9, border: '1.5px solid #EDE8E0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }
  const btn: React.CSSProperties = { padding: '9px 16px', background: '#C84B0F', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
  const del: React.CSSProperties = { padding: '6px 10px', background: '#FBEAE5', color: '#C84B0F', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

  const regionName = (id: string | null) => { const r = regions.find(x => x.id === id); return r ? r.name : '—' }

  if (loading) return <div style={{ padding: 40, color: '#B0A098', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 860 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1A', margin: '0 0 4px' }}>Regions &amp; Districts</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>These fill the region (المنطقة) and district (الحي) dropdowns customers pick from in the delivery wizard. Turn a row off to hide it without deleting.</p>
      {msg && <div style={{ background: '#EAF6EE', color: '#2D6A4F', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 9, marginBottom: 14, display: 'inline-block' }}>{msg}</div>}

      <div style={card}>
        <label style={lbl}>Regions (المنطقة)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {regions.length === 0 && <p style={{ fontSize: 13, color: '#B0A098', margin: 0 }}>No regions yet. Add one below.</p>}
          {regions.map(r => (
            <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #F5F1EC', paddingBottom: 8 }}>
              <input style={{ ...inp, flex: 1, minWidth: 130, direction: 'rtl', textAlign: 'right' }} value={r.name} onChange={e => setRegions(rs => rs.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} onBlur={e => updateRegion(r.id, { name: e.target.value })} />
              <input style={{ ...inp, flex: 1, minWidth: 130 }} placeholder="English" value={r.name_en || ''} onChange={e => setRegions(rs => rs.map(x => x.id === r.id ? { ...x, name_en: e.target.value } : x))} onBlur={e => updateRegion(r.id, { name_en: e.target.value || null })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#7A7068' }}>
                <input type="checkbox" checked={r.is_active} onChange={e => updateRegion(r.id, { is_active: e.target.checked })} style={{ accentColor: '#C84B0F' }} /> Active
              </label>
              <button style={del} onClick={() => delRegion(r.id)}>Delete</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inp, flex: 1, minWidth: 130, direction: 'rtl', textAlign: 'right' }} placeholder="اسم المنطقة" value={rAr} onChange={e => setRAr(e.target.value)} />
          <input style={{ ...inp, flex: 1, minWidth: 130 }} placeholder="Region (English)" value={rEn} onChange={e => setREn(e.target.value)} />
          <button style={btn} onClick={addRegion}>Add region</button>
        </div>
      </div>

      <div style={card}>
        <label style={lbl}>Districts (الحي)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {districts.length === 0 && <p style={{ fontSize: 13, color: '#B0A098', margin: 0 }}>No districts yet. Add one below.</p>}
          {districts.map(d => (
            <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #F5F1EC', paddingBottom: 8 }}>
              <select style={{ ...inp, minWidth: 130 }} value={d.region_id || ''} onChange={e => updateDistrict(d.id, { region_id: e.target.value || null })}>
                <option value="">No region</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <input style={{ ...inp, flex: 1, minWidth: 120, direction: 'rtl', textAlign: 'right' }} value={d.name} onChange={e => setDistricts(ds => ds.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))} onBlur={e => updateDistrict(d.id, { name: e.target.value })} />
              <input style={{ ...inp, flex: 1, minWidth: 120 }} placeholder="English" value={d.name_en || ''} onChange={e => setDistricts(ds => ds.map(x => x.id === d.id ? { ...x, name_en: e.target.value } : x))} onBlur={e => updateDistrict(d.id, { name_en: e.target.value || null })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#7A7068' }}>
                <input type="checkbox" checked={d.is_active} onChange={e => updateDistrict(d.id, { is_active: e.target.checked })} style={{ accentColor: '#C84B0F' }} /> Active
              </label>
              <button style={del} onClick={() => delDistrict(d.id)}>Delete</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select style={{ ...inp, minWidth: 130 }} value={dRegion} onChange={e => setDRegion(e.target.value)}>
            <option value="">No region</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input style={{ ...inp, flex: 1, minWidth: 120, direction: 'rtl', textAlign: 'right' }} placeholder="اسم الحي" value={dAr} onChange={e => setDAr(e.target.value)} />
          <input style={{ ...inp, flex: 1, minWidth: 120 }} placeholder="District (English)" value={dEn} onChange={e => setDEn(e.target.value)} />
          <button style={btn} onClick={addDistrict}>Add district</button>
        </div>
        <p style={{ fontSize: 12, color: '#A08070', margin: '10px 0 0' }}>Districts show under their region in the wizard. Region here: {dRegion ? regionName(dRegion) : 'none selected'}.</p>
      </div>
    </div>
  )
}
