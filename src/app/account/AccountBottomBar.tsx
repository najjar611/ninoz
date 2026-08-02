'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAccountLang } from '@/lib/AccountLangContext'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'

export default function AccountBottomBar({ whats }: { whats: string }) {
  const { isAR } = useAccountLang()
  const router = useRouter()
  const path = usePathname() || ''
  const [hasPlan, setHasPlan] = useState<boolean | null>(null)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { setHasPlan(false); return }
    createClient().from('subscriptions').select('id').eq('subscriber_id', id).in('status', ['active', 'frozen', 'pending_payment']).limit(1).maybeSingle()
      .then(({ data }) => setHasPlan(!!data))
  }, [path])

  const planItem = hasPlan
    ? { label: isAR ? 'خطتي' : 'My Plan', go: () => router.push('/account/dashboard'), pulse: false }
    : { label: isAR ? 'ابدئي خطتك' : 'Start Plan', go: () => router.push('/account/profile'), pulse: true }

  const items = [
    { key: 'account', label: isAR ? 'حسابي' : 'Account', go: () => router.push('/account'), active: path === '/account', pulse: false,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="8" r="3.3" /><path d="M5.5 20c0-3 3-4.8 6.5-4.8s6.5 1.8 6.5 4.8" /></svg> },
    { key: 'plan', label: planItem.label, go: planItem.go, active: path.startsWith('/account/dashboard') || path.startsWith('/account/plan'), pulse: planItem.pulse,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 10h8M8 14h5" /></svg> },
    { key: 'home', label: isAR ? 'الرئيسية' : 'Home', go: () => router.push('/'), active: false, pulse: false,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg> },
  ]

  return (
    <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: 'rgba(12,26,21,0.82)', borderTop: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'space-around', padding: '9px 0 14px', direction: 'ltr' }}>
      <style>{`@keyframes ninozBarPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.16)}}`}</style>
      {items.map(it => (
        <button key={it.key} onClick={it.go} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.66rem', fontWeight: 800, color: it.pulse ? '#FF7A33' : (it.active ? '#F5C77E' : '#9DB4A8') }}>
          <span style={it.pulse ? { animation: 'ninozBarPulse 1.25s ease-in-out infinite', display: 'inline-flex' } : { display: 'inline-flex' }}>{it.icon}</span>
          {it.label}
        </button>
      ))}
    </nav>
  )
}
