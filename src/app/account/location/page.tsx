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
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=ar&region=SA&loading=async&v=weekly`
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
  const [subName, setSubName] = useState('')
  const [subPhone, setSubPhone] = useState('')
  const [leadDone, setLeadDone] = useState(false)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement | null>(null)
  const mapObjRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const leadSentRef = useRef(false)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin?next=/account/location'); return }
    // Onboarding step: collect the delivery location before building the plan.
    setChecking(false)
    // We already have the signed-in customer's name + number — no need to ask
    // again if they turn out to be outside the delivery area.
    supabase.from('subscribers').select('parent_name, mobile_number').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) { setSubName((data as any).parent_name || ''); setSubPhone((data as any).mobile_number || '') }
    })
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
    loadMaps().then(async () => {
      if (cancelled || !mapRef.current) return
      const gmaps = (window as any).google.maps
      const center = { lat: 24.83, lng: 46.68 }
      const map = new gmaps.Map(mapRef.current, { center, zoom: 12, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' })
      const marker = new gmaps.Marker({ position: center, map, draggable: true })
      mapObjRef.current = map
      markerRef.current = marker
      const update = (p: any) => { const lat = p.lat(), lng = p.lng(); setPos({ lat, lng }); reverseGeocode(lat, lng) }
      marker.addListener('dragend', () => update(marker.getPosition()))
      map.addListener('click', (e: any) => { marker.setPosition(e.latLng); update(e.latLng) })
      new gmaps.Polygon({ map, paths: zone.map(([lng, lat]) => ({ lat, lng })), strokeColor: '#2D6A4F', strokeOpacity: 0.8, strokeWeight: 2, fillColor: '#2D6A4F', fillOpacity: 0.08 })
      // New Places API: PlaceAutocompleteElement (the legacy Autocomplete is
      // not available to projects created after March 2025).
      if (searchRef.current) {
        try {
          const places = await gmaps.importLibrary('places')
          searchRef.current.innerHTML = ''
          const pac = new places.PlaceAutocompleteElement({ includedRegionCodes: ['sa'] })
          pac.style.width = '100%'
          searchRef.current.appendChild(pac)
          pac.addEventListener('gmp-select', async (ev: any) => {
            const place = ev.placePrediction.toPlace()
            await place.fetchFields({ fields: ['location', 'formattedAddress'] })
            const loc = place.location
            if (!loc) return
            map.panTo(loc); map.setZoom(15); marker.setPosition(loc)
            setPos({ lat: loc.lat(), lng: loc.lng() })
            setAddress(place.formattedAddress || ''); setNational(place.formattedAddress || '')
          })
        } catch {}
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

  // "Use my current location" — drop the pin on the device's GPS position
  // instead of dragging the red marker manually.
  function useMyLocation() {
    if (!navigator.geolocation) { setError(isAR ? 'المتصفح لا يدعم تحديد الموقع' : 'Your browser does not support location'); return }
    setLocating(true); setError('')
    navigator.geolocation.getCurrentPosition(
      p => {
        setLocating(false)
        const lat = p.coords.latitude, lng = p.coords.longitude
        setPos({ lat, lng })
        reverseGeocode(lat, lng)
        const map = mapObjRef.current, marker = markerRef.current
        if (map && marker) { const ll = { lat, lng }; map.panTo(ll); map.setZoom(16); marker.setPosition(ll) }
      },
      () => { setLocating(false); setError(isAR ? 'تعذّر تحديد موقعك. فعّل إذن الموقع وحاول مجدداً.' : 'Could not get your location. Enable location permission and try again.') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Out-of-area but signed in: record the request automatically using the
  // details we already have — no second form, admin gets notified.
  useEffect(() => {
    if (!blocked || leadSentRef.current) return
    leadSentRef.current = true
    supabase.from('delivery_zone_requests').insert({
      name: subName || null, phone: subPhone || null, area_text: address || null, lat: pos?.lat ?? null, lng: pos?.lng ?? null,
    }).then(() => setLeadDone(true))
  }, [blocked])

  const inp: React.CSSProperties = { width: '100%', padding: '13px 15px', borderRadius: 12, border: '1.5px solid #EAE3D9', fontSize: 14.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', background: '#fff', accentColor: '#C84B0F' }
  const selStyle: React.CSSProperties = {
    ...inp, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23C84B0F' stroke-width='2.2'><path d='M6 9l6 6 6-6'/></svg>\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: isAR ? 'left 14px center' : 'right 14px center', backgroundSize: '18px',
    paddingRight: isAR ? 15 : 40, paddingLeft: isAR ? 40 : 15, cursor: 'pointer',
  }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: '#5A5048', marginBottom: 7 }

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

  if (blocked || leadDone) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 6px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2D6A4F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'شكراً لك!' : 'Thank you!'}</h1>
        <p style={{ fontSize: 13.5, color: '#7A7068', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
          {isAR
            ? 'نحن نوصّل حالياً في شمال الرياض فقط. سجّلنا اهتمامك بالفعل، وسنتواصل معك على رقمك فور توسّعنا إلى منطقتك.'
            : "We currently deliver in North Riyadh only. We've already noted your interest and will reach you on your number as soon as we expand to your area."}
        </p>
        <button style={{ ...btn, background: '#1C1C1A' }} onClick={() => router.push('/')}>{isAR ? 'العودة للرئيسية' : 'Back to home'}</button>
        <button style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#7A7068', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }} onClick={() => { setBlocked(false); setLeadDone(false); leadSentRef.current = false; setError('') }}>{isAR ? 'تعديل الموقع' : 'Change location'}</button>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'موقع التوصيل' : 'Delivery location'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 14 }}>{isAR ? 'حدّد موقعك على الخريطة — نوصّل حالياً في شمال الرياض.' : 'Pin your location on the map — we currently deliver in North Riyadh.'}</p>

      {MAPS_KEY ? (
        <>
          <div ref={searchRef} style={{ marginBottom: 10 }} />
          <button onClick={useMyLocation} disabled={locating} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', marginBottom: 10, background: '#FDF0E8', color: '#C84B0F', border: '1.5px solid #F0C9A8', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: locating ? 0.6 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
            {locating ? (isAR ? 'جار تحديد موقعك…' : 'Locating…') : (isAR ? 'استخدم موقعي الحالي' : 'Use my current location')}
          </button>
          <div ref={mapRef} style={{ height: 280, borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1.5px solid #EDE8E0' }} />
          <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: -4, marginBottom: 12 }}>{isAR ? 'استخدم زر «موقعي الحالي»، أو اضغط على الخريطة لتحديد موقعك.' : 'Use the "current location" button, or tap the map to set your spot.'}</p>
        </>
      ) : (
        <div style={{ height: 110, borderRadius: 12, background: '#F2EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#B0A098', fontSize: 12.5, fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>
          {isAR ? 'سيظهر محدّد الخريطة بعد إضافة مفتاح خرائط جوجل.' : 'The map picker appears once the Google Maps key is added.'}
        </div>
      )}

      {regions.length > 0 && (
        <>
          <label style={lbl}>{isAR ? 'المنطقة' : 'Region'}</label>
          <select style={{ ...selStyle, marginBottom: 12 }} value={regionId} onChange={e => { setRegionId(e.target.value); setDistrictId('') }}>
            <option value="">{isAR ? 'اختر المنطقة' : 'Choose region'}</option>
            {regions.map(r => <option key={r.id} value={r.id}>{isAR ? r.name : (r.name_en || r.name)}</option>)}
          </select>
        </>
      )}
      {regions.length > 0 && (
        <>
          <label style={lbl}>{isAR ? 'الحي' : 'District'}</label>
          <select style={{ ...selStyle, marginBottom: 12 }} value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={districtOptions.length === 0}>
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
