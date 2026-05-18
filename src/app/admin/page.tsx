'use client'

// src/app/admin/page.tsx — v6 dashboard
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ leads: 0, meals: 0, stages: 0, ingredients: 0 })
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [leads, meals, stages, ingredients, recent] = await Promise.all([
        supabase.from('lead_subscribers').select('id', { count: 'exact', head: true }),
        supabase.from('meals').select('id', { count: 'exact', head: true }),
        supabase.from('stages').select('id', { count: 'exact', head: true }),
        supabase.from('ingredients').select('id', { count: 'exact', head: true }),
        supabase.from('lead_subscribers').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        leads: leads.count || 0,
        meals: meals.count || 0,
        stages: stages.count || 0,
        ingredients: ingredients.count || 0,
      })
      setRecentLeads(recent.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: 'Total Leads', value: stats.leads, icon: '👥', href: '/admin/subscribers', color: '#C84B0F' },
    { label: 'Active Meals', value: stats.meals, icon: '🍽️', href: '/admin/meals', color: '#4A7C59' },
    { label: 'Stages', value: stats.stages, icon: '🍼', href: '/admin/stages', color: '#7B5EA7' },
    { label: 'Ingredients', value: stats.ingredients, icon: '🥕', href: '/admin/ingredients', color: '#E8834A' },
  ]

  const QUICK_LINKS = [
    { label: 'Edit Homepage Text', icon: '📝', href: '/admin/content' },
    { label: 'Add a Meal', icon: '🍽️', href: '/admin/meals' },
    { label: 'Manage Stages', icon: '🍼', href: '/admin/stages' },
    { label: 'View Subscribers', icon: '👥', href: '/admin/subscribers' },
    { label: 'Edit Ingredients', icon: '🥕', href: '/admin/ingredients' },
    { label: 'Payment Cycles', icon: '💳', href: '/admin/payment-cycles' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 26, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>
          Welcome back 👋
        </h1>
        <p style={{ fontSize: 14, color: '#7A7068' }}>Here's what's happening with Ninoz today.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {STAT_CARDS.map(card => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 32, fontWeight: 900, color: card.color, marginBottom: 4 }}>
                {loading ? '...' : card.value}
              </div>
              <div style={{ fontSize: 13, color: '#7A7068', fontWeight: 600 }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Quick Links */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: 800, color: '#1C1C1A', marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_LINKS.map(link => (
              <Link key={link.href} href={link.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#FAF5EE', textDecoration: 'none', color: '#2C1A0E', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F0E8D8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FAF5EE')}>
                <span style={{ fontSize: 18 }}>{link.icon}</span>
                {link.label}
                <span style={{ marginLeft: 'auto', color: '#C9A98A', fontSize: 16 }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: 800, color: '#1C1C1A' }}>Recent Leads</h2>
            <Link href="/admin/subscribers" style={{ fontSize: 12, color: '#C84B0F', fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ color: '#C9A98A', fontSize: 13 }}>Loading...</div>
          ) : recentLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#C9A98A' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p style={{ fontSize: 13 }}>No leads yet. Share your site!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentLeads.map(lead => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#C84B0F', flexShrink: 0 }}>
                    {(lead.parent_name || lead.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.parent_name || lead.email}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A7068' }}>
                      {new Date(lead.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: '50px', background: lead.status === 'converted' ? '#E8F5EE' : lead.status === 'dropped' ? '#FEE2E2' : '#FDF0E8', color: lead.status === 'converted' ? '#2D6A4F' : lead.status === 'dropped' ? '#DC2626' : '#C84B0F', fontWeight: 700 }}>
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
