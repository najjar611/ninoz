'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const DEFAULT_ZONE: [number, number][] = [
  [46.55, 24.95], [46.82, 24.95], [46.82, 24.74], [46.55, 24.74],
]

function pointInPolygon(lat: number, lng: number, poly: [number, number][]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1]
    const xj = poly[j][0], yj = poly[j][1]
    const intersect = (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

let mapsPromise: Promise<void> | null = null
function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject()
  if ((window as any).google?.maps) return Promise.resolve()
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=ar&region=SA`
    s.async = true; s.onload = () => resolve(); s.onerror = () => reject()
    document.head.appendChild(s)
  })
  return mapsPromise
}

type Region = { id: string; name: string; name_en: string | null }
type District = { id: string; region_id: string | null; name: string; name_en: string | null }

export default function Location() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()

  const [checking, setChecking] = useState(true)
  const [address, setAddress] = useState('')
  const [national, setNational] = useState('')
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [zone, setZone] = useState<[number, number][]>(DEFAULT_ZONE)
  const [enforce, setEnforce] = useState(true)
  const [regions, setRegions] = useState<Region[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [regionId, setRegionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadDone, setLeadDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin?next=/account/location'); return }
    // Onboarding step: collect the delivery location before building the plan.
    setChecking(false)
    supabase.from('site_content').select('key, value').in('key', ['delivery_zone_polygon', 'delivery_zone_enforce']).then(({ data }) => {
      const map: Record<string, string> = {}
      ;((data as any[]) || []).forEach(r => { map[r.key] = r.value })
      if (map.delivery_zone_polygon) { try { const p = JSON.parse(map.delivery_zone_polygon); if (Array.isArray(p) && p.length >= 3) setZone(p) } catch {} }
      if (map.delivery_zone_enforce === 'false') setEnforce(false)
    })
    // Admin-managed lists for the dropdowns (defensive: table may not exist yet).
    supabase.from('service_regions').select('id, name, name_en').eq('is_active', true).order('position').then(({ data }) => setRegions((data as any) || []))
    supabase.from('service_districts').select('id, region_id, name, name_en').eq('is_active', true).order('position').then(({ data }) => setDistricts((data as any) || []))
  }, [])

  function reverseGeocode(lat: number, lng: number) {
    const gmaps = (window as any).google?.maps
    if (!gmaps) return
    new gmaps.Geocoder().geocode({ location: { lat, lng } }, (res: any, status: string) => {
      if (status === 'OK' && res?.[0]) { setAddress(res[0].formatted_address); setNational(res[0].formatted_address) }
    })
  }

  useEffect(() => {
    if (checking || !MAPS_KEY || !mapRef.current) return
    let cancelled = false
    loadMaps().then(() => {
      if (cancelled || !mapRef.current) return
      const gmaps = (window as any).google.maps
      const center = { lat: 24.83, lng: 46.68 }
      const map = new gmaps.Map(mapRef.current, { center, zoom: 12, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' })
      const marker = new gmaps.Marker({ position: center, map, draggable: true })
      const update = (p: any) => { const lat = p.lat(), lng = p.lng(); setPos({ lat, lng }); reverseGeocode(lat, lng) }
      marker.addListener('dragend', () => update(marker.getPosition()))
      map.addListener('click', (e: any) => { marker.setPosition(e.latLng); update(e.latLng) })
      new gmaps.Polygon({ map, paths: zone.map(([lng, lat]) => ({ lat, lng })), strokeColor: '#2D6A4F', strokeOpacity: 0.8, strokeWeight: 2, fillColor: '#2D6A4F', fillOpacity: 0.08 })
      if (searchRef.current) {
        const ac = new gmaps.places.Autocomplete(searchRef.current, { componentRestrictions: { country: 'sa' }, fields: ['geometry', 'formatted_address'] })
        ac.addListener('place_changed', () => {
          const place = ac.getPlace(); if (!place.geometry) return
          const loc = place.geometry.location
          map.panTo(loc); map.setZoom(15); marker.setPosition(loc)
          setPos({ lat: loc.lat(), lng: loc.lng() }); setAddress(place.formatted_address || ''); setNational(place.formatted_address || '')
        })
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [checking, zone])

  if (checking) return null

  const districtOptions = districts.filter(d => !regionId || d.region_id === regionId || !d.region_id)
  const regionName = (id: string) => { const r = regions.find(x => x.id === id); return r ? ((isAR ? r.name : (r.name_en || r.name))) : '' }
  const districtName = (id: string) => { const d = districts.find(x => x.id === id); return d ? ((isAR ? d.name : (d.name_en || d.name))) : '' }

  async function save() {
    if (regions.length > 0 && !regionId) { setError(isAR ? 'يرجى اختيار المنطقة' : 'Please choose the region'); return }
    if (districtOptions.length > 0 && !districtId) { setError(isAR ? 'يرجى اختيار الحي' : 'Please choose the district'); return }
    if (!address.trim()) { setError(isAR ? 'يرجى تحديد موقعك على الخريطة أو إدخال العنوان' : 'Please set your location or enter the address'); return }
    if (enforce && pos && !pointInPolygon(pos.lat, pos.lng, zone)) { setBlocked(true); setError(''); return }
    setSaving(true); setError('')
    const id = getMockSubscriberId()
    const { error: err } = await supabase.from('subscribers').update({ delivery_address: address }).eq('id', id)
    if (!err) {
      const { data: cur } = await supabase.from('subscribers').select('address_details').eq('id', id).maybeSingle()
      const details = { ...((cur as any)?.address_details || {}), lat: pos?.lat ?? null, lng: pos?.lng ?? null, region: regionName(regionId), district: districtName(districtId), national }
      await supabase.from('subscribers').update({ address_details: details }).eq('id', id)
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    // Location captured and in range — continue to build the plan.
    router.push('/account/plan')
  }

  async function submitLead() {
    if (!leadName.trim() || !/^0\d{9}$/.test(leadPhone.trim())) { setError(isAR ? 'أدخل اسمك ورقم جوال صحيح (10 أرقام يبدأ بـ 0)' : 'Enter your name and a valid 10-digit number'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('delivery_zone_requests').insert({ name: leadName.trim(), phone: leadPhone.trim(), area_text: address || null, lat: pos?.lat ?? null, lng: pos?.lng ?? null })
    setSaving(false)
    if (err) { setError(err.message); return }
    setLeadDone(true)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', background: '#fff' }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }

  if (subscribed) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 6px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2D6A4F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'تم استلام طلبك!' : 'Order received!'}</h1>
        <p style={{ fontSize: 13.5, color: '#7A7068', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
          {isAR ? 'سنؤكد الدفع خلال ساعة إلى ساعتين ويُفعّل اشتراكك. نخدم حالياً شمال الرياض، وأحياء أخرى قريباً بإذن الله.' : "We'll confirm your payment within 1–2 hours and activate your subscription. We currently serve North Riyadh — more districts are coming soon."}
        </p>
        <button style={btn} onClick={() => router.push('/account/dashboard')}>{isAR ? 'الذهاب إلى خطتي' : 'Go to my plan'}</button>
      </div>
    )
  }

  if (leadDone) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 6px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2D6A4F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'شكراً لك!' : 'Thank you!'}</h1>
        <p style={{ fontSize: 13.5, color: '#7A7068', lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>{isAR ? 'سجّلنا اهتمامك. سنتواصل معك فور توسّعنا إلى منطقتك.' : "We've noted your interest and will reach out as soon as we expand to your area."}</p>
        <button style={{ ...btn, background: '#1C1C1A' }} onClick={() => router.push('/')}>{isAR ? 'العودة للرئيسية' : 'Back to home'}</button>
      </div>
    )
  }

  if (blocked) {
    return (
      <div style={{ padding: '10px 4px' }}>
        <div style={{ background: '#FFF8EE', border: '1.5px solid #F0D9B0', borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'لا نصل إلى منطقتك بعد' : "We don't reach your area yet"}</h1>
          <p style={{ fontSize: 13.5, color: '#7A7068', lineHeight: 1.6 }}>{isAR ? 'نحن نوصّل حالياً في شمال الرياض فقط. اترك رقمك وسنبلغك فور توسّعنا إليك.' : "We currently deliver in North Riyadh only. Leave your number and we'll notify you when we expand."}</p>
        </div>
        <label style={lbl}>{isAR ? 'الاسم' : 'Name'}</label>
        <input style={{ ...inp, marginBottom: 12 }} value={leadName} onChange={e => setLeadName(e.target.value)} placeholder={isAR ? 'اسمك' : 'Your name'} />
        <label style={lbl}>{isAR ? 'رقم الجوال' : 'Mobile number'}</label>
        <input style={inp} value={leadPhone} onChange={e => setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="05xxxxxxxx" />
        {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
        <button style={{ ...btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={submitLead}>{saving ? (isAR ? 'جار الإرسال…' : 'Sending…') : (isAR ? 'أبلغوني عند التوسّع' : 'Notify me when you expand')}</button>
        <button style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#7A7068', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }} onClick={() => { setBlocked(false); setError('') }}>{isAR ? 'تعديل الموقع' : 'Change location'}</button>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'موقع التوصيل' : 'Delivery location'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 14 }}>{isAR ? 'حدّد موقعك على الخريطة — نوصّل حالياً في شمال الرياض.' : 'Pin your location on the map — we currently deliver in North Riyadh.'}</p>

      {MAPS_KEY ? (
        <>
          <input ref={searchRef} style={{ ...inp, marginBottom: 10 }} placeholder={isAR ? 'ابحث عن موقعك…' : 'Search for your location…'} />
          <div ref={mapRef} style={{ height: 280, borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1.5px solid #EDE8E0' }} />
          <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: -4, marginBottom: 12 }}>{isAR ? 'اضغط على الخريطة أو اسحب الدبوس لتحديد موقعك.' : 'Tap the map or drag the pin to set your spot.'}</p>
        </>
      ) : (
        <div style={{ height: 110, borderRadius: 12, background: '#F2EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#B0A098', fontSize: 12.5, fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>
          {isAR ? 'سيظهر محدّد الخريطة بعد إضافة مفتاح خرائط جوجل.' : 'The map picker appears once the Google Maps key is added.'}
        </div>
      )}

      {regions.length > 0 && (
        <>
          <label style={lbl}>{isAR ? 'المنطقة' : 'Region'}</label>
          <select style={{ ...inp, marginBottom: 12 }} value={regionId} onChange={e => { setRegionId(e.target.value); setDistrictId('') }}>
            <option value="">{isAR ? 'اختر المنطقة' : 'Choose region'}</option>
            {regions.map(r => <option key={r.id} value={r.id}>{isAR ? r.name : (r.name_en || r.name)}</option>)}
          </select>
        </>
      )}
      {regions.length > 0 && (
        <>
          <label style={lbl}>{isAR ? 'الحي' : 'District'}</label>
          <select style={{ ...inp, marginBottom: 12 }} value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={districtOptions.length === 0}>
            <option value="">{districtOptions.length === 0 ? (isAR ? 'لا توجد أحياء متاحة بعد' : 'No districts available yet') : (isAR ? 'اختر الحي' : 'Choose district')}</option>
            {districtOptions.map(d => <option key={d.id} value={d.id}>{isAR ? d.name : (d.name_en || d.name)}</option>)}
          </select>
        </>
      )}

      <label style={lbl}>{isAR ? 'العنوان الوطني (يُملأ تلقائياً من الخريطة)' : 'National address (auto-filled from the map)'}</label>
      <input style={{ ...inp, marginBottom: 12 }} value={national} onChange={e => setNational(e.target.value)} placeholder={isAR ? 'سيُملأ عند تحديد الموقع' : 'Fills when you pin the map'} />

      <label style={lbl}>{isAR ? 'تفاصيل العنوان' : 'Address details'}</label>
      <textarea style={{ ...inp, height: 70, resize: 'vertical' }} placeholder={isAR ? 'المبنى، الشارع، رقم الشقة' : 'Building, street, apartment no.'} value={address} onChange={e => setAddress(e.target.value)} />
      {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
      <button style={{ ...btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>{saving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'التالي' : 'Continue')}</button>
    </div>
  )
}
