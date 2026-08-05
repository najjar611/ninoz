'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

let mapsPromise: Promise<void> | null = null
function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject()
  if ((window as any).google?.maps) return Promise.resolve()
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&region=SA`
    s.async = true; s.onload = () => resolve(); s.onerror = () => reject()
    document.head.appendChild(s)
  })
  return mapsPromise
}

type Req = { id: string; name: string; phone: string; area_text: string | null; created_at: string }

export default function DeliveryArea() {
  const supabase = createClient()
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([])
  const [enforce, setEnforce] = useState(true)
  const [noteEn, setNoteEn] = useState('')
  const [noteAr, setNoteAr] = useState('')
  const [oorEn, setOorEn] = useState('')
  const [oorAr, setOorAr] = useState('')
  const [msg, setMsg] = useState('')
  const [reqs, setReqs] = useState<Req[]>([])
  const [changeReqs, setChangeReqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapObj = useRef<any>(null)
  const polyRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const pointsRef = useRef<{ lat: number; lng: number }[]>([])
  pointsRef.current = points

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_content').select('key, value').in('key', ['delivery_zone_polygon', 'delivery_zone_enforce', 'service_area_note', 'service_area_note_ar', 'out_of_area_message', 'out_of_area_message_ar'])
      const m: Record<string, string> = {}
      ;((data as any[]) || []).forEach(r => { m[r.key] = r.value })
      if (m.delivery_zone_polygon) { try { const p = JSON.parse(m.delivery_zone_polygon); if (Array.isArray(p)) setPoints(p.map((x: any) => ({ lng: x[0], lat: x[1] }))) } catch {} }
      if (m.delivery_zone_enforce === 'false') setEnforce(false)
      setNoteEn(m.service_area_note || '')
      setNoteAr(m.service_area_note_ar || '')
      setOorEn(m.out_of_area_message || '')
      setOorAr(m.out_of_area_message_ar || '')
      const { data: rq } = await supabase.from('delivery_zone_requests').select('id, name, phone, area_text, created_at').order('created_at', { ascending: false }).limit(50)
      setReqs((rq as any) || [])
      const { data: cr } = await supabase.from('address_change_requests').select('id, subscriber_id, delivery_address, address_details, created_at, status, subscribers(parent_name, mobile_number)').eq('status', 'pending').order('created_at', { ascending: false }).limit(50)
      setChangeReqs((cr as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  function redraw() {
    const gmaps = (window as any).google?.maps
    if (!gmaps || !mapObj.current) return
    markersRef.current.forEach(m => m.setMap(null)); markersRef.current = []
    if (polyRef.current) polyRef.current.setMap(null)
    polyRef.current = new gmaps.Polygon({ map: mapObj.current, paths: pointsRef.current, strokeColor: '#2D6A4F', strokeWeight: 2, fillColor: '#2D6A4F', fillOpacity: 0.1 })
    pointsRef.current.forEach((pt, idx) => {
      const mk = new gmaps.Marker({ position: pt, map: mapObj.current, draggable: true, label: String(idx + 1) })
      mk.addListener('dragend', () => { const p = mk.getPosition(); setPoints(prev => prev.map((q, i) => i === idx ? { lat: p.lat(), lng: p.lng() } : q)) })
      markersRef.current.push(mk)
    })
  }

  useEffect(() => {
    if (loading || !MAPS_KEY || !mapRef.current) return
    let cancelled = false
    loadMaps().then(() => {
      if (cancelled || !mapRef.current) return
      const gmaps = (window as any).google.maps
      const map = new gmaps.Map(mapRef.current, { center: { lat: 24.83, lng: 46.68 }, zoom: 11, gestureHandling: 'greedy' })
      mapObj.current = map
      map.addListener('click', (e: any) => setPoints(prev => [...prev, { lat: e.latLng.lat(), lng: e.latLng.lng() }]))
      redraw()
    }).catch(() => {})
    return () => { cancelled = true }
  }, [loading])

  useEffect(() => { redraw() }, [points])

  async function reloadChangeReqs() {
    const { data: cr } = await supabase.from('address_change_requests').select('id, subscriber_id, delivery_address, address_details, created_at, status, subscribers(parent_name, mobile_number)').eq('status', 'pending').order('created_at', { ascending: false }).limit(50)
    setChangeReqs((cr as any) || [])
  }
  async function approveChange(r: any) {
    await supabase.from('subscribers').update({ delivery_address: r.delivery_address, address_details: r.address_details }).eq('id', r.subscriber_id)
    await supabase.from('address_change_requests').update({ status: 'approved' }).eq('id', r.id)
    reloadChangeReqs()
  }
  async function rejectChange(r: any) {
    await supabase.from('address_change_requests').update({ status: 'rejected' }).eq('id', r.id)
    reloadChangeReqs()
  }
  // Let an out-of-area customer go through the wizard again (e.g. once we serve them).
  async function allowRetry(phone: string) {
    if (!phone) return
    await supabase.from('subscribers').update({ out_of_area: false }).eq('mobile_number', phone)
    await supabase.from('delivery_zone_requests').delete().eq('phone', phone)
    const { data: rq } = await supabase.from('delivery_zone_requests').select('id, name, phone, area_text, created_at').order('created_at', { ascending: false }).limit(50)
    setReqs((rq as any) || [])
    setMsg('Customer can retry now.'); setTimeout(() => setMsg(''), 2500)
  }

  async function upsert(key: string, value: string) {
    return supabase.from('site_content').upsert({ key, value, label: key, section: 'delivery' }, { onConflict: 'key' })
  }
  async function saveAll() {
    if (points.length < 3) { alert('Add at least 3 points to define an area.'); return }
    setMsg('Saving…')
    const results = await Promise.all([
      upsert('delivery_zone_polygon', JSON.stringify(points.map(p => [p.lng, p.lat]))),
      upsert('delivery_zone_enforce', enforce ? 'true' : 'false'),
      upsert('service_area_note', noteEn),
      upsert('service_area_note_ar', noteAr),
      upsert('out_of_area_message', oorEn),
      upsert('out_of_area_message_ar', oorAr),
    ])
    const failed = results.find(r => (r as any).error)
    if (failed) { setMsg('Save failed: ' + ((failed as any).error.message || 'unknown error')); return }
    // Read the polygon back so we confirm exactly what was persisted.
    const { data: check } = await supabase.from('site_content').select('value').eq('key', 'delivery_zone_polygon').maybeSingle()
    let savedCount = 0
    try { savedCount = (JSON.parse((check as any)?.value || '[]') || []).length } catch {}
    setMsg(`Saved! ${savedCount} points stored.`); setTimeout(() => setMsg(''), 3000)
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #EDEBE8', padding: '18px 20px', marginBottom: 16 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: '#7A7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 9, border: '1.5px solid #EDE8E0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }
  const btn: React.CSSProperties = { padding: '10px 18px', background: '#C84B0F', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
  const ghost: React.CSSProperties = { ...btn, background: '#F2EDE8', color: '#7A7068' }

  if (loading) return <div style={{ padding: 40, color: '#B0A098', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 820 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1A', margin: '0 0 4px' }}>Delivery Area</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>Draw the zone you deliver to. Customers whose pin falls outside it are asked to join a waitlist instead of ordering.</p>

      <div style={card}>
        <label style={lbl}>Coverage polygon</label>
        {MAPS_KEY ? (
          <>
            <div ref={mapRef} style={{ height: 380, borderRadius: 10, border: '1px solid #EDE8E0', overflow: 'hidden' }} />
            <p style={{ fontSize: 12, color: '#A08070', margin: '10px 0' }}>Click the map to add corner points. Drag a point to adjust. Add them in order (clockwise).</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={ghost} onClick={() => setPoints(p => p.slice(0, -1))}>Undo last point</button>
              <button style={ghost} onClick={() => setPoints([])}>Clear all</button>
              <span style={{ alignSelf: 'center', fontSize: 12.5, color: '#7A7068', fontWeight: 700 }}>{points.length} points</span>
            </div>
          </>
        ) : (
          <div style={{ background: '#FFF8EE', border: '1px solid #F0D9B0', borderRadius: 10, padding: '14px 16px', fontSize: 12.5, color: '#8A6D3B' }}>
            Add your Google Maps key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) to draw the zone on a map. Meanwhile the app uses a default North-Riyadh box.
          </div>
        )}
      </div>

      <div style={card}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>
          <input type="checkbox" checked={enforce} onChange={e => setEnforce(e.target.checked)} style={{ accentColor: '#C84B0F', width: 16, height: 16 }} />
          Enforce the zone (block out-of-area customers)
        </label>
        <p style={{ fontSize: 12, color: '#A08070', margin: '8px 0 0' }}>Turn off to accept orders everywhere (e.g. when you expand).</p>
      </div>

      <div style={card}>
        <label style={lbl}>Homepage note — English</label>
        <input style={{ ...inp, marginBottom: 12 }} value={noteEn} onChange={e => setNoteEn(e.target.value)} placeholder="Now delivering in North Riyadh" />
        <label style={lbl}>Homepage note — Arabic</label>
        <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={noteAr} onChange={e => setNoteAr(e.target.value)} placeholder="نوصّل الآن في شمال الرياض" />
        <p style={{ fontSize: 12, color: '#A08070', margin: '8px 0 0' }}>Shown as a banner on the homepage. Leave both empty to hide it.</p>
      </div>

      <div style={card}>
        <label style={lbl}>Out-of-area message — English</label>
        <textarea style={{ ...inp, minHeight: 70, resize: 'vertical', marginBottom: 12 }} value={oorEn} onChange={e => setOorEn(e.target.value)} placeholder="We currently deliver in North Riyadh only. We've noted your interest and will reach you when we expand." />
        <label style={lbl}>Out-of-area message — Arabic</label>
        <textarea style={{ ...inp, minHeight: 70, resize: 'vertical', direction: 'rtl', textAlign: 'right' }} value={oorAr} onChange={e => setOorAr(e.target.value)} placeholder="نوصّل حالياً في شمال الرياض فقط. سجّلنا اهتمامك وسنتواصل معك فور توسّعنا." />
        <p style={{ fontSize: 12, color: '#A08070', margin: '8px 0 0' }}>Shown to customers whose pin is outside the zone. Leave empty to use the default text.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button style={btn} onClick={saveAll}>Save delivery area</button>
        {msg && <span style={{ color: '#2D6A4F', fontWeight: 700, fontSize: 13 }}>{msg}</span>}
      </div>

      <div style={card}>
        <label style={lbl}>Location change requests ({changeReqs.length})</label>
        {changeReqs.length === 0 ? <p style={{ fontSize: 13, color: '#B0A098' }}>No pending requests.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {changeReqs.map(r => (
              <div key={r.id} style={{ borderBottom: '1px solid #F5F1EC', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <Link href={`/admin/customers/${r.subscriber_id}`} style={{ color: '#1C1C1A', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}>{r.subscribers?.parent_name || 'Customer'}</Link>{' '}
                    <span style={{ color: '#7A7068', fontFamily: 'monospace', fontSize: 12.5 }}>{r.subscribers?.mobile_number || ''}</span>
                    <div style={{ fontSize: 12.5, color: '#4A3C34', marginTop: 2 }}>{r.delivery_address || r.address_details?.national || '—'}</div>
                    {r.address_details?.district && <div style={{ fontSize: 11.5, color: '#A08070' }}>{r.address_details?.region} · {r.address_details?.district}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <button style={{ ...btn, background: '#2D6A4F', padding: '8px 14px' }} onClick={() => approveChange(r)}>Approve</button>
                    <button style={{ ...ghost, padding: '8px 14px' }} onClick={() => rejectChange(r)}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <label style={lbl}>Out-of-area requests ({reqs.length})</label>
        {reqs.length === 0 ? <p style={{ fontSize: 13, color: '#B0A098' }}>No requests yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reqs.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #F5F1EC', paddingBottom: 8 }}>
                <div><Link href={`/admin/customers?q=${encodeURIComponent(r.phone || r.name || '')}`} style={{ color: '#1C1C1A', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}>{r.name}</Link> <span style={{ color: '#7A7068', fontFamily: 'monospace', fontSize: 12.5 }}>{r.phone}</span><div style={{ fontSize: 12, color: '#A08070' }}>{r.area_text || '—'}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button style={{ ...ghost, padding: '7px 12px', fontSize: 12 }} onClick={() => allowRetry(r.phone)}>Allow retry</button>
                  <span style={{ fontSize: 11.5, color: '#B0A098' }}>{new Date(r.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
