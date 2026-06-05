'use client'

// src/app/admin/page.tsx — v6.1
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ leads: 0, meals: 0, stages: 0, faqs: 0 })
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [leads, meals, stages, faqs, recent] = await Promise.all([
        supabase.from('lead_subscribers').select('id', { count: 'exact', head: true }),
        supabase.from('meals').select('id', { count: 'exact', head: true }),
        supabase.from('stages').select('id', { count: 'exact', head: true }),
        supabase.from('faqs').select('id', { count: 'exact', head: true }),
        supabase.from('lead_subscribers').select('*').order('created_at', { ascending: false }).limit(6),
      ])
      setStats({ leads: leads.count || 0, meals: meals.count || 0, stages: stages.count || 0, faqs: faqs.count || 0 })
      setRecentLeads(recent.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const STATS = [
    { label: 'Subscribers', value: stats.leads, icon: '👥', href: '/admin/subscribers', color: '#C84B0F' },
    { label: 'Meals', value: stats.meals, icon: '🍽️', href: '/admin/meals', color: '#4A7C59' },
    { label: 'Stages', value: stats.stages, icon: '🍼', href: '/admin/stages', color: '#7B5EA7' },
    { label: 'FAQs', value: stats.faqs, icon: '❓', href: '/admin/faq', color: '#E8834A' },
  ]

  const QUICK = [
    { label: 'Edit Homepage Text', icon: '📝', href: '/admin/content' },
    { label: 'Add a Meal', icon: '🍽️', href: '/admin/meals' },
    { label: 'Manage Stages', icon: '🍼', href: '/admin/stages' },
    { label: 'View Subscribers', icon: '👥', href: '/admin/subscribers' },
    { label: 'Edit FAQ', icon: '❓', href: '/admin/faq' },
    { label: 'Site Settings', icon: '⚙️', href: '/admin/settings' },
  ]

  const statusColors: Record<string, string> = { lead: '#C84B0F', converted: '#2D6A4F', dropped: '#DC2626' }
  const statusBgs: Record<string, string> = { lead: '#FDF0E8', converted: '#E8F5EE', dropped: '#FEE2E2' }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#7A7068' }}>Welcome back. Here's your Ninoz overview.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {STATS.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', borderRadius: 14, padding: '20px 18px', border: '1px solid rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 30, fontWeight: 900, color: s.color, marginBottom: 2 }}>
                {loading ? '–' : s.value}
              </div>
              <div style={{ fontSize: 12, color: '#7A7068', fontWeight: 600 }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 15, fontWeight: 800, color: '#1C1C1A', marginBottom: 14 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK.map(q => (
              <Link key={q.href} href={q.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#FAF5EE', textDecoration: 'none', color: '#2C1A0E', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F0E8D8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FAF5EE')}>
                <span style={{ fontSize: 16 }}>{q.icon}</span>
                {q.label}
                <span style={{ marginLeft: 'auto', color: '#C9A98A' }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 15, fontWeight: 800, color: '#1C1C1A' }}>Recent Subscribers</h2>
            <Link href="/admin/subscribers" style={{ fontSize: 12, color: '#C84B0F', fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ color: '#C9A98A', fontSize: 13 }}>Loading...</div>
          ) : recentLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#C9A98A' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p style={{ fontSize: 13 }}>No subscribers yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentLeads.map(lead => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#C84B0F', flexShrink: 0 }}>
                    {(lead.parent_name || lead.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.parent_name || lead.email}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A7068' }}>
                      {new Date(lead.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 50, background: statusBgs[lead.status] || '#F5F5F5', color: statusColors[lead.status] || '#333', fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>
                    {lead.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
