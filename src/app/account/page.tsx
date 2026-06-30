'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId, clearMockSession } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

type Sub = {
  id: string; start_date: string; status: string; total_price: number; stage_id: string
  stages: { name: string; name_ar?: string | null; emoji: string } | null
  payment_cycles: { label: string; label_ar?: string | null; days: number; meals_total: number } | null
}
type Freeze = { id: string; freeze_start: string; freeze_end: string; status: string }
type Subscriber = {
  id: string; parent_name: string | null; kid_name: string | null; email: string | null
  kid_birth_date: string | null; delivery_address: string | null; extra_fields: Record<string, string> | null
}
type CustomField = {
  id: string; field_key: string; label_en: string; label_ar: string | null
  field_type: 'text' | 'number' | 'date' | 'select'; options: string[] | null; is_required: boolean
}
type Allergen = { id: string; name: string; name_ar?: string | null }
type Tab = 'plan' | 'profile' | 'address' | 'history'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const [tab, setTab] = useState<Tab>('plan')
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<Sub | null>(null)
  const [freeze, setFreeze] = useState<Freeze | null>(null)
  const [freezing, setFreezing] = useState(false)
  const [tomorrowMeal, setTomorrowMeal] = useState<{ name: string; name_ar?: string | null; emoji?: string } | null>(null)
  const [history, setHistory] = useState<Sub[]>([])
  const [msg, setMsg] = useState('')

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [email, setEmail] = useState('')
  const [kidBirthDate, setKidBirthDate] = useState('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [address, setAddress] = useState('')
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressMsg, setAddressMsg] = useState('')

  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [allergensSaving, setAllergensSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }

    const [subRes, subscriberRes, cfRes, allergenRes, subAllergenRes, historyRes] = await Promise.all([
      supabase.from('subscriptions').select('id, start_date, status, total_price, stage_id, stages(name, name_ar, emoji), payment_cycles(label, label_ar, days, meals_total)')
        .eq('subscriber_id', id).in('status', ['active', 'frozen']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('subscribers').select('id, parent_name, kid_name, email, kid_birth_date, delivery_address, extra_fields').eq('id', id).single(),
      supabase.from('customer_fields').select('*').eq('is_active', true).order('position'),
      supabase.from('allergens').select('id, name, name_ar'),
      supabase.from('subscriber_allergens').select('allergen_id').eq('subscriber_id', id),
      supabase.from('subscriptions').select('id, start_date, status, total_price, stage_id, stages(name, name_ar, emoji), payment_cycles(label, label_ar, days, meals_total)')
        .eq('subscriber_id', id).order('created_at', { ascending: false }),
    ])

    setSub(subRes.data as any)
    setHistory((historyRes.data as any) || [])

    if (subscriberRes.data) {
      const s = subscriberRes.data as Subscriber
      setSubscriber(s)
      setParentName(s.parent_name || '')
      setKidName(s.kid_name || '')
      setEmail(s.email || '')
      setKidBirthDate(s.kid_birth_date || '')
      setExtra(s.extra_fields || {})
      setAddress(s.delivery_address || '')
    }
    setCustomFields(cfRes.data || [])
    setAllergens(allergenRes.data || [])
    setSelectedAllergens(((subAllergenRes.data as any) || []).map((a: any) => a.allergen_id))

    if (subRes.data) {
      const { data: fz } = await supabase.from('freeze_requests').select('*').eq('subscription_id', subRes.data.id).eq('status', 'active').maybeSingle()
      setFreeze(fz as any)
      const { data: dm } = await supabase.from('daily_menu').select('meals(name, name_ar, emoji)').eq('stage_id', (subRes.data as any).stage_id).eq('menu_date', (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })()).maybeSingle()
      if (dm?.meals) setTomorrowMeal(dm.meals as any)
    }
    setLoading(false)
  }

  function daysInfo() {
    if (!sub?.start_date || !sub.payment_cycles) return null
    const start = new Date(sub.start_date)
    const totalDays = sub.payment_cycles.days
    const end = new Date(start); end.setDate(end.getDate() + totalDays)
    const today = new Date()
    const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000))
    const remaining = Math.max(0, totalDays - elapsed)
    return { totalDays, remaining, end }
  }

  function canFreezeNow() {
    if (!sub) return false
    const start = new Date(sub.start_date)
    const hoursUntilStart = (start.getTime() - Date.now()) / 3600000
    return hoursUntilStart > 48 || hoursUntilStart < 0
  }

  async function requestFreeze() {
    if (!sub) return
    if (!canFreezeNow()) { setMsg(isAR ? 'يجب طلب التجميد قبل 48 ساعة على الأقل من وجبتك القادمة' : 'Freeze must be requested at least 48 hours before your next meal'); return }
    setFreezing(true)
    const start = new Date()
    const end = new Date(); end.setDate(end.getDate() + 7)
    const { error } = await supabase.from('freeze_requests').insert({
      subscription_id: sub.id, freeze_start: start.toISOString().slice(0, 10), freeze_end: end.toISOString().slice(0, 10),
    })
    if (!error) await supabase.from('subscriptions').update({ status: 'frozen' }).eq('id', sub.id)
    setFreezing(false)
    setMsg(error ? error.message : (isAR ? 'تم تجميد الخطة لمدة 7 أيام' : 'Plan frozen for 7 days'))
    load()
  }

  async function resume() {
    if (!sub || !freeze) return
    setFreezing(true)
    await supabase.from('freeze_requests').update({ status: 'cancelled' }).eq('id', freeze.id)
    await supabase.from('subscriptions').update({ status: 'active' }).eq('id', sub.id)
    setFreezing(false)
    setMsg(isAR ? 'تم استئناف الخطة' : 'Plan resumed')
    load()
  }

  function logout() {
    clearMockSession()
    router.push('/account/signin')
  }

  async function saveProfile() {
    if (!parentName.trim() || !kidName.trim()) {
      setProfileMsg(isAR ? 'يرجى إدخال اسمك واسم طفلك' : "Please fill in your name and your baby's name")
      return
    }
    const missing = customFields.find(f => f.is_required && !(extra[f.field_key] || '').trim())
    if (missing) {
      setProfileMsg(isAR ? `الحقل "${missing.label_ar || missing.label_en}" مطلوب` : `"${missing.label_en}" is required`)
      return
    }
    setProfileSaving(true)
    setProfileMsg('')
    const id = getMockSubscriberId()
    const { error } = await supabase.from('subscribers').update({
      parent_name: parentName, kid_name: kidName, child_name: kidName, email, kid_birth_date: kidBirthDate || null, extra_fields: extra,
    }).eq('id', id)
    setProfileSaving(false)
    setProfileMsg(error ? error.message : (isAR ? 'تم الحفظ' : 'Saved'))
  }

  async function saveAddress() {
    if (!address.trim()) return
    setAddressSaving(true)
    const id = getMockSubscriberId()
    const { error } = await supabase.from('subscribers').update({ delivery_address: address }).eq('id', id)
    setAddressSaving(false)
    setAddressMsg(error ? error.message : (isAR ? 'تم تحديث عنوان التوصيل' : 'Delivery address updated'))
  }

  async function toggleAllergen(allergenId: string) {
    const id = getMockSubscriberId()
    if (!id) return
    const isSelected = selectedAllergens.includes(allergenId)
    setAllergensSaving(true)
    if (isSelected) {
      await supabase.from('subscriber_allergens').delete().eq('subscriber_id', id).eq('allergen_id', allergenId)
      setSelectedAllergens(prev => prev.filter(a => a !== allergenId))
    } else {
      await supabase.from('subscriber_allergens').insert({ subscriber_id: id, allergen_id: allergenId })
      setSelectedAllergens(prev => [...prev, allergenId])
    }
    setAllergensSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', marginBottom: 14 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }
  const btn: React.CSSProperties = { padding: '13px 22px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

  if (loading) return <div style={{ textAlign: 'center', color: '#7A7068', padding: 20 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>

  const info = daysInfo()

  const tabs: { key: Tab; en: string; ar: string }[] = [
    { key: 'plan', en: 'Plan', ar: 'الخطة' },
    { key: 'profile', en: 'Profile', ar: 'الملف الشخصي' },
    { key: 'address', en: 'Address', ar: 'العنوان' },
    { key: 'history', en: 'History', ar: 'السجل' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>
            {isAR ? `أهلاً، ${parentName || ''}` : `Welcome${parentName ? ', ' + parentName.split(' ')[0] : ''}`} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '4px 0 0' }}>
            {kidName ? (isAR ? `وجبات ${kidName} في طريقها` : `${kidName}'s meals are on the way`) : ''}
          </p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1.5px solid #EDE8E0', color: '#7A7068', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8, padding: '8px 14px' }}>{isAR ? 'تسجيل الخروج' : 'Sign out'}</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 22, borderBottom: '1.5px solid #EDE8E0', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2.5px solid #C84B0F' : '2.5px solid transparent',
            color: tab === t.key ? '#C84B0F' : '#7A7068', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>
            {isAR ? t.ar : t.en}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        !sub ? (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'لا توجد خطة نشطة بعد' : 'No active plan yet'}</h2>
            <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>{isAR ? 'لنجهز وجبات طفلك.' : "Let's get your baby's meals set up."}</p>
            <button onClick={() => router.push('/account/plan')} style={btn}>{isAR ? 'اختر خطة' : 'Choose a Plan'}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div style={{ background: '#FDF0E8', borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
                <div style={{ fontSize: 28 }}>{sub.stages?.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#1C1C1A', marginTop: 4 }}>{(isAR && sub.stages?.name_ar) || sub.stages?.name}</div>
                <div style={{ fontSize: 13, color: '#7A7068', marginBottom: 12 }}>{(isAR && sub.payment_cycles?.label_ar) || sub.payment_cycles?.label}</div>
                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: sub.status === 'active' ? '#E8F5EE' : '#E0F0FA', color: sub.status === 'active' ? '#2D6A4F' : '#1E6091' }}>
                  {sub.status === 'active' ? (isAR ? 'نشطة' : 'Active') : (isAR ? 'مجمدة' : 'Frozen')}
                </span>
              </div>

              {info && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1, background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#C84B0F' }}>{info.remaining}</div>
                    <div style={{ fontSize: 11, color: '#7A7068', fontWeight: 600 }}>{isAR ? 'الأيام المتبقية' : 'Days Left'}</div>
                  </div>
                  <div style={{ flex: 1, background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A' }}>{info.totalDays}</div>
                    <div style={{ fontSize: 11, color: '#7A7068', fontWeight: 600 }}>{isAR ? 'إجمالي الأيام' : 'Total Days'}</div>
                  </div>
                </div>
              )}

              {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>{msg}</div>}

              {sub.status === 'frozen' ? (
                <button onClick={resume} disabled={freezing} style={{ ...btn, width: '100%', background: '#2D6A4F', opacity: freezing ? 0.6 : 1 }}>
                  {freezing ? (isAR ? 'جار الاستئناف…' : 'Resuming…') : (isAR ? 'استئناف الخطة' : 'Resume Plan')}
                </button>
              ) : (
                <button onClick={requestFreeze} disabled={freezing} style={{ ...btn, width: '100%', background: '#1E6091', opacity: freezing ? 0.6 : 1 }}>
                  {freezing ? (isAR ? 'جار التجميد…' : 'Freezing…') : (isAR ? 'تجميد الخطة (7 أيام)' : 'Freeze Plan (7 days)')}
                </button>
              )}
              <p style={{ fontSize: 11.5, color: '#B0A098', marginTop: 8 }}>{isAR ? 'يجب طلب التجميد قبل 48 ساعة على الأقل من وجبتك القادمة.' : 'Freeze must be requested at least 48 hours before your next meal.'}</p>
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 8 }}>{isAR ? 'وجبة الغد' : "Tomorrow's Meal"}</div>
                {tomorrowMeal ? (
                  <>
                    <div style={{ fontSize: 26 }}>{tomorrowMeal.emoji || '🍽️'}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#1C1C1A', marginTop: 4 }}>{(isAR && tomorrowMeal.name_ar) || tomorrowMeal.name}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#B0A098' }}>{isAR ? 'لم يتم تحديد وجبة الغد بعد' : 'Not scheduled yet'}</div>
                )}
              </div>

              <div style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 10 }}>{isAR ? 'الحساسية الغذائية' : 'Allergens to avoid'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allergens.map(a => {
                    const active = selectedAllergens.includes(a.id)
                    return (
                      <button key={a.id} disabled={allergensSaving} onClick={() => toggleAllergen(a.id)} style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        border: active ? '1.5px solid #C84B0F' : '1.5px solid #EDE8E0', background: active ? '#FDF0E8' : 'white', color: active ? '#C84B0F' : '#7A7068',
                      }}>
                        {(isAR && a.name_ar) || a.name}{active ? ' ✓' : ''}
                      </button>
                    )
                  })}
                  {allergens.length === 0 && <span style={{ fontSize: 12.5, color: '#B0A098' }}>{isAR ? 'لا توجد حساسية مسجلة' : 'No allergens configured'}</span>}
                </div>
              </div>
            </div>
          </div>
        )
      )}

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
                <select style={inp} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))}>
                  <option value="">{isAR ? 'اختر…' : 'Select…'}</option>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input style={inp} type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))} />
              )}
            </div>
          ))}

          {profileMsg && <div style={{ color: profileMsg.includes('Saved') || profileMsg.includes('تم') ? '#2D6A4F' : '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{profileMsg}</div>}
          <button style={{ ...btn, opacity: profileSaving ? 0.6 : 1 }} disabled={profileSaving} onClick={saveProfile}>{profileSaving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'حفظ التغييرات' : 'Save Changes')}</button>
        </div>
      )}

      {tab === 'address' && (
        <div style={{ maxWidth: 480 }}>
          <label style={lbl}>{isAR ? 'عنوان التوصيل' : 'Delivery Address'}</label>
          <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={address} onChange={e => setAddress(e.target.value)} placeholder={isAR ? 'الحي، الشارع، تفاصيل المبنى…' : 'District, street, building details…'} />
          {addressMsg && <div style={{ color: '#2D6A4F', fontSize: 12.5, marginBottom: 8 }}>{addressMsg}</div>}
          <button style={{ ...btn, opacity: addressSaving ? 0.6 : 1 }} disabled={addressSaving} onClick={saveAddress}>{addressSaving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'تحديث العنوان' : 'Update Address')}</button>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 && <p style={{ fontSize: 13, color: '#7A7068' }}>{isAR ? 'لا يوجد سجل اشتراكات' : 'No subscription history yet'}</p>}
          {history.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>{h.stages?.emoji} {(isAR && h.stages?.name_ar) || h.stages?.name}</div>
                <div style={{ fontSize: 12.5, color: '#7A7068' }}>{(isAR && h.payment_cycles?.label_ar) || h.payment_cycles?.label} · {new Date(h.start_date).toLocaleDateString(isAR ? 'ar' : 'en')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>{h.total_price} SAR</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: h.status === 'active' ? '#E8F5EE' : h.status === 'frozen' ? '#E0F0FA' : '#F3F1ED', color: h.status === 'active' ? '#2D6A4F' : h.status === 'frozen' ? '#1E6091' : '#7A7068' }}>{h.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
