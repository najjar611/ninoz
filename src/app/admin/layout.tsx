export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/admin/content',   icon: '📝', label: 'Content' },
    { href: '/admin/stages',    icon: '🥄', label: 'Stages & Plans' },
    { href: '/admin/images',    icon: '🖼️', label: 'Images' },
    { href: '/admin/settings',  icon: '⚙️', label: 'Settings' },
    { href: '/',               icon: '🌐', label: 'Site' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#F5F3EE' }}>
      <style>{`
        .admin-sidebar { width:200px; background:white; border-right:1px solid rgba(0,0,0,0.07); position:fixed; top:0; left:0; height:100vh; display:flex; flex-direction:column; padding:20px 10px; z-index:50; overflow-y:auto; }
        .admin-main { margin-left:200px; padding:28px 24px; min-height:100vh; }
        .admin-bottom-nav { display:none; }
        .anl { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:8px; text-decoration:none; color:#7A7068; font-size:13px; font-weight:500; margin-bottom:2px; transition:background 0.15s, color 0.15s; }
        .anl:hover { background:#FFF0EA; color:#E8834A; }
        @media(max-width:768px) {
          .admin-sidebar { display:none; }
          .admin-main { margin-left:0; padding:16px 14px 80px; }
          .admin-bottom-nav { display:flex; position:fixed; bottom:0; left:0; right:0; background:white; border-top:1px solid rgba(0,0,0,0.07); z-index:50; padding:6px 0 10px; }
          .admin-bottom-nav a { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; text-decoration:none; color:#7A7068; font-size:9px; font-weight:500; }
          .admin-bottom-nav a span:first-child { font-size:18px; }
        }
      `}</style>
      <aside className="admin-sidebar">
        <div style={{ padding:'0 10px 16px', borderBottom:'1px solid rgba(0,0,0,0.06)', marginBottom:'10px' }}>
          <div style={{ fontFamily:'serif', fontSize:'20px', fontWeight:700, color:'#1C1C1A' }}>
            ninoz <span style={{ color:'#E8834A', fontSize:'11px', fontWeight:500 }}>admin</span>
          </div>
        </div>
        {nav.map(item => (
          <a key={item.href} href={item.href} className="anl">
            <span>{item.icon}</span> {item.label}
          </a>
        ))}
      </aside>
      <main className="admin-main">{children}</main>
      <nav className="admin-bottom-nav">
        {nav.map(item => (
          <a key={item.href} href={item.href}>
            <span>{item.icon}</span><span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
