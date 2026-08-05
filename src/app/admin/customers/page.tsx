'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CustomersList from './CustomersList'
import Reviews from '../reviews/page'
import Waitlist from '../waitlist/page'

const TABS = [
  { key: 'list', label: 'Customers', C: CustomersList },
  { key: 'reviews', label: 'Reviews', C: Reviews },
  { key: 'waitlist', label: 'Waitlist', C: Waitlist },
]

export default function CustomersHub() {
  const initial = useSearchParams().get('tab') || 'list'
  const [tab, setTab] = useState(TABS.some(t => t.key === initial) ? initial : 'list')
  const Active = (TABS.find(t => t.key === tab) || TABS[0]).C
  function go(k: string) { setTab(k); if (typeof window !== 'undefined') window.history.replaceState(null, '', `/admin/customers?tab=${k}`) }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22, borderBottom: '1.5px solid #EDEBE8' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => go(t.key)} style={{ padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: tab === t.key ? '#C84B0F' : '#7A7068', borderBottom: `2.5px solid ${tab === t.key ? '#C84B0F' : 'transparent'}`, marginBottom: -1.5 }}>{t.label}</button>
        ))}
      </div>
      <Active />
    </div>
  )
}
