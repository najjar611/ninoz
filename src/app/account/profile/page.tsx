'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'
import DateField from '@/components/DateField'

type CustomField = {
  id: string; field_key: string; label_en: string; label_ar: string | null
  field_type: 'text' | 'number' | 'date' | 'select'; options: string[] | null; is_required: boolean
}
type Stage = { id: string; name: string; name_ar?: string | null; min_age_months?: number | null; max_age_months?: number | null }

function ageInMonths(dateStr: string | null): number | null {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months--
  return Math.max(0, months)
}

export default function Profile() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [kidBirthDate, setKidBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }
    Promise.all([
      supabase.from('subscribers').select('parent_name, kid_name, kid_birth_date, email, extra_fields').eq('id', id).single(),
      supabase.from('customer_fields').select('*').eq('is_active', true).order('position'),
      supabase.from('stages').select('id,name,name_ar,min_age_months,max_age_months').eq('is_active', true).order('position'),
    ]).then(([sub, cf, st]) => {
      if (sub.data) {
        setParentName(sub.data.parent_name || '')
        setKidName(sub.data.kid_name || '')
        setKidBirthDate((sub.data as any).kid_birth_date || '')
        setEmail(sub.data.email || '')
        setExtra(sub.data.extra_fields || {})
      }
      setCustomFields(cf.data || [])
      setStages((st.data as any) || [])
      setLoading(false)
    })
  }, [])

  // Live stage recommendation as soon as a birth date is chosen.
  const recStage = (() => {
    const months = ageInMonths(kidBirthDate)
    if (months === null) return null
    return stages.find(s => s.min_age_months != null && s.max_age_months != null && months >= s.min_age_months && months <= s.max_age_months) || null
  })()

  const inp: React.CSSProperties = { width: '100%', padding: '13px 15px', borderRadius: 12, border: '1.5px solid #EAE3D9', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', marginBottom: 14, background: '#fff', accentColor: '#C84B0F' }
  const selStyle: React.CSSProperties = {
    ...inp, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23C84B0F' stroke-width='2.2'><path d='M6 9l6 6 6-6'/></svg>\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: isAR ? 'left 14px center' : 'right 14px center', backgroundSize: '18px',
    paddingRight: isAR ? 15 : 40, paddingLeft: isAR ? 40 : 15, cursor: 'pointer',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: '#5A5048', marginBottom: 7 }
  const req = <span style={{ color: '#DC2626' }}> *</span>
  const btn: React.CSSProperties = { width: '100%', padding: '14px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6, opacity: saving ? 0.6 : 1 }

  async function save() {
    if (!parentName.trim() || !kidName.trim()) {
      setError(isAR ? 'يرجى إدخال اسمك واسم طفلك' : "Please fill in your name and your baby's name")
      return
    }
    if (!kidBirthDate) {
      setError(isAR ? 'يرجى إدخال تاريخ ميلاد الطفل لنوصي بالمرحلة المناسبة' : "Please enter your baby's birth date so we can recommend the right stage")
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(isAR ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address')
      return
    }
    const missing = customFields.find(f => f.is_required && !(extra[f.field_key] || '').trim())
    if (missing) {
      setError(isAR ? `الحقل "${missing.label_ar || missing.label_en}" مطلوب` : `"${missing.label_en}" is required`)
      return
    }
    setSaving(true)
    setError('')
    const id = getMockSubscriberId()
    const { error: err } = await supabase.from('subscribers').update({
      parent_name: parentName, kid_name: kidName, kid_birth_date: kidBirthDate || null, email: email.trim() || null, extra_fields: extra,
    }).eq('id', id)
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push('/account/location')
  }

  if (loading) return <div style={{ textAlign: 'center', color: '#7A7068', padding: 20 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'أخبرنا عنك' : 'Tell us about you'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>{isAR ? 'هذا يساعدنا على تخصيص وجبات طفلك.' : "This helps us personalize your baby's meals."}</p>

      <label style={lbl}>{isAR ? 'الاسم الأول' : 'First Name'}{req}</label>
      <input style={inp} value={parentName} onChange={e => setParentName(e.target.value)} />

      <label style={lbl}>{isAR ? 'اسم الطفل' : "Baby's Name"}{req}</label>
      <input style={inp} value={kidName} onChange={e => setKidName(e.target.value)} />

      <label style={lbl}>{isAR ? 'تاريخ ميلاد الطفل' : "Baby's Birth Date"}{req}</label>
      <DateField value={kidBirthDate} onChange={setKidBirthDate} isAR={isAR} max={new Date().toISOString().slice(0, 10)} placeholder={isAR ? 'اختر التاريخ' : 'Select date'} />
      {recStage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E8F5EE', border: '1px solid #BFE3CE', borderRadius: 10, padding: '9px 12px', marginTop: -6, marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2D6A4F' }}>
            {isAR ? `المرحلة الموصى بها: ${(recStage.name_ar || recStage.name)}` : `Recommended stage: ${recStage.name}`}
          </span>
        </div>
      )}

      <label style={lbl}>{isAR ? 'البريد الإلكتروني' : 'Email'}<span style={{ color: '#B0A098', fontWeight: 600 }}> {isAR ? '(اختياري)' : '(optional)'}</span></label>
      <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} />

      {customFields.map(f => (
        <div key={f.id}>
          <label style={lbl}>
            {(isAR ? (f.label_ar || f.label_en) : f.label_en)}{f.is_required && req}
          </label>
          {f.field_type === 'select' ? (
            <select style={selStyle} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))}>
              <option value="">{isAR ? 'اختر…' : 'Select…'}</option>
              {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.field_type === 'date' ? (
            <DateField value={extra[f.field_key] || ''} onChange={v => setExtra(prev => ({ ...prev, [f.field_key]: v }))} isAR={isAR} placeholder={isAR ? 'اختر التاريخ' : 'Select date'} />
          ) : (
            <input
              style={inp}
              type={f.field_type === 'number' ? 'number' : 'text'}
              value={extra[f.field_key] || ''}
              onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))}
            />
          )}
        </div>
      ))}

      {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
      <button style={btn} disabled={saving} onClick={save}>{saving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'متابعة' : 'Continue')}</button>
    </div>
  )
}
