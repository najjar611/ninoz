'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const QUICK = [
  { label: 'Edit Homepage Text', href: '/admin/content', desc: 'Headlines, descriptions, CTA' },
  { label: 'Add / Edit Meals', href: '/admin/meals', desc: 'Manage your menu' },
  { label: 'Manage Stages', href: '/admin/stages', desc: 'Age-based meal plans' },
  { label: 'Site Settings', href: '/admin/settings', desc: 'Logo, fonts, colors' },
  { label: 'Manage Waitlist', href: '/admin/waitlist', desc: 'View signups, edit page' },
  { label: 'View Subscribers', href: '/admin/subscribers', desc: 'All registered customers' },
]

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmt(n: number) {
  return n.toLocaleString()
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ waitlist: 0, subscribers: 0, meals: 0, stages: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [waitlist, subscribers, meals, stages, recentW] = await Promise.all([
        supabase.from('waitlist_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('subscribers').select('id', { count: 'exact', head: true }),
        supabase.from('meals').select('id', { count: 'exact', head: true }),
        supabase.from('stages').select('id', { count: 'exact', head: true }),
        supabase.from('waitlist_submissions').select('*').order('created_at', { ascending: false }).limit(8),
      ])
      setStats({
        waitlist: waitlist.count || 0,
        subscribers: subscribers.count || 0,
        meals: meals.count || 0,
        stages: stages.count || 0,
      })
      setRecent(recentW.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('en-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const STATS = [
    { label: 'Waitlist Signups', value: stats.waitlist, href: '/admin/waitlist', color: '#C84B0F', bg: '#FDF0E8' },
    { label: 'Subscribers', value: stats.subscribers, href: '/admin/subscribers', color: '#0A429B', bg: '#EEF3FB' },
    { label: 'Meals', value: stats.meals, href: '/admin/meals', color: '#2D6A4F', bg: '#E8F5EE' },
    { label: 'Stages', value: stats.stages, href: '/admin/stages', color: '#7B5EA7', bg: '#F2EEF8' },
  ]

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: '#B0A098', fontWeight: 600, marginBottom: 4 }}>{today}</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1C1C1A', lineHeight: 1.1 }}>
          {timeGreeting()} <span style={{ color: '#C84B0F' }}>👋</span>
        </h1>
        <p style={{ fontSize: 14, color: '#7A7068', marginTop: 4 }}>Here's what's happening with Ninoz today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {STATS.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '22px 20px',
              border: '1px solid #EDEBE8', transition: 'transform 0.18s, box-shadow 0.18s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: s.color, opacity: 0.85 }} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 6 }}>
                {loading ? '—' : fmt(s.value)}
              </div>
              <div style={{ fontSize: 12, color: '#7A7068', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom two-panel layout */}
      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Recent Waitlist */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDEBE8', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #F5F0EB' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1A' }}>Recent Waitlist Signups</div>
              <div style={{ fontSize: 12, color: '#B0A098', marginTop: 2 }}>Latest people who joined</div>
            </div>
            <Link href="/admin/waitlist" style={{ fontSize: 12, fontWeight: 700, color: '#C84B0F', textDecoration: 'none', padding: '6px 14px', background: '#FDF0E8', borderRadius: 8 }}>
              View All →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#C9A98A', fontSize: 14 }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 14 }}>No signups yet</div>
              <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Share /waitlist on your Instagram bio</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F5F0EB' }}>
                  {['Name', 'WhatsApp', "Baby's Age", 'Lang', 'Signed Up'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 10.5, fontWeight: 800, color: '#B0A098', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid #F9F7F5' : 'none' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#C84B0F', flexShrink: 0 }}>
                          {(r.parent_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1C1C1A' }}>{r.parent_name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontFamily: 'monospace', color: '#4A3C34' }}>{r.whatsapp || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#7A7068' }}>{r.baby_age || <span style={{ color: '#DDD' }}>—</span>}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: r.language === 'ar' ? '#EEF3FB' : '#E8F5EE', color: r.language === 'ar' ? '#0A429B' : '#2D6A4F' }}>
                        {r.language === 'ar' ? 'AR' : 'EN'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#B0A098', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDEBE8', padding: '18px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1A', marginBottom: 4 }}>Quick Actions</div>
          <div style={{ fontSize: 12, color: '#B0A098', marginBottom: 18 }}>Jump to any section</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK.map(q => (
              <Link key={q.href} href={q.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '11px 14px', borderRadius: 11, background: '#F9F7F5',
                  border: '1px solid #F0EBE5', transition: 'all 0.14s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FDF0E8'; e.currentTarget.style.borderColor = '#F5DACC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F9F7F5'; e.currentTarget.style.borderColor = '#F0EBE5' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A' }}>{q.label}</div>
                  <div style={{ fontSize: 11.5, color: '#A09088', marginTop: 2 }}>{q.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-table { overflow-x: auto; display: block; }
        }
      `}</style>
    </div>
  )
}
