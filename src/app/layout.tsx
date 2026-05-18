'use client'

// ══════════════════════════════════════════════════════════
// /admin/layout.tsx — v5
// Updated sidebar: added Ingredients link
// ══════════════════════════════════════════════════════════

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/admin',              label: '🏠 Dashboard',    exact: true },
  { href: '/admin/meals',        label: '🍽️ Meals' },
  { href: '/admin/ingredients',  label: '🥕 Ingredients' },
  { href: '/admin/subscribers',  label: '👥 Subscribers' },
  { href: '/admin/form',         label: '📋 Form Fields' },
  { href: '/admin/content',      label: '📝 Content' },
  { href: '/admin/testimonials', label: '⭐ Testimonials' },
  { href: '/admin/blog',         label: '📰 Blog' },
  { href: '/admin/settings',     label: '⚙️ Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login')
      else setUserEmail(data.user.email || '')
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Nunito Sans, sans-serif', background: '#F7F3EE' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#2C1A0E',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px' }}>
          <Link href="/" style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: 26,
            fontWeight: 900,
            color: '#FFB347',
            textDecoration: 'none',
            display: 'block',
          }}>
            Ninoz
          </Link>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Admin Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '9px 12px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: isActive(item) ? 700 : 500,
                color: isActive(item) ? '#FFB347' : 'rgba(255,255,255,0.65)',
                background: isActive(item) ? 'rgba(255,179,71,0.12)' : 'transparent',
                textDecoration: 'none',
                marginBottom: 2,
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info + sign out */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {userEmail && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, wordBreak: 'break-word' }}>
              {userEmail}
            </div>
          )}
          <button
            onClick={signOut}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, padding: '36px 40px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
