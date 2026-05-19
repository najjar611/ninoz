'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
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

type Lead = { id: string; email: string; parent_name: string | null; created_at: string }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifs, setNotifs] = useState<Lead[]>([])
  const [unread, setUnread] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email || '')
    })

    const channel = supabase
      .channel('admin-leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lead_subscribers' }, payload => {
        const lead = payload.new as Lead
        setNotifs(prev => [lead, ...prev].slice(0, 15))
        setUnread(n => n + 1)
        try {
          const ctx = new AudioContext()
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.frequency.value = 830
          g.gain.setValueAtTime(0.08, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
          o.start(); o.stop(ctx.currentTime + 0.4)
        } catch {}
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Nunito Sans', sans-serif", background:'#F5F0EB' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap');
        .an{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;transition:all 0.15s;color:rgba(255,255,255,0.55);margin-bottom:3px;border:none;background:none;width:100%;text-align:left;font-family:'Nunito Sans',sans-serif;cursor:pointer}
        .an:hover{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.9)}
        .an.act{background:rgba(200,75,15,0.18);color:#FFB347}
        .ham{display:none;position:fixed;top:16px;left:16px;z-index:200;width:40px;height:40px;border-radius:10px;background:#2C1A0E;border:none;color:white;font-size:18px;cursor:pointer;align-items:center;justify-content:center}
        .adm-side{width:220px;background:#2C1A0E;position:fixed;top:0;left:0;bottom:0;z-index:150;display:flex;flex-direction:column;overflow-y:auto;transition:transform 0.3s ease}
        @media(max-width:768px){.ham{display:flex}.adm-side{transform:translateX(-100%)}.adm-side.open{transform:translateX(0)}.adm-main{margin-left:0!important;padding:20px!important;padding-top:64px!important}}
      `}</style>

      <button className="ham" onClick={() => setMobileOpen(o => !o)}>☰</button>

      <aside className={`adm-side ${mobileOpen ? 'open' : ''}`}>
        <div style={{ padding:'24px 20px 16px' }}>
          <Link href="/" style={{ fontFamily:'Nunito,sans-serif', fontSize:24, fontWeight:900, color:'#FFB347', textDecoration:'none', display:'block' }}>Ninoz</Link>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.1em' }}>Admin</div>
        </div>
        <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'0 16px 12px' }}/>
        <nav style={{ flex:1, padding:'0 10px' }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className={`an ${isActive(item)?'act':''}`} onClick={() => setMobileOpen(false)}>
              <span style={{ fontSize:16 }}>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding:'12px 16px 20px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          {email && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:8, wordBreak:'break-all' }}>{email}</div>}
          <button onClick={signOut} style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:140 }}/>}

      <main className="adm-main" style={{ marginLeft:220, flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        {/* Top bar */}
        <div style={{ background:'white', borderBottom:'1px solid rgba(0,0,0,0.06)', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:12, position:'sticky', top:0, zIndex:90 }}>
          <Link href="/" target="_blank" style={{ fontSize:12, color:'#7A7068', fontWeight:600, textDecoration:'none' }}>View Site ↗</Link>

          {/* Bell */}
          <div ref={bellRef} style={{ position:'relative' }}>
            <button onClick={() => { setBellOpen(o => !o); setUnread(0) }}
              style={{ width:38, height:38, borderRadius:'50%', background:unread>0?'#FDF0E8':'transparent', border:`1.5px solid ${unread>0?'#C84B0F':'rgba(0,0,0,0.1)'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, position:'relative', transition:'all 0.2s' }}>
              🔔
              {unread > 0 && (
                <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:'50%', background:'#C84B0F', color:'white', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>
                  {unread > 9 ? '9+' : unread}
                </div>
              )}
            </button>

            {bellOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:300, background:'white', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.14)', border:'1px solid rgba(0,0,0,0.07)', zIndex:200, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(0,0,0,0.06)', fontFamily:'Nunito,sans-serif', fontSize:13, fontWeight:800, color:'#1C1C1A', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  New Subscribers
                  <span style={{ fontSize:11, color:'#7A7068', fontWeight:500 }}>Real-time</span>
                </div>
                {notifs.length === 0 ? (
                  <div style={{ padding:'24px 16px', textAlign:'center', color:'#C9A98A', fontSize:13 }}>
                    No new subscribers yet.<br/>They'll appear here instantly.
                  </div>
                ) : (
                  notifs.map(n => (
                    <div key={n.id} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'#FDF0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#C84B0F', flexShrink:0 }}>
                        {(n.parent_name || n.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1C1C1A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {n.parent_name || n.email}
                        </div>
                        <div style={{ fontSize:11, color:'#7A7068' }}>
                          {new Date(n.created_at).toLocaleTimeString('en-SA', { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                      <div style={{ fontSize:10, background:'#FDF0E8', color:'#C84B0F', padding:'2px 8px', borderRadius:50, fontWeight:700 }}>New</div>
                    </div>
                  ))
                )}
                <div style={{ padding:'10px 16px' }}>
                  <Link href="/admin/subscribers" onClick={() => setBellOpen(false)} style={{ fontSize:12, color:'#C84B0F', fontWeight:700, textDecoration:'none' }}>
                    View all subscribers →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding:'32px 40px', flex:1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
