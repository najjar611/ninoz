'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin' }],
  },
  {
    title: 'Content',
    items: [
      { label: 'Edit Text', href: '/admin/content' },
      { label: 'Meals', href: '/admin/meals' },
      { label: 'Stages', href: '/admin/stages' },
      { label: 'FAQ', href: '/admin/faq' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Subscribers', href: '/admin/subscribers' },
      { label: 'Waitlist', href: '/admin/waitlist' },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', href: '/admin/settings' }],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const active = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F4F0', fontFamily: 'Nunito, sans-serif' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sb {
          width: 232px; flex-shrink: 0; background: #fff;
          border-right: 1px solid #EDEBE8; display: flex;
          flex-direction: column; position: fixed; inset: 0 auto 0 0;
          height: 100vh; z-index: 100; overflow-y: auto;
        }
        .sb-brand { padding: 28px 20px 20px; border-bottom: 1px solid #F2EDE8; }
        .sb-logo { font-size: 21px; font-weight: 900; color: #C84B0F; letter-spacing: -0.02em; text-decoration: none; display: block; }
        .sb-sub { font-size: 10.5px; color: #B0A098; font-weight: 600; margin-top: 2px; letter-spacing: 0.03em; }

        .sb-section { padding: 20px 0 4px; }
        .sb-section-title {
          font-size: 9.5px; font-weight: 800; color: #C9A98A;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0 20px 8px;
        }
        .sb-link {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 16px 9px 20px; margin: 1px 8px;
          border-radius: 9px; font-size: 13.5px; font-weight: 600;
          color: #5A5048; text-decoration: none; transition: all 0.14s;
          position: relative;
        }
        .sb-link:hover { background: #FDF8F5; color: #C84B0F; }
        .sb-link.on { background: #FDF0E8; color: #C84B0F; font-weight: 800; }
        .sb-link.on::before {
          content: ''; position: absolute; left: -1px; top: 50%;
          transform: translateY(-50%); width: 3px; height: 18px;
          background: #C84B0F; border-radius: 0 3px 3px 0;
        }

        .sb-footer { margin-top: auto; border-top: 1px solid #F2EDE8; padding: 14px 12px; }
        .sb-footer-btn {
          display: block; width: 100%; padding: 8px 12px; border-radius: 8px;
          font-size: 12.5px; font-weight: 600; text-align: left; cursor: pointer;
          text-decoration: none; border: none; background: none;
          font-family: inherit; transition: background 0.12s; color: #7A7068;
        }
        .sb-footer-btn:hover { background: #F7F4F0; }
        .sb-footer-btn.danger { color: #DC2626; }
        .sb-footer-btn.danger:hover { background: #FEF2F2; }

        .topbar {
          display: none; position: fixed; top: 0; left: 0; right: 0;
          height: 54px; background: #fff; border-bottom: 1px solid #EDEBE8;
          padding: 0 16px; align-items: center; justify-content: space-between;
          z-index: 200;
        }
        .ham { background: none; border: none; cursor: pointer; font-size: 20px; color: #1C1C1A; padding: 6px; }
        .overlay {
          display: none; position: fixed; inset: 54px 0 0 0;
          background: rgba(28,28,26,0.32); z-index: 99;
          backdrop-filter: blur(2px);
        }

        .main { margin-left: 232px; flex: 1; }
        .main-inner { padding: 36px 40px; max-width: 1100px; }

        @media (max-width: 900px) {
          .topbar { display: flex; }
          .sb {
            top: 54px; height: calc(100vh - 54px);
            transform: translateX(-100%); transition: transform 0.28s cubic-bezier(.16,1,.3,1);
            box-shadow: none;
          }
          .sb.open { transform: none; box-shadow: 8px 0 32px rgba(0,0,0,0.1); }
          .overlay { display: block; }
          .main { margin-left: 0; }
          .main-inner { padding: 80px 16px 32px; }
        }
      `}</style>

      {/* Mobile topbar */}
      <div className="topbar">
        <button className="ham" onClick={() => setOpen(o => !o)}>{open ? '✕' : '☰'}</button>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#C84B0F' }}>Ninoz Admin</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sb ${open ? 'open' : ''}`}>
        <div className="sb-brand">
          <Link href="/admin" className="sb-logo">Ninoz</Link>
          <div className="sb-sub">Admin Console</div>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV.map(section => (
            <div key={section.title} className="sb-section">
              <div className="sb-section-title">{section.title}</div>
              {section.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sb-link ${active(item.href) ? 'on' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sb-footer">
          <Link href="/" className="sb-footer-btn" style={{ color: '#7A7068' }}>← View Website</Link>
          <button className="sb-footer-btn danger" onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="main-inner">
          {children}
        </div>
      </main>
    </div>
  )
}
