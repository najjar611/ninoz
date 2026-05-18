'use client'

// src/app/admin/layout.tsx — v6
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
  { href: '/admin/content', label: 'Content & Text', icon: '📝' },
  { href: '/admin/stages', label: 'Stages', icon: '🍼' },
  { href: '/admin/meals', label: 'Meals', icon: '🍽️' },
  { href: '/admin/ingredients', label: 'Ingredients', icon: '🥕' },
  { href: '/admin/how-steps', label: 'How It Works', icon: '📋' },
  { href: '/admin/subscribers', label: 'Subscribers', icon: '👥' },
  { href: '/admin/payment-cycles', label: 'Payment Cycles', icon: '💳' },
  { href: '/admin/footer', label: 'Footer Links', icon: '🔗' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email || '')
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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Nunito Sans, sans-serif', background: '#F5F0EB' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap');
        .admin-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.15s; color: rgba(255,255,255,0.6); margin-bottom: 2px; }
        .admin-nav-item:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
        .admin-nav-item.active { background: rgba(255,179,71,0.15); color: #FFB347; }
        .admin-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 230, background: '#2C1A0E', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 26, fontWeight: 900, color: '#FFB347' }}>Ninoz</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Portal</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px 12px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive(item) ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + sign out */}
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {email && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, wordBreak: 'break-all' }}>
              {email}
            </div>
          )}
          <button
            onClick={signOut}
            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 230, flex: 1, padding: '36px 40px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
