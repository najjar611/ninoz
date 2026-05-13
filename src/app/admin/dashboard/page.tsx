// ADMIN DASHBOARD
// Shows key stats — pulls from Supabase
// To add a stat card: copy one object in the stats array

import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch live stats from database
  const [
    { count: subscribers },
    { count: orders },
    { count: blogs },
    { count: faqs },
  ] = await Promise.all([
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('faq_items').select('*', { count: 'exact', head: true }),
  ])

  // Stat cards — edit label and color here
  const stats = [
    { label: 'Active Subscribers', value: subscribers ?? 0, color: '#E8834A', bg: '#FFF0EA' },
    { label: 'Scheduled Orders',   value: orders ?? 0,      color: '#4A7C59', bg: '#E8F5EE' },
    { label: 'Blog Posts',         value: blogs ?? 0,       color: '#7B5EA7', bg: '#F0ECF9' },
    { label: 'FAQ Items',          value: faqs ?? 0,        color: '#1A5EA8', bg: '#DDEEFF' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: '#7A7068', fontSize: '14px', marginBottom: '32px' }}>Welcome to the Ninoz admin portal.</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '40px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#7A7068' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9A98A', marginBottom: '14px', fontWeight: 600 }}>
        Quick Actions
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
        {[
          { href: '/admin/images',   label: 'Upload Images',  desc: 'Slideshow, plans, blog photos', icon: '🖼️' },
          { href: '/admin/content',  label: 'Edit Content',   desc: 'FAQ, testimonials, blog posts',  icon: '📝' },
          { href: '/admin/settings', label: 'Site Settings',  desc: 'WhatsApp, Instagram, delivery',  icon: '⚙️' },
        ].map(a => (
          <a key={a.href} href={a.href} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.05)', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{a.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1A', marginBottom: '4px' }}>{a.label}</div>
            <div style={{ fontSize: '12px', color: '#7A7068' }}>{a.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
