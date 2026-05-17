import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name, email').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') redirect('/')

  const initials = profile.full_name
    ?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'A'

  const nav = [
    { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/admin/content',   icon: '📝', label: 'Content' },
    { href: '/admin/stages',    icon: '🥄', label: 'Stages & Plans' },
    { href: '/admin/meals',     icon: '🍽️', label: 'Meals' },
    { href: '/admin/images',    icon: '🖼️', label: 'Images' },
    { href: '/admin/settings',  icon: '⚙️', label: 'Settings' },
    { href: '/',               icon: '🌐', label: 'View Site' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3EE' }}>
      <style>{`
        .admin-sidebar { width:220px; background:white; border-right:1px solid rgba(0,0,0,0.07); position:fixed; top:0; left:0; height:100vh; display:flex; flex-direction:column; z-index:50; overflow-y:auto; }
        .admin-main { margin-left:220px; padding:28px 24px; min-height:100vh; }
        .admin-bottom-nav { display:none; }
        .anl { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:8px; text-decoration:none; color:#7A7068; font-size:13px; font-weight:500; margin-bottom:2px; transition:background 0.15s, color 0.15s; }
        .anl:hover { background:#FFF0EA; color:#E8834A; }
        .signout-btn { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:8px; color:#DC2626; font-size:13px; font-weight:500; background:none; border:none; cursor:pointer; width:100%; transition:background 0.15s; }
        .signout-btn:hover { background:#FEE2E2; }
        @media(max-width:768px) {
          .admin-sidebar { display:none; }
          .admin-main { margin-left:0; padding:16px 14px 80px; }
          .admin-bottom-nav { display:flex; position:fixed; bottom:0; left:0; right:0; background:white; border-top:1px solid rgba(0,0,0,0.07); z-index:50; padding:6px 0 10px; overflow-x:auto; }
          .admin-bottom-nav a { flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:2px; text-decoration:none; color:#7A7068; font-size:9px; font-weight:500; padding:0 10px; }
          .admin-bottom-nav a span:first-child { font-size:18px; }
        }
      `}</style>

      <aside className="admin-sidebar">
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
          <Link href="/" style={{ fontFamily:'serif', fontSize:'20px', fontWeight:700, color:'#1C1C1A', textDecoration:'none' }}>
            Ninoz <span style={{ color:'#E8834A', fontSize:'11px', fontWeight:500 }}>admin</span>
          </Link>
        </div>
        <nav style={{ flex:1, padding:'10px' }}>
          {nav.map(item => (
            <a key={item.href} href={item.href} className="anl">
              <span>{item.icon}</span> {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', marginBottom:'4px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#FFF0EA', color:'#E8834A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:'13px', fontWeight:600, color:'#1C1C1A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.full_name || 'Admin'}</div>
              <div style={{ fontSize:'11px', color:'#C9A98A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.email}</div>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="signout-btn">🚪 Sign out</button>
          </form>
        </div>
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
