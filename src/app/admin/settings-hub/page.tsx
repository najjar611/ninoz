'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Settings from '../settings/page'
import CustomerFields from '../customer-fields/page'
import PromoCodes from '../promo-codes/page'
import Notifications from '../notifications/page'

const TABS = [
  { key: 'general', label: 'General', C: Settings },
  { key: 'fields', label: 'Profile Fields', C: CustomerFields },
  { key: 'promos', label: 'Promo Codes', C: PromoCodes },
  { key: 'notifications', label: 'Notifications', C: Notifications },
]

export default function SettingsHub() {
  const initial = useSearchParams().get('tab') || 'general'
  const [tab, setTab] = useState(TABS.some(t => t.key === initial) ? initial : 'general')
  const Active = (TABS.find(t => t.key === tab) || TABS[0]).C
  function go(k: string) { setTab(k); if (typeof window !== 'undefined') window.history.replaceState(null, '', `/admin/settings-hub?tab=${k}`) }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22, borderBottom: '1.5px solid #EDEBE8' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => go(t.key)} style={{ padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: tab === t.key ? '#C84B0F' : '#7A7068', borderBottom: `2.5px solid ${tab === t.key ? '#C84B0F' : 'transparent'}`, marginBottom: -1.5 }}>{t.label}</button>
        ))}
      </div>
      <Active />
    </div>
  )
}
