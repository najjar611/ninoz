'use client'

import { useAccountLang } from '@/lib/AccountLangContext'

export default function AccountLangToggle() {
  const { isAR, toggle } = useAccountLang()
  return (
    <button
      onClick={toggle}
      style={{ flexShrink: 0, background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      {isAR ? 'English' : 'عربي'}
    </button>
  )
}
