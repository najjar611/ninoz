// ════════════════════════════════════════════════════════════
// WEEKLY PLAN SCHEDULE PAGE
// Back button → goes to previous page
// Logo → goes to home page
// ════════════════════════════════════════════════════════════
'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { stage1Plans, stage2Plans, stage3Plans } from '@/app/menu/meals-data'

const allPlans = [...stage1Plans, ...stage2Plans, ...stage3Plans]
const stageColors: Record<string, string> = {
  'stage-1': '#E8834A',
  'stage-2': '#4A7C59',
  'stage-3': '#7B5EA7',
}

export default function PlanSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const stage = params.stage as string
  const planId = params.planId as string
  const plan = allPlans.find(p => p.id === planId)
  const accentColor = stageColors[stage] || '#E8834A'
  const mealTypes = ['breakfast', 'lunch', 'dinner'] as const

  if (!plan) return (
    <div style={{ padding: '100px 6%', textAlign: 'center' }}>
      <h1>Plan not found</h1>
      <Link href="/">← Back to home</Link>
    </div>
  )

  return (
    <>
      <style>{`
        .day-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); transition: box-shadow 0.2s, transform 0.2s; }
        .day-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .meal-badge { display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 50px; margin-bottom: 4px; }
        .back-btn { background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: #7A7068; font-weight: 500; transition: color 0.2s; padding: 0; }
        .back-btn:hover { color: #1C1C1A; }
        .subscribe-btn { background: #E8834A; color: white; border: none; padding: 15px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.2s, transform 0.2s; }
        .subscribe-btn:hover { background: #D06A32; transform: translateY(-2px); }
        @media (max-width: 768px) {
          .schedule-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <main style={{ background: '#FAF9F6', minHeight: '100vh', paddingBottom: '80px' }}>

        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 6%', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* ← Back — goes to previous page */}
            <button className="back-btn" onClick={() => router.back()}>← Back</button>
            {/* Logo — goes to home */}
            <Link href="/" style={{ fontFamily: 'var(--font-logo)', fontSize: '24px', color: '#1C1C1A', textDecoration: 'none' }}>ninoz</Link>
            <div style={{ width: '60px' }} />
          </div>
        </div>

        {/* Plan info */}
        <div style={{ padding: '48px 6% 36px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: `${accentColor}18`, color: accentColor, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px' }}>Weekly Schedule</div>
          <h1 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(24px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginBottom: '10px', color: '#1C1C1A' }}>{plan.name} — Full Week</h1>
          <p style={{ fontSize: '15px', color: '#7A7068', lineHeight: 1.7, maxWidth: '560px', marginBottom: '6px' }}>{plan.description}</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: accentColor }}>{plan.price}</p>
        </div>

        {/* Weekly schedule */}
        <div style={{ padding: '0 6%', maxWidth: '1100px', margin: '0 auto 48px' }}>
          <div className="schedule-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {plan.weeklySchedule.map((day, i) => (
              <div key={day.day} className="day-card">
                <div style={{ fontFamily: 'var(--font-hero)', fontSize: '16px', fontWeight: 700, color: '#1C1C1A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${accentColor}18`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  {day.day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mealTypes.map(type => {
                    const badges: Record<string, { bg: string; color: string }> = {
                      breakfast: { bg: '#FFF0EA', color: '#E8834A' },
                      lunch: { bg: '#E8F5EE', color: '#4A7C59' },
                      dinner: { bg: '#EEE8F8', color: '#7B5EA7' },
                    }
                    const b = badges[type]
                    return (
                      <div key={type}>
                        <div className="meal-badge" style={{ background: b.bg, color: b.color }}>{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div style={{ fontSize: '13px', color: '#1C1C1A', fontWeight: 500 }}>{day[type]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe CTA */}
        <div style={{ textAlign: 'center', padding: '0 6%' }}>
          <p style={{ fontSize: '15px', color: '#7A7068', marginBottom: '18px' }}>Ready to subscribe to this plan?</p>
          <button className="subscribe-btn">Subscribe to {plan.name} →</button>
        </div>
      </main>
    </>
  )
}
