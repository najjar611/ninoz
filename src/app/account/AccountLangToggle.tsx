'use client'

import { useAccountLang } from '@/lib/AccountLangContext'

export default function AccountLangToggle() {
  const { isAR, toggle } = useAccountLang()
  function onSwitch() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('ninoz:flash'))
    setTimeout(() => toggle(), 430)
  }
  return (
    <button
      onClick={onSwitch}
      style={{ flexShrink: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}
    >
      {isAR ? 'English' : 'عربي'}
    </button>
  )
}
