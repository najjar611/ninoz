// ════════════════════════════════════════════════════════════
// ADMIN LAYOUT
// Responsive — sidebar on desktop, bottom nav on mobile
// ════════════════════════════════════════════════════════════

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/content',   label: 'Content',   icon: '📝' },
    { href: '/admin/images',    label: 'Images',    icon: '🖼️' },
    { href: '/admin/settings',  label: 'Settings',  icon: '⚙️' },
    { href: '/',               label: 'Site',       icon: '🌐' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3EE' }}>
      <style>{`
        /* ── SIDEBAR — desktop only ── */
        .admin-sidebar {
          width: 200px; background: white;
          border-right: 1px solid rgba(0,0,0,0.07);
          position: fixed; top: 0; left: 0; height: 100vh;
          display: flex; flex-direction: column;
          padding: 20px 10px; z-index: 50;
        }
        .admin-main {
          margin-left: 200px;
          padding: 28px 24px;
          min-height: 100vh;
        }
        .admin-bottom-nav { display: none; }

        /* ── BOTTOM NAV — mobile only ── */
        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-main { margin-left: 0; padding: 20px 16px 80px; }
          .admin-bottom-nav {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0;
            background: white; border-top: 1px solid rgba(0,0,0,0.07);
            z-index: 50; padding: 8px 0 12px;
          }
          .admin-bottom-nav a {
            flex: 1; display: flex; flex-direction: column;
            align-items: center; gap: 3px;
            text-decoration: none; color: #7A7068;
            font-size: 10px; font-weight: 500;
            padding: 4px 0;
          }
          .admin-bottom-nav a span:first-child { font-size: 20px; }
        }

        /* Nav link hover */
        .admin-nav-link {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: 8px;
          text-decoration: none; color: #7A7068;
          font-size: 13px; font-weight: 500;
          transition: background 0.15s, color 0.15s;
          margin-bottom: 2px;
        }
        .admin-nav-link:hover { background: #FFF0EA; color: #E8834A; }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 10px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '10px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 700, color: '#1C1C1A' }}>
            ninoz <span style={{ color: '#E8834A', fontSize: '11px', fontWeight: 500 }}>admin</span>
          </div>
        </div>
        {navItems.map(item => (
          <a key={item.href} href={item.href} className="admin-nav-link">
            <span>{item.icon}</span> {item.label}
          </a>
        ))}
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="admin-bottom-nav">
        {navItems.map(item => (
          <a key={item.href} href={item.href}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
