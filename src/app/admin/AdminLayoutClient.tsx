'use client'
import React, { useEffect, useState } from 'react'
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
      { label: 'Sections', href: '/admin/sections' },
      { label: 'Meals', href: '/admin/meals' },
      { label: 'Categories', href: '/admin/categories' },
      { label: 'Stages', href: '/admin/stages' },
      { label: 'Payment Plans', href: '/admin/payment-cycles' },
      { label: 'Daily Menu', href: '/admin/daily-menu' },
      { label: 'FAQ', href: '/admin/faq' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Subscribers', href: '/admin/subscribers' },
      { label: 'Reviews', href: '/admin/reviews' },
      { label: 'Delivery Status', href: '/admin/delivery-status' },
      { label: 'Waitlist', href: '/admin/waitlist' },
      { label: 'Profile Fields', href: '/admin/customer-fields' },
      { label: 'Promo Codes', href: '/admin/promo-codes' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Settings', href: '/admin/settings' },
    ],
  },
]

const SEEN_KEY = 'admin_notifications_last_seen'
const UNREAD_KEY = 'admin_notifications_unread_ids'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    async function fetchLogo() {
      const { data: content } = await supabase.from('site_content').select('value').eq('key', 'logo_url').single()
      if (content?.value) { setLogoUrl(content.value); return }
      const { data: logoTable } = await supabase.from('logo').select('url').limit(1).single()
      if (logoTable?.url) setLogoUrl(logoTable.url)
    }
    fetchLogo()
  }, [])

  useEffect(() => {
    function loadUnreadCount() {
      const raw = localStorage.getItem(UNREAD_KEY)
      if (raw == null) return null
      try { return (JSON.parse(raw) as string[]).length } catch { return null }
    }

    async function loadNotifCount() {
      // Once the notifications page has been visited at least once, the
      // manually-managed unread list (which supports "mark as unread") is
      // the source of truth. Before that, fall back to a since-last-seen
      // count across the tracked tables.
      const unread = loadUnreadCount()
      if (unread !== null) { setNotifCount(unread); return }
      const lastSeen = localStorage.getItem(SEEN_KEY) || new Date(0).toISOString()
      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from('meal_reviews').select('id', { count: 'exact', head: true }).gt('created_at', lastSeen),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).gt('created_at', lastSeen).in('status', ['active', 'pending_payment']),
        supabase.from('freeze_requests').select('id', { count: 'exact', head: true }).gt('created_at', lastSeen),
        supabase.from('payments').select('id', { count: 'exact', head: true }).gt('created_at', lastSeen),
      ])
      setNotifCount((r1.count || 0) + (r2.count || 0) + (r3.count || 0) + (r4.count || 0))
    }
    loadNotifCount()
    const handler = () => loadNotifCount()
    window.addEventListener('admin-notif-seen', handler)
    window.addEventListener('admin-notif-unread-changed', handler)
    return () => {
      window.removeEventListener('admin-notif-seen', handler)
      window.removeEventListener('admin-notif-unread-changed', handler)
    }
  }, [])

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

        .main { margin-left: 232px; flex: 1; min-width: 0; max-width: 100vw; }
        .main-inner { padding: 36px 40px; max-width: 1100px; }
        .main-inner img, .main-inner video { max-width: 100%; height: auto; }
        /* Wide tables stay readable by scrolling inside their own card rather
           than stretching the whole page on small screens. */
        .main-inner table { width: 100%; }

        /* --- shared polish: subtle motion + focus states across admin --- */
        .main-inner button { transition: transform .14s ease, box-shadow .18s ease, filter .14s ease, background .18s ease; }
        .main-inner button:hover:not(:disabled) { filter: brightness(1.04); }
        .main-inner button:active:not(:disabled) { transform: scale(0.98); }
        .main-inner input, .main-inner textarea, .main-inner select { transition: border-color .15s ease, box-shadow .15s ease; }
        .main-inner input:focus, .main-inner textarea:focus, .main-inner select:focus { border-color: #C84B0F !important; box-shadow: 0 0 0 3px rgba(200,75,15,0.12); outline: none; }
        .main-inner tbody tr { transition: background .12s ease; }
        .main-inner tbody tr:hover { background: #FAF7F4; }

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
          .main-inner { padding: 80px 16px 32px; overflow-x: hidden; }
        }
      `}</style>

      <div className="topbar">
        <button className="ham" onClick={() => setOpen(o => !o)}>{open ? '✕' : '☰'}</button>
        {logoUrl
          ? <img src={logoUrl} alt="Ninoz" style={{ height: 28, maxWidth: 100, objectFit: 'contain' }} />
          : <span style={{ fontWeight: 900, fontSize: 16, color: '#C84B0F' }}>Ninoz Admin</span>}
        <div style={{ width: 32 }} />
      </div>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <aside className={`sb ${open ? 'open' : ''}`}>
        <div className="sb-brand">
          <Link href="/admin" className="sb-logo">
            {logoUrl
              ? <img src={logoUrl} alt="Ninoz" style={{ height: 36, maxWidth: 140, objectFit: 'contain', display: 'block' }} />
              : 'Ninoz'}
          </Link>
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
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>{item.label}</span>
                  {item.href === '/admin/notifications' && notifCount > 0 && (
                    <span style={{ background: '#C84B0F', color: 'white', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '1px 6px', lineHeight: '16px' }}>
                      {notifCount > 99 ? '99+' : notifCount}
                    </span>
                  )}
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

      <main className="main">
        <div className="main-inner">
          {children}
        </div>
      </main>
    </div>
  )
}
