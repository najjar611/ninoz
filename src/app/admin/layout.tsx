'use client'

// src/app/admin/layout.tsx — v6.1
// Simplified: 7 tabs only, responsive, clean
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
  { href: '/admin/content', label: 'Content & Text', icon: '📝' },
  { href: '/admin/meals', label: 'Meals', icon: '🍽️' },
  { href: '/admin/stages', label: 'Stages', icon: '🍼' },
  { href: '/admin/subscribers', label: 'Subscribers', icon: '👥' },
  { href: '/admin/faq', label: 'FAQ', icon: '❓' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

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

        .adm-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 600; text-decoration: none;
          transition: all 0.15s; color: rgba(255,255,255,0.55);
          margin-bottom: 3px; cursor: pointer; border: none;
          background: none; width: 100%; text-align: left;
          font-family: 'Nunito Sans', sans-serif;
        }
        .adm-nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); }
        .adm-nav-item.active { background: rgba(200,75,15,0.18); color: #FFB347; }

        /* Mobile hamburger */
        .adm-hamburger {
          display: none; position: fixed; top: 16px; left: 16px; z-index: 200;
          width: 40px; height: 40px; border-radius: 10px;
          background: #2C1A0E; border: none; color: white;
          font-size: 18px; cursor: pointer; align-items: center; justify-content: center;
        }

        @media (max-width: 768px) {
          .adm-hamburger { display: flex; }
          .adm-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .adm-sidebar.open { transform: translateX(0); }
          .adm-main { margin-left: 0 !important; padding: 20px !important; padding-top: 64px !important; }
        }
      `}</style>

      {/* Mobile hamburger */}
      <button className="adm-hamburger" onClick={() => setMobileOpen(o => !o)}>☰</button>

      {/* Sidebar */}
      <aside className={`adm-sidebar ${mobileOpen ? 'open' : ''}`} style={{
        width: 220, background: '#2C1A0E', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 150,
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <Link href="/" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#FFB347', textDecoration: 'none', display: 'block' }}>
            Ninoz
          </Link>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px 12px' }} />

        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`adm-nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {email && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, wordBreak: 'break-all' }}>
              {email}
            </div>
          )}
          <button onClick={signOut} style={{
            width: '100%', padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 140,
        }} />
      )}

      {/* Main */}
      <main className="adm-main" style={{ marginLeft: 220, flex: 1, padding: '36px 40px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
