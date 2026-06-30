'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

export default function Location() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR } = useAccountLang()
  const params = useSearchParams()
  const subscriptionId = params.get('subscription_id')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }
    // Skip asking again if the subscriber already has a delivery address on file.
    supabase.from('subscribers').select('delivery_address').eq('id', id).single().then(({ data }) => {
      if (data?.delivery_address?.trim()) {
        router.replace('/account/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [])

  if (checking) return null

  async function save() {
    if (!address.trim()) { setError(isAR ? 'يرجى إدخال عنوان التوصيل' : 'Please enter your delivery address'); return }
    setSaving(true)
    setError('')
    const id = getMockSubscriberId()
    // TODO: replace the text address with a real Google Maps pin (lat/lng) once Maps is connected.
    const { error: err } = await supabase.from('subscribers').update({ delivery_address: address }).eq('id', id)
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push('/account/dashboard')
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>{isAR ? 'موقع التوصيل' : 'Delivery location'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 16 }}>{isAR ? 'أين نوصّل وجبات طفلك؟' : "Where should we deliver your baby's meals?"}</p>

      <div style={{ height: 160, borderRadius: 12, background: '#F2EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#B0A098', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>
        📍 {isAR ? 'سيتم تفعيل محدد الموقع بعد ربط خرائط جوجل' : 'Map picker coming once Google Maps is connected'}
      </div>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6 }}>{isAR ? 'العنوان' : 'Address'}</label>
      <textarea
        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', height: 80, resize: 'vertical', marginBottom: 14 }}
        placeholder={isAR ? 'المبنى، الشارع، الحي، المدينة' : 'Building, street, district, city'}
        value={address}
        onChange={e => setAddress(e.target.value)}
      />

      {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
      <button onClick={save} disabled={saving} style={{ width: '100%', padding: '13px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
        {saving ? (isAR ? 'جار الحفظ…' : 'Saving…') : (isAR ? 'تأكيد الموقع' : 'Confirm Location')}
      </button>
    </div>
  )
}
