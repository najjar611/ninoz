'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId, clearMockSession } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'
import DateField from '@/components/DateField'
import BrandSelect from '@/components/BrandSelect'
import PlaceSearch from '@/components/PlaceSearch'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const DEFAULT_ZONE: [number, number][] = [[46.55, 24.95], [46.82, 24.95], [46.82, 24.74], [46.55, 24.74]]
function pointInPolygon(lat: number, lng: number, poly: [number, number][]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
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
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=ar&region=SA&v=weekly`
    s.async = true; s.onload = () => resolve(); s.onerror = () => reject()
    document.head.appendChild(s)
  })
  return mapsPromise
}

type Sub = {
  id: string; start_date: string; status: string; total_price: number; stage_id: string
  stages: { name: string; name_ar?: string | null; emoji: string } | null
  payment_cycles: { label: string; label_ar?: string | null; days: number; meals_total: number } | null
}
type Subscriber = {
  id: string; parent_name: string | null; kid_name: string | null; email: string | null
  kid_birth_date: string | null; delivery_address: string | null; address_details: any
}
type CustomField = {
  id: string; field_key: string; label_en: string; label_ar: string | null
  field_type: 'text' | 'number' | 'date' | 'select'; options: string[] | null; is_required: boolean
}
type Region = { id: string; name: string; name_en: string | null }
type District = { id: string; region_id: string | null; name: string; name_en: string | null }
type Tab = 'profile' | 'address' | 'history' | 'terms'

export default function Account() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const [tab, setTab] = useState<Tab | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [email, setEmail] = useState('')
  const [kidBirthDate, setKidBirthDate] = useState('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [history, setHistory] = useState<Sub[]>([])

  // Address
  const [editingAddress, setEditingAddress] = useState(false)
  const [regions, setRegions] = useState<Region[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [regionId, setRegionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [national, setNational] = useState('')
  const [details, setDetails] = useState('')
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [savedAddress, setSavedAddress] = useState('')
  const [savedRegion, setSavedRegion] = useState('')
  const [savedDistrict, setSavedDistrict] = useState('')
  const [addressSaving, setAddressSaving] = useState(false)
  const [zone, setZone] = useState<[number, number][]>(DEFAULT_ZONE)
  const [enforce, setEnforce] = useState(true)

  // Terms
  const [termsContent, setTermsContent] = useState('')

  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement | null>(null)
  const mapObjRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }
    const [subscriberRes, cfRes, historyRes, regionsRes, districtsRes, termsRes] = await Promise.all([
      supabase.from('subscribers').select('id, parent_name, kid_name, email, kid_birth_date, delivery_address, address_details').eq('id', id).single(),
      supabase.from('customer_fields').select('*').eq('is_active', true).order('position'),
      supabase.from('subscriptions').select('id, start_date, status, total_price, stage_id, stages(name, name_ar, emoji), payment_cycles(label, label_ar, days, meals_total)').eq('subscriber_id', id).order('created_at', { ascending: false }),
      supabase.from('service_regions').select('id, name, name_en').eq('is_active', true).order('position'),
      supabase.from('service_districts').select('id, region_id, name, name_en').eq('is_active', true).order('position'),
      supabase.from('site_content').select('key, value').in('key', ['terms_content', 'terms_content_ar', 'delivery_zone_polygon', 'delivery_zone_enforce']),
    ])
    if (subscriberRes.data) {
      const s = subscriberRes.data as Subscriber
      setParentName(s.parent_name || '')
      setKidName(s.kid_name || '')
      setEmail(s.email || '')
      setKidBirthDate(s.kid_birth_date || '')
      setExtra((s as any).extra_fields || {})
      setSavedAddress(s.delivery_address || '')
      const ad = s.address_details || {}
      setSavedRegion(ad.region || '')
      setSavedDistrict(ad.district || '')
      setNational(ad.national || '')
      setDetails(s.delivery_address || '')
      if (ad.lat && ad.lng) setPos({ lat: ad.lat, lng: ad.lng })
    }
    setCustomFields(cfRes.data || [])
    setHistory((historyRes.data as any) || [])
    setRegions((regionsRes.data as any) || [])
    setDistricts((districtsRes.data as any) || [])
    const tmap: Record<string, string> = {}
    ;((termsRes.data as any[]) || []).forEach(r => { tmap[r.key] = r.value })
    setTermsContent((isAR ? tmap.terms_content_ar : tmap.terms_content) || tmap.terms_content || tmap.terms_content_ar || '')
    if (tmap.delivery_zone_polygon) { try { const pz = JSON.parse(tmap.delivery_zone_polygon); if (Array.isArray(pz) && pz.length >= 3) setZone(pz) } catch {} }
    if (tmap.delivery_zone_enforce === 'false') setEnforce(false)
    setLoading(false)
  }

  const districtOptions = districts.filter(d => !regionId || d.region_id === regionId || !d.region_id)
  const regionName = (id: string) => { const r = regions.find(x => x.id === id); return r ? (isAR ? r.name : (r.name_en || r.name)) : '' }
  const districtName = (id: string) => { const d = districts.find(x => x.id === id); return d ? (isAR ? d.name : (d.name_en || d.name)) : '' }

  function reverseGeocode(lat: number, lng: number) {
    const gmaps = (window as any).google?.maps
    if (!gmaps) return
    new gmaps.Geocoder().geocode({ location: { lat, lng } }, (res: any, status: string) => {
      if (status === 'OK' && res?.[0]) setNational(res[0].formatted_address)
    })
  }

  useEffect(() => {
    if (!editingAddress || !MAPS_KEY || !mapRef.current) return
    let cancelled = false
    loadMaps().then(async () => {
      if (cancelled || !mapRef.current) return
      const gmaps = (window as any).google.maps
      const center = pos || { lat: 24.83, lng: 46.68 }
      const map = new gmaps.Map(mapRef.current, { center, zoom: pos ? 15 : 12, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' })
      const marker = new gmaps.Marker({ position: center, map, draggable: true })
      mapObjRef.current = map
      markerRef.current = marker
      // The map lives inside a modal that may still be sizing when it inits —
      // nudge it once laid out so tiles render instead of showing blank.
      setTimeout(() => { gmaps.event.trigger(map, 'resize'); map.setCenter(center) }, 300)
      const update = (p: any) => { const lat = p.lat(), lng = p.lng(); setPos({ lat, lng }); reverseGeocode(lat, lng) }
      marker.addListener('dragend', () => update(marker.getPosition()))
      map.addListener('click', (e: any) => { marker.setPosition(e.latLng); update(e.latLng) })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [editingAddress])

  function useMyLocation() {
    if (!navigator.geolocation) { showToast(isAR ? 'المتصفح لا يدعم تحديد الموقع' : 'Location not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      p => {
        setLocating(false)
        const lat = p.coords.latitude, lng = p.coords.longitude
        setPos({ lat, lng }); reverseGeocode(lat, lng)
        const map = mapObjRef.current, marker = markerRef.current
        if (map && marker) { const ll = { lat, lng }; map.panTo(ll); map.setZoom(16); marker.setPosition(ll) }
      },
      () => { setLocating(false); showToast(isAR ? 'تعذّر تحديد موقعك' : 'Could not get your location') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function logout() { clearMockSession(); router.push('/account/signin') }
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2600) }

  async function saveProfile() {
    if (!parentName.trim() || !kidName.trim()) { setProfileMsg(isAR ? 'يرجى إدخال اسمك واسم طفلك' : "Please fill in your name and your baby's name"); return }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setProfileMsg(isAR ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address'); return }
    const missing = customFields.find(f => f.is_required && !(extra[f.field_key] || '').trim())
    if (missing) { setProfileMsg(isAR ? `الحقل "${missing.label_ar || missing.label_en}" مطلوب` : `"${missing.label_en}" is required`); return }
    setProfileSaving(true); setProfileMsg('')
    const id = getMockSubscriberId()
    const { error } = await supabase.from('subscribers').update({ parent_name: parentName, kid_name: kidName, email: email.trim() || null, kid_birth_date: kidBirthDate || null, extra_fields: extra }).eq('id', id)
    setProfileSaving(false)
    if (error) {
      const dup = (error as any).code === '23505' || /duplicate key/i.test(error.message)
      setProfileMsg(dup ? (isAR ? 'هذا البريد الإلكتروني مستخدم بالفعل' : 'That email is already in use') : error.message)
      return
    }
    setProfileMsg(''); showToast(isAR ? 'تم حفظ ملفك' : 'Profile saved')
  }

  async function saveAddress() {
    if (regions.length > 0 && !regionId) { showToast(isAR ? 'يرجى اختيار المنطقة' : 'Please choose the region'); return }
    if (!national.trim() && !pos) { showToast(isAR ? 'يرجى تحديد موقعك على الخريطة' : 'Please set your location on the map'); return }
    // Subscribers can only move to a spot INSIDE the delivery area.
    if (enforce && pos && !pointInPolygon(pos.lat, pos.lng, zone)) {
      showToast(isAR ? 'لا يمكن تغيير الموقع لمكان خارج منطقة التوصيل' : "That location is outside the delivery area — change isn't possible")
      return
    }
    setAddressSaving(true)
    const id = getMockSubscriberId()
    const addr = national.trim() || details.trim()
    const detailsObj = { lat: pos?.lat ?? null, lng: pos?.lng ?? null, region: regionName(regionId) || savedRegion, district: districtName(districtId) || savedDistrict, national, note: details.trim() || null }
    // Do NOT change the address directly — file a request for admin approval.
    const { error } = await supabase.from('address_change_requests').insert({
      subscriber_id: id, delivery_address: addr, address_details: detailsObj, status: 'pending',
    })
    setAddressSaving(false)
    if (error) { showToast(error.message); return }
    setEditingAddress(false)
    showToast(isAR ? 'تم إرسال طلب تغيير الموقع — بانتظار موافقة الإدارة' : 'Location change requested — pending admin approval')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 11, border: '1.5px solid #EAE3D9', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', marginBottom: 14, background: '#fff', accentColor: '#C84B0F' }
  const selStyle: React.CSSProperties = {
    ...inp, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23C84B0F' stroke-width='2.2'><path d='M6 9l6 6 6-6'/></svg>\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: isAR ? 'left 14px center' : 'right 14px center', backgroundSize: '18px',
    paddingRight: isAR ? 15 : 40, paddingLeft: isAR ? 40 : 15, cursor: 'pointer',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 800, color: '#5A5048', marginBottom: 6 }
  const btn: React.CSSProperties = { padding: '13px 22px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

  if (loading) return <div style={{ textAlign: 'center', color: '#7A7068', padding: 20 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>

  const tabs: { key: Tab; en: string; ar: string }[] = [
    { key: 'profile', en: 'Profile', ar: 'الملف الشخصي' },
    { key: 'address', en: 'My Location', ar: 'موقعي' },
    { key: 'history', en: 'History', ar: 'السجل' },
    { key: 'terms', en: 'Terms', ar: 'الشروط والأحكام' },
  ]

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 4000, background: '#1C1C1A', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, boxShadow: '0 12px 30px rgba(0,0,0,0.25)', maxWidth: '90vw' }}>{toast}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>{isAR ? `حسابي` : 'My Account'}</h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '4px 0 0' }}>{parentName ? (isAR ? `مرحباً، ${parentName.split(' ')[0]}` : `Hi, ${parentName.split(' ')[0]}`) : ''}</p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1.5px solid #EDE8E0', color: '#7A7068', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8, padding: '8px 14px' }}>{isAR ? 'تسجيل الخروج' : 'Sign out'}</button>
      </div>

      <div className="nz-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { if (t.key === 'address') setEditingAddress(false); setTab(t.key) }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: isAR ? 'right' : 'left',
            padding: '16px 18px', background: '#fff', border: '1.5px solid #EDE8E0', borderRadius: 12,
            color: '#1C1C1A', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span>{isAR ? t.ar : t.en}</span>
          </button>
        ))}
      </div>

      {tab && mounted && createPortal(
        <div onClick={() => setTab(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(8,18,14,0.62)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Baloo Bhaijaan 2','Tajawal',sans-serif" }}>
          <div onClick={e => e.stopPropagation()} dir={isAR ? 'rtl' : 'ltr'} style={{ background: '#FBF8F2', width: '100%', maxWidth: 520, borderRadius: '22px 22px 0 0', padding: '14px 22px 30px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -18px 60px rgba(0,0,0,0.45)', animation: 'nzSheetUp .3s cubic-bezier(.16,1,.3,1)' }}>
            <style>{`@keyframes nzSheetUp{from{transform:translateY(40px);opacity:.5}to{transform:translateY(0);opacity:1}}`}</style>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: '#E2D8CB', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>{isAR ? (tabs.find(t => t.key === tab)?.ar) : (tabs.find(t => t.key === tab)?.en)}</h2>
              <button onClick={() => setTab(null)} style={{ background: '#F2EDE8', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 800, color: '#5A5048', cursor: 'pointer', fontFamily: 'inherit' }}>{isAR ? 'إغلاق' : 'Close'}</button>
            </div>

      {tab === 'profile' && (
        <div style={{ maxWidth: 480 }}>
          <label style={lbl}>{isAR ? 'اسمك' : 'Your Name'}</label>
          <input style={inp} value={parentName} onChange={e => setParentName(e.target.value)} />
          <label style={lbl}>{isAR ? 'اسم الطفل' : "Baby's Name"}</label>
          <input style={inp} value={kidName} onChange={e => setKidName(e.target.value)} />
          <label style={lbl}>{isAR ? 'تاريخ ميلاد الطفل' : "Baby's Birth Date"}</label>
          <DateField value={kidBirthDate} onChange={setKidBirthDate} isAR={isAR} max={new Date().toISOString().slice(0, 10)} placeholder={isAR ? 'اختر التاريخ' : 'Select date'} />
          <label style={lbl}>{isAR ? 'البريد الإلكتروني' : 'Email'}<span style={{ color: '#B0A098', fontWeight: 600 }}> {isAR ? '(اختياري)' : '(optional)'}</span></label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          {customFields.map(f => (
            <div key={f.id}>
              <label style={lbl}>{(isAR ? (f.label_ar || f.label_en) : f.label_en)}{f.is_required && <span style={{ color: '#C84B0F' }}> *</span>}</label>
              {f.field_type === 'select' ? (
                <BrandSelect isAR={isAR} value={extra[f.field_key] || ''} onChange={v => setExtra(prev => ({ ...prev, [f.field_key]: v }))} placeholder={isAR ? 'اختر…' : 'Select…'} options={(f.options || []).map(o => ({ value: o, label: o }))} />
              ) : f.field_type === 'date' ? (
                <DateField value={extra[f.field_key] || ''} onChange={v => setExtra(prev => ({ ...prev, [f.field_key]: v }))} isAR={isAR} placeholder={isAR ? 'اختر التاريخ' : 'Select date'} />
              ) : (
                <input style={inp} type={f.field_type === 'number' ? 'number' : 'text'} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))} />
              )}
            </div>
          ))}
          {profileMsg && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{profileMsg}</div>}
          <button style={{ ...btn, opacity: profileSaving ? 0.6 : 1 }} disabled={profileSaving} onClick={saveProfile}>{profileSaving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'حفظ التغييرات' : 'Save Changes')}</button>
        </div>
      )}

      {tab === 'address' && (
        <div style={{ maxWidth: 480 }}>
          {!editingAddress ? (
            <>
              <div style={{ background: '#fff', border: '1.5px solid #EDE8E0', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 8 }}>{isAR ? 'موقع التوصيل الحالي' : 'Current delivery location'}</div>
                {savedAddress || savedRegion ? (
                  <>
                    {(savedRegion || savedDistrict) && <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1A', marginBottom: 4 }}>{[savedRegion, savedDistrict].filter(Boolean).join(' — ')}</div>}
                    {national && <div style={{ fontSize: 13, color: '#5A5048', marginBottom: 4 }}>{national}</div>}
                    <div style={{ fontSize: 13, color: '#5A5048', lineHeight: 1.6 }}>{savedAddress}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#B0A098' }}>{isAR ? 'لم تُحدَّد بعد.' : 'Not set yet.'}</div>
                )}
              </div>
              <button style={{ ...btn, width: '100%' }} onClick={() => { setEditingAddress(true); const r = regions.find(x => (isAR ? x.name : (x.name_en || x.name)) === savedRegion); if (r) setRegionId(r.id) }}>{isAR ? 'طلب تغيير الموقع' : 'Request location change'}</button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 14 }}>{isAR ? 'حدّث موقعك بالخريطة والقوائم أدناه.' : 'Update your location with the map and menus below.'}</p>
              {MAPS_KEY ? (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <PlaceSearch isAR={isAR}
                      onSelect={({ lat, lng, address: addr }) => {
                        setPos({ lat, lng }); setNational(addr)
                        const m = mapObjRef.current, mk = markerRef.current
                        if (m && mk) { const ll = { lat, lng }; m.panTo(ll); m.setZoom(15); mk.setPosition(ll) }
                      }}
                      rightSlot={
                        <button onClick={useMyLocation} disabled={locating} title={isAR ? 'استخدم موقعي الحالي' : 'Use my current location'} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: '#FDF0E8', color: '#C84B0F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: locating ? 0.5 : 1 }}>
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
                        </button>
                      }
                    />
                  </div>
                  <div ref={mapRef} style={{ height: 220, borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1.5px solid #EDE8E0' }} />
                  <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: -4, marginBottom: 12 }}>{isAR ? 'اضغط على الخريطة أو اسحب الدبوس لتحديد موقعك.' : 'Tap the map or drag the pin to set your spot.'}</p>
                </>
              ) : (
                <div style={{ height: 100, borderRadius: 12, background: '#F2EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#B0A098', fontSize: 12.5, fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>{isAR ? 'سيظهر محدّد الخريطة بعد إضافة مفتاح خرائط جوجل.' : 'The map picker appears once the Google Maps key is added.'}</div>
              )}
              {regions.length > 0 && (
                <>
                  <label style={lbl}>{isAR ? 'المنطقة' : 'Region'}</label>
                  <BrandSelect isAR={isAR} value={regionId} onChange={v => { setRegionId(v); setDistrictId('') }} placeholder={isAR ? 'اختر المنطقة' : 'Choose region'} options={regions.map(r => ({ value: r.id, label: isAR ? r.name : (r.name_en || r.name) }))} />
                  <label style={lbl}>{isAR ? 'الحي' : 'District'}</label>
                  <BrandSelect isAR={isAR} value={districtId} onChange={setDistrictId} disabled={districtOptions.length === 0} placeholder={districtOptions.length === 0 ? (isAR ? 'لا توجد أحياء متاحة بعد' : 'No districts available yet') : (isAR ? 'اختر الحي' : 'Choose district')} options={districtOptions.map(d => ({ value: d.id, label: isAR ? d.name : (d.name_en || d.name) }))} />
                </>
              )}
              <label style={lbl}>{isAR ? 'العنوان الوطني (يُملأ تلقائياً من الخريطة)' : 'National address (auto-filled from the map)'}</label>
              <input style={{ ...inp, background: pos ? '#F5F1EC' : '#fff', color: pos ? '#7A7068' : '#1C1C1A' }} value={national} readOnly={!!pos} onChange={e => setNational(e.target.value)} placeholder={isAR ? 'سيُملأ عند تحديد الموقع' : 'Fills when you pin the map'} />
              <label style={lbl}>{isAR ? 'تفاصيل العنوان' : 'Address details'}</label>
              <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={details} onChange={e => setDetails(e.target.value)} placeholder={isAR ? 'المبنى، الشارع، رقم الشقة' : 'Building, street, apartment no.'} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, padding: '12px', background: '#F2EDE8', color: '#5A5048', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setEditingAddress(false)}>{isAR ? 'إلغاء' : 'Cancel'}</button>
                <button style={{ flex: 1, ...btn, opacity: addressSaving ? 0.6 : 1 }} disabled={addressSaving} onClick={saveAddress}>{addressSaving ? (isAR ? 'جار الإرسال…' : 'Sending…') : (isAR ? 'طلب تغيير' : 'Request a change')}</button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 && <p style={{ fontSize: 13, color: '#7A7068' }}>{isAR ? 'لا يوجد سجل اشتراكات' : 'No subscription history yet'}</p>}
          {history.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>{(isAR && h.stages?.name_ar) || h.stages?.name}</div>
                <div style={{ fontSize: 12.5, color: '#7A7068' }}>{(isAR && h.payment_cycles?.label_ar) || h.payment_cycles?.label} · {new Date(h.start_date).toLocaleDateString(isAR ? 'ar' : 'en')}</div>
              </div>
              <div style={{ textAlign: isAR ? 'left' : 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>{h.total_price} {isAR ? 'ريال' : 'SAR'}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: h.status === 'active' ? '#E8F5EE' : h.status === 'frozen' ? '#E0F0FA' : '#F3F1ED', color: h.status === 'active' ? '#2D6A4F' : h.status === 'frozen' ? '#1E6091' : '#7A7068' }}>{h.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'terms' && (
        <div style={{ maxWidth: 560 }}>
          {termsContent.trim() ? (
            <div style={{ fontSize: 13.5, color: '#3A342E', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{termsContent}</div>
          ) : (
            <p style={{ fontSize: 13, color: '#B0A098' }}>{isAR ? 'لم تُضَف الشروط والأحكام بعد.' : 'Terms & Conditions have not been added yet.'}</p>
          )}
        </div>
      )}
          </div>
        </div>
      , document.body)}
    </div>
  )
}
