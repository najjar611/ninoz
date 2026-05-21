'use client'

// src/app/admin/layout.tsx — Premium Calibrated Non-Intrusive Layout Shell v9.6
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { label: '📊 Dashboard', href: '/admin' },
    { label: '📝 Edit Content', href: '/admin/content' },
    { label: '🍽️ Manage Meals', href: '/admin/meals' },
    { label: '🍼 Manage Stages', href: '/admin/stages' },
    { label: '👥 Subscribers', href: '/admin/subscribers' },
    { label: '✍️ Blog Posts', href: '/admin/blog' },
    { label: '💳 Payment Plans', href: '/admin/payment-cycles' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', flexDirection: 'column' }}>
      
      <style>{`
        .admin-top-bar { display: none; height: 64px; background: white; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 0 1.5rem; align-items: center; justify-content: space-between; position: fixed; top: 0; left: 0; right: 0; z-index: 1000; }
        .admin-hamburger { background: none; border: none; font-size: 1.5rem; color: #1C1C1A; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 8px; }
        
        .admin-layout-container { display: flex; flex: 1; padding-top: 0; min-height: 100vh; }
        
        .admin-sidebar { width: 260px; background: white; border-right: 1px solid rgba(0,0,0,0.06); padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 2rem; flex-shrink: 0; position: sticky; top: 0; height: 100vh; z-index: 99; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .admin-brand { font-size: 1.5rem; font-weight: 900; color: #0A429B; text-decoration: none; letter-spacing: -0.02em; }
        .admin-nav-list { display: flex; flex-direction: column; gap: 8px; list-style: none; padding: 0; margin: 0; }
        .admin-nav-link { display: block; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #5A5048; text-decoration: none; transition: all 0.2s; }
        .admin-nav-link:hover { background: #FAF8F5; color: #C84B0F; }
        .admin-nav-link.active { background: #FAF0E6; color: #C84B0F; }
        
        .admin-viewport-wrapper { flex: 1; min-width: 0; padding: 2.5rem; box-sizing: border-box; }
        
        /* CLEAN TARGET BLOCK STRUCTURAL BREAKPOINTS SETUP */
        @media (max-width: 992px) {
          .admin-top-bar { display: flex; }
          .admin-layout-container { padding-top: 64px; }
          
          .admin-sidebar { position: fixed; top: 64px; left: 0; bottom: 0; height: calc(100vh - 64px); transform: translateX(${sidebarOpen ? '0' : '-100%'}); box-shadow: ${sidebarOpen ? '20px 0 40px rgba(0,0,0,0.05)' : 'none'}; z-index: 998; width: 260px; }
          .admin-viewport-wrapper { padding: 1.5rem 1rem; width: 100%; max-width: 100vw; }
          
          /* Target structural container layout blocks at the root of the page only, safely ignoring inner child flex containers */
          .admin-viewport-wrapper > div { 
            display: flex !important; 
            flex-direction: column !important; 
            gap: 20px !important; 
            width: 100% !important;
          }
          
          /* Step 1: Force top numerical stat items wrapper row into a clean 2x2 grid */
          .admin-viewport-wrapper > div > div:first-of-type {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            width: 100% !important;
          }
          
          .admin-viewport-wrapper > div > div:first-of-type > div {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }

          /* Step 2: Un-squash bottom dual main block layout panels completely */
          .admin-viewport-wrapper > div > div:nth-of-type(2) {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
            width: 100% !important;
          }

          .admin-viewport-wrapper > div > div:nth-of-type(2) > div {
            width: 100% !important;
            max-width: 100% !important;
            flex: 1 1 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <header className="admin-top-bar">
        <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <Link href="/admin" className="admin-brand" style={{ fontSize: '1.25rem' }}>Ninoz Admin</Link>
        <div style={{ width: 40 }} />
      </header>

      <div className="admin-layout-container">
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand">Ninoz Admin</Link>
          <ul className="admin-nav-list">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`admin-nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}>
            <Link href="/" style={{ fontSize: '13px', fontWeight: 700, color: '#A0958D', textDecoration: 'none' }}>← View Website</Link>
          </div>
        </aside>

        <main className="admin-viewport-wrapper">
          {children}
        </main>
      </div>
    </div>
  )
}