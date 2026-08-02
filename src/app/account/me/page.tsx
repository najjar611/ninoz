'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId, clearMockSession } from '@/lib/mockSession'
import { useAccountLang } from '@/lib/AccountLangContext'

export default function AccountMe() {
  const supabase = createClient()
  const router = useRouter()
  const { isAR, toggle } = useAccountLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { router.replace('/account/signin'); return }
    supabase.from('subscribers').select('parent_name, mobile_number').eq('id', id).single()
      .then(({ data }) => { setName((data as any)?.parent_name || ''); setPhone((data as any)?.mobile_number || '') })
  }, [])

  function logout() { clearMockSession(); router.push('/account/signin') }

  const rowIcon = (d: React.ReactNode) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C84B0F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  )

  const items: { label: string; labelAr: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] = [
    { label: 'Profile', labelAr: 'الملف الشخصي', icon: rowIcon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>), onClick: () => router.push('/account/dashboard?tab=profile') },
    { label: 'My Address', labelAr: 'عنوان التوصيل', icon: rowIcon(<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>), onClick: () => router.push('/account/dashboard?tab=address') },
    { label: 'Order History', labelAr: 'سجل الطلبات', icon: rowIcon(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>), onClick: () => router.push('/account/dashboard?tab=history') },
    { label: 'Support', labelAr: 'الدعم والمساعدة', icon: rowIcon(<><path d="M21 12a9 9 0 1 0-3.5 7.1L21 21Z" /><path d="M8.5 10.5a3.5 3.5 0 0 1 6.5 1.8c0 2-2.5 2.4-2.5 3.7" /></>), onClick: () => router.push('/account/support') },
    { label: isAR ? 'التغيير إلى الإنجليزية' : 'Switch to Arabic', labelAr: 'English', icon: rowIcon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>), onClick: toggle },
    { label: 'Log out', labelAr: 'تسجيل الخروج', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>, onClick: logout, danger: true },
  ]

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#C84B0F', flexShrink: 0 }}>
          {(name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#7A7068', fontWeight: 600 }}>{isAR ? 'مرحباً' : 'Hello'}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A' }}>{name || (isAR ? 'عميلنا العزيز' : 'there')}</div>
          {phone && <div style={{ fontSize: 12.5, color: '#B0A098', fontFamily: 'monospace', marginTop: 2 }}>{phone}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((it, i) => (
          <button key={i} onClick={it.onClick} style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '15px 14px', background: 'none',
            border: 'none', borderBottom: i < items.length - 1 ? '1px solid #F2EDE8' : 'none', cursor: 'pointer',
            fontFamily: 'inherit', textAlign: isAR ? 'right' : 'left',
          }}>
            <span style={{ flexShrink: 0, display: 'flex' }}>{it.icon}</span>
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: it.danger ? '#DC2626' : '#1C1C1A' }}>{isAR ? it.labelAr : it.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9BEB4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAR ? 'scaleX(-1)' : 'none' }}><path d="m9 18 6-6-6-6" /></svg>
          </button>
        ))}
      </div>
    </div>
  )
}
