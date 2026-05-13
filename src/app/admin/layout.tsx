// ADMIN LAYOUT — protects all admin pages
// To add nav items: edit navItems array below

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#F5F3EE' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>

          {/* Sidebar */}
          <aside style={{
            width: '220px', background: 'white',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            padding: '24px 12px', display: 'flex',
            flexDirection: 'column', gap: '4px',
            position: 'fixed', height: '100vh',
          }}>
            <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 700, padding: '0 10px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '8px' }}>
              ninoz <span style={{ color: '#E8834A', fontSize: '12px', fontWeight: 500 }}>admin</span>
            </div>

            {/* Nav links — add pages here */}
            {[
              { href: '/admin/dashboard', label: '📊 Dashboard' },
              { href: '/admin/content',   label: '📝 Content' },
              { href: '/admin/images',    label: '🖼️ Images' },
              { href: '/admin/settings',  label: '⚙️ Settings' },
              { href: '/',               label: '← Back to site' },
            ].map(item => (
              <a key={item.href} href={item.href} style={{
                display: 'block', padding: '10px 12px', borderRadius: '8px',
                textDecoration: 'none', color: '#7A7068', fontSize: '14px',
                fontWeight: 500, transition: 'background 0.15s',
              }}
            
              >
                {item.label}
              </a>
            ))}
          </aside>

          {/* Main content */}
          <main style={{ flex: 1, marginLeft: '220px', padding: '32px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
