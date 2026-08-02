'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId, clearMockSession } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

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
      supabase.from('site_content').select('key, value').in('key', ['terms_content', 'terms_content_ar']),
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
            setPos({ lat: loc.lat(), lng: loc.lng() }); setNational(place.formattedAddress || '')
          })
        } catch {}
      }
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
    if (!details.trim() && !national.trim()) { showToast(isAR ? 'يرجى إدخال تفاصيل العنوان' : 'Please enter address details'); return }
    setAddressSaving(true)
    const id = getMockSubscriberId()
    const addr = details.trim() || national.trim()
    const { data: cur } = await supabase.from('subscribers').select('address_details').eq('id', id).maybeSingle()
    const detailsObj = { ...((cur as any)?.address_details || {}), lat: pos?.lat ?? null, lng: pos?.lng ?? null, region: regionName(regionId) || savedRegion, district: districtName(districtId) || savedDistrict, national }
    const { error } = await supabase.from('subscribers').update({ delivery_address: addr, address_details: detailsObj }).eq('id', id)
    setAddressSaving(false)
    if (error) { showToast(error.message); return }
    setSavedAddress(addr); setSavedRegion(detailsObj.region); setSavedDistrict(detailsObj.district)
    setEditingAddress(false); showToast(isAR ? 'تم تحديث عنوان التوصيل' : 'Delivery address updated')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '13px 15px', borderRadius: 12, border: '1.5px solid #EAE3D9', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', marginBottom: 14, background: '#fff', accentColor: '#C84B0F' }
  const selStyle: React.CSSProperties = {
    ...inp, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23C84B0F' stroke-width='2.2'><path d='M6 9l6 6 6-6'/></svg>\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: isAR ? 'left 14px center' : 'right 14px center', backgroundSize: '18px',
    paddingRight: isAR ? 15 : 40, paddingLeft: isAR ? 40 : 15, cursor: 'pointer',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: '#5A5048', marginBottom: 7 }
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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>{isAR ? `حسابي` : 'My Account'}</h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '4px 0 0' }}>{parentName ? (isAR ? `مرحباً، ${parentName.split(' ')[0]}` : `Hi, ${parentName.split(' ')[0]}`) : ''}</p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1.5px solid #EDE8E0', color: '#7A7068', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8, padding: '8px 14px' }}>{isAR ? 'تسجيل الخروج' : 'Sign out'}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

      {tab && (
        <div onClick={() => setTab(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(12,26,21,0.28)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FBF8F2', width: '100%', maxWidth: 520, borderRadius: 20, padding: '20px 22px 26px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
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
          <input style={inp} type="date" value={kidBirthDate} onChange={e => setKidBirthDate(e.target.value)} />
          <label style={lbl}>{isAR ? 'البريد الإلكتروني' : 'Email'}</label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          {customFields.map(f => (
            <div key={f.id}>
              <label style={lbl}>{(isAR ? (f.label_ar || f.label_en) : f.label_en)}{f.is_required && <span style={{ color: '#C84B0F' }}> *</span>}</label>
              {f.field_type === 'select' ? (
                <select style={selStyle} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))}>
                  <option value="">{isAR ? 'اختر…' : 'Select…'}</option>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input style={inp} type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))} />
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
                  <div ref={searchRef} style={{ marginBottom: 10 }} />
                  <button onClick={useMyLocation} disabled={locating} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', marginBottom: 12, background: '#FDF0E8', color: '#C84B0F', border: '1.5px solid #F0C9A8', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: locating ? 0.6 : 1 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
                    {locating ? (isAR ? 'جار تحديد موقعك…' : 'Locating…') : (isAR ? 'استخدم موقعي الحالي' : 'Use my current location')}
                  </button>
                  <div ref={mapRef} style={{ height: 260, borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1.5px solid #EDE8E0' }} />
                  <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: -4, marginBottom: 12 }}>{isAR ? 'اضغط على الخريطة أو اسحب الدبوس لتحديد موقعك.' : 'Tap the map or drag the pin to set your spot.'}</p>
                </>
              ) : (
                <div style={{ height: 100, borderRadius: 12, background: '#F2EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#B0A098', fontSize: 12.5, fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>{isAR ? 'سيظهر محدّد الخريطة بعد إضافة مفتاح خرائط جوجل.' : 'The map picker appears once the Google Maps key is added.'}</div>
              )}
              {regions.length > 0 && (
                <>
                  <label style={lbl}>{isAR ? 'المنطقة' : 'Region'}</label>
                  <select style={selStyle} value={regionId} onChange={e => { setRegionId(e.target.value); setDistrictId('') }}>
                    <option value="">{isAR ? 'اختر المنطقة' : 'Choose region'}</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{isAR ? r.name : (r.name_en || r.name)}</option>)}
                  </select>
                  <label style={lbl}>{isAR ? 'الحي' : 'District'}</label>
                  <select style={selStyle} value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={districtOptions.length === 0}>
                    <option value="">{districtOptions.length === 0 ? (isAR ? 'لا توجد أحياء متاحة بعد' : 'No districts available yet') : (isAR ? 'اختر الحي' : 'Choose district')}</option>
                    {districtOptions.map(d => <option key={d.id} value={d.id}>{isAR ? d.name : (d.name_en || d.name)}</option>)}
                  </select>
                </>
              )}
              <label style={lbl}>{isAR ? 'العنوان الوطني (يُملأ تلقائياً من الخريطة)' : 'National address (auto-filled from the map)'}</label>
              <input style={inp} value={national} onChange={e => setNational(e.target.value)} placeholder={isAR ? 'سيُملأ عند تحديد الموقع' : 'Fills when you pin the map'} />
              <label style={lbl}>{isAR ? 'تفاصيل العنوان' : 'Address details'}</label>
              <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={details} onChange={e => setDetails(e.target.value)} placeholder={isAR ? 'المبنى، الشارع، رقم الشقة' : 'Building, street, apartment no.'} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, padding: '12px', background: '#F2EDE8', color: '#5A5048', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setEditingAddress(false)}>{isAR ? 'إلغاء' : 'Cancel'}</button>
                <button style={{ flex: 1, ...btn, opacity: addressSaving ? 0.6 : 1 }} disabled={addressSaving} onClick={saveAddress}>{addressSaving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'حفظ الموقع' : 'Save location')}</button>
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
      )}
    </div>
  )
}
