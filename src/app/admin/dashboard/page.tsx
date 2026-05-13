// ════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — fully responsive
// ════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

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

  const stats = [
    { label: 'Active Subscribers', value: subscribers ?? 0, color: '#E8834A' },
    { label: 'Scheduled Orders',   value: orders ?? 0,      color: '#4A7C59' },
    { label: 'Blog Posts',         value: blogs ?? 0,       color: '#7B5EA7' },
    { label: 'FAQ Items',          value: faqs ?? 0,        color: '#1A5EA8' },
  ]

  const actions = [
    { href: '/admin/images',   icon: '🖼️', label: 'Upload Images',  desc: 'Slideshow, plans, blog' },
    { href: '/admin/content',  icon: '📝', label: 'Edit Content',   desc: 'FAQ, testimonials, blog' },
    { href: '/admin/settings', icon: '⚙️', label: 'Site Settings',  desc: 'WhatsApp, Instagram' },
  ]

  return (
    <>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 32px;
        }
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .stat-card {
          background: white; border-radius: 14px;
          padding: 18px; border: 1px solid rgba(0,0,0,0.05);
        }
        .action-card {
          background: white; border-radius: 14px;
          padding: 18px; border: 1px solid rgba(0,0,0,0.05);
          text-decoration: none; display: block;
          transition: border-color 0.2s;
        }
        .action-card:hover { border-color: #E8834A; }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .actions-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div>
        {/* Header */}
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: '#7A7068', fontSize: '13px', marginBottom: '24px' }}>Welcome to the Ninoz admin portal.</p>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#7A7068' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9A98A', marginBottom: '12px', fontWeight: 600 }}>
          Quick Actions
        </div>
        <div className="actions-grid">
          {actions.map(a => (
            <a key={a.href} href={a.href} className="action-card">
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>{a.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1A', marginBottom: '3px' }}>{a.label}</div>
              <div style={{ fontSize: '12px', color: '#7A7068' }}>{a.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
