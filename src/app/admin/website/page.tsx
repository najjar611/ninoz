'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Content from '../content/page'
import Sections from '../sections/page'
import Faq from '../faq/page'
import News from '../news/page'
import Terms from '../terms/page'

const TABS = [
  { key: 'text', label: 'Edit Text', C: Content },
  { key: 'sections', label: 'Sections', C: Sections },
  { key: 'faq', label: 'FAQ', C: Faq },
  { key: 'news', label: 'News', C: News },
  { key: 'terms', label: 'Terms', C: Terms },
]

export default function WebsiteHub() {
  const initial = useSearchParams().get('tab') || 'text'
  const [tab, setTab] = useState(TABS.some(t => t.key === initial) ? initial : 'text')
  const Active = (TABS.find(t => t.key === tab) || TABS[0]).C

  function go(k: string) {
    setTab(k)
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `/admin/website?tab=${k}`)
  }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22, borderBottom: '1.5px solid #EDEBE8' }}>
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
