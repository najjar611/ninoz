'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

type CustomField = {
  id: string; field_key: string; label_en: string; label_ar: string | null
  field_type: 'text' | 'number' | 'date' | 'select'; options: string[] | null; is_required: boolean
}

export default function Profile() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [email, setEmail] = useState('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }
    Promise.all([
      supabase.from('subscribers').select('parent_name, kid_name, email, extra_fields').eq('id', id).single(),
      supabase.from('customer_fields').select('*').eq('is_active', true).order('position'),
    ]).then(([sub, cf]) => {
      if (sub.data) {
        setParentName(sub.data.parent_name || '')
        setKidName(sub.data.kid_name || '')
        setEmail(sub.data.email || '')
        setExtra(sub.data.extra_fields || {})
      }
      setCustomFields(cf.data || [])
      setLoading(false)
    })
  }, [])

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A', marginBottom: 14 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6, opacity: saving ? 0.6 : 1 }

  async function save() {
    if (!parentName.trim() || !kidName.trim()) {
      setError(isAR ? 'يرجى إدخال اسمك واسم طفلك' : "Please fill in your name and your baby's name")
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
      parent_name: parentName, kid_name: kidName, email, extra_fields: extra,
    }).eq('id', id)
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push('/account/plan')
  }

  if (loading) return <div style={{ textAlign: 'center', color: '#7A7068', padding: 20 }}>{isAR ? 'جار التحميل…' : 'Loading…'}</div>

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'أخبرنا عنك' : 'Tell us about you'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>{isAR ? 'هذا يساعدنا على تخصيص وجبات طفلك.' : "This helps us personalize your baby's meals."}</p>

      <label style={lbl}>{isAR ? 'اسمك' : 'Your Name'}</label>
      <input style={inp} value={parentName} onChange={e => setParentName(e.target.value)} placeholder={isAR ? 'مثال: سارة العتيبي' : 'e.g. Sara Al-Otaibi'} />

      <label style={lbl}>{isAR ? 'اسم الطفل' : "Baby's Name"}</label>
      <input style={inp} value={kidName} onChange={e => setKidName(e.target.value)} placeholder={isAR ? 'مثال: لانا' : 'e.g. Lana'} />

      <label style={lbl}>{isAR ? 'البريد الإلكتروني' : 'Email'}</label>
      <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />

      {customFields.map(f => (
        <div key={f.id}>
          <label style={lbl}>
            {(isAR ? (f.label_ar || f.label_en) : f.label_en)}{f.is_required && <span style={{ color: '#C84B0F' }}> *</span>}
          </label>
          {f.field_type === 'select' ? (
            <select style={inp} value={extra[f.field_key] || ''} onChange={e => setExtra(prev => ({ ...prev, [f.field_key]: e.target.value }))}>
              <option value="">{isAR ? 'اختر…' : 'Select…'}</option>
              {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              style={inp}
              type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'}
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
