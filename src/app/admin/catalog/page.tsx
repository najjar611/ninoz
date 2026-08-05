'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Meals from '../meals/page'
import Categories from '../categories/page'
import Stages from '../stages/page'
import DailyMenu from '../daily-menu/page'
import PaymentCycles from '../payment-cycles/page'

const TABS = [
  { key: 'meals', label: 'Meals', C: Meals },
  { key: 'categories', label: 'Categories', C: Categories },
  { key: 'stages', label: 'Stages', C: Stages },
  { key: 'daily-menu', label: 'Daily Menu', C: DailyMenu },
  { key: 'plans', label: 'Payment Plans', C: PaymentCycles },
]

export default function CatalogHub() {
  const initial = useSearchParams().get('tab') || 'meals'
  const [tab, setTab] = useState(TABS.some(t => t.key === initial) ? initial : 'meals')
  const Active = (TABS.find(t => t.key === tab) || TABS[0]).C

  function go(k: string) {
    setTab(k)
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `/admin/catalog?tab=${k}`)
  }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22, borderBottom: '1.5px solid #EDEBE8', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => go(t.key)} style={{
            padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800,
            color: tab === t.key ? '#C84B0F' : '#7A7068', borderBottom: `2.5px solid ${tab === t.key ? '#C84B0F' : 'transparent'}`, marginBottom: -1.5,
          }}>{t.label}</button>
        ))}
      </div>
      <Active />
    </div>
  )
}
