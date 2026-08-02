'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccountLang } from '@/lib/AccountLangContext'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'

// Native-style bottom tab bar shared across the whole app (landing + account).
// `isAROverride` lets the public landing (which has its own language state,
// outside AccountLangProvider) drive the language.
export default function AccountTabBar({ isAROverride }: { isAROverride?: boolean } = {}) {
  const pathname = usePathname()
  const ctx = useAccountLang()
  const isAR = isAROverride ?? ctx.isAR
  const [subscribed, setSubscribed] = useState<boolean | null>(null)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) { setSubscribed(false); return }
    const supabase = createClient()
    supabase.from('subscriptions').select('id').eq('subscriber_id', id).in('status', ['active', 'frozen']).limit(1).maybeSingle()
      .then(({ data }) => setSubscribed(!!data))
  }, [])

  // Hidden on the auth screens — a tab bar there would be confusing.
  if (pathname.startsWith('/account/signin')) return null

  const planTab = subscribed
    ? { href: '/account/dashboard', en: 'My Plan', ar: 'خطتي' }
    : { href: '/account/plan', en: 'Start Plan', ar: 'ابدأ خطتك' }

  const tabs = [
    {
      href: '/', en: 'Home', ar: 'الرئيسية',
      match: (p: string) => p === '/',
      icon: <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />,
    },
    {
      href: planTab.href, en: planTab.en, ar: planTab.ar,
      match: (p: string) => p.startsWith('/account/plan') || p.startsWith('/account/checkout') || p.startsWith('/account/dashboard'),
      icon: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    },
    {
      href: '/account/support', en: 'Support', ar: 'الدعم',
      match: (p: string) => p.startsWith('/account/support'),
      icon: <><path d="M21 12a9 9 0 1 0-3.5 7.1L21 21Z" /><path d="M8.5 10.5a3.5 3.5 0 0 1 6.5 1.8c0 2-2.5 2.4-2.5 3.7" /><circle cx="12.5" cy="18" r="0.4" /></>,
    },
    {
      href: '/account/me', en: 'Account', ar: 'حسابي',
      match: (p: string) => p.startsWith('/account/me') || p.startsWith('/account/profile') || p.startsWith('/account/location'),
      icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
    },
  ]

  return (
    <>
      <div style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid #EDE8E0', display: 'flex', justifyContent: 'space-around', alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <style>{`
          @keyframes ninozTabPop { 0% { transform: scale(1); } 40% { transform: scale(1.28) translateY(-2px); } 100% { transform: scale(1.12) translateY(-1px); } }
          @keyframes ninozDotIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .ninoz-tab-ico { transition: transform .2s cubic-bezier(.16,1,.3,1); }
          .ninoz-tab-ico.on { animation: ninozTabPop .34s cubic-bezier(.16,1,.3,1) forwards; }
        `}</style>
        {tabs.map((t, i) => {
          const active = t.match(pathname)
          return (
            <Link key={i} href={t.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              padding: '9px 2px', textDecoration: 'none', color: active ? '#C84B0F' : '#9A8F86', minWidth: 0, position: 'relative',
            }}>
              <span style={{ position: 'absolute', top: 2, width: 5, height: 5, borderRadius: '50%', background: '#C84B0F', opacity: active ? 1 : 0, animation: active ? 'ninozDotIn .3s ease both' : 'none' }} />
              <svg className={`ninoz-tab-ico ${active ? 'on' : ''}`} width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {t.icon}
              </svg>
              <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, whiteSpace: 'nowrap', transition: 'font-weight .2s' }}>{isAR ? t.ar : t.en}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
