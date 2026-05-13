// ════════════════════════════════════════════════════════════
// PLAN LIST PAGE TEMPLATE
// Back button → goes to previous page (browser back)
// Logo → goes to home page
// ════════════════════════════════════════════════════════════
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plan } from './meals-data'

type Props = {
  stage: string
  ageRange: string
  title: string
  description: string
  accentColor: string
  plans: Plan[]
  stageSlug: string
}

export default function PlanListTemplate({ stage, ageRange, title, description, accentColor, plans, stageSlug }: Props) {
  // ── BACK NAVIGATION ──
  // Goes to previous page, not home
  const router = useRouter()

  return (
    <>
      <style>{`
        .plan-card {
          background: white; border-radius: 20px; overflow: hidden;
          border: 2px solid transparent;
          transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
          cursor: pointer; text-decoration: none; display: block; color: inherit;
        }
        .plan-card:hover { transform: translateY(-5px); border-color: ${accentColor}; box-shadow: 0 16px 40px rgba(0,0,0,0.08); }
        .back-btn { background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: #7A7068; font-weight: 500; transition: color 0.2s; padding: 0; }
        .back-btn:hover { color: #1C1C1A; }
        @media (max-width: 768px) {
          .plans-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <main style={{ background: '#FAF9F6', minHeight: '100vh', paddingBottom: '80px' }}>

        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 6%', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* ← Back — goes to previous page */}
            <button className="back-btn" onClick={() => router.back()}>
              ← Back
            </button>
            {/* Logo — goes to home page */}
            <Link href="/" style={{ fontFamily: 'var(--font-logo)', fontSize: '24px', color: '#1C1C1A', textDecoration: 'none' }}>
              ninoz
            </Link>
            <div style={{ width: '60px' }} />
          </div>
        </div>

        {/* Page header */}
        <div style={{ padding: '48px 6% 36px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: `${accentColor}18`, color: accentColor, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px' }}>
            {stage} · {ageRange}
          </div>
          <h1 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, lineHeight: 1.1, marginBottom: '12px', color: '#1C1C1A' }}>
            {title}
          </h1>
          <p style={{ fontSize: '16px', color: '#7A7068', lineHeight: 1.7, maxWidth: '560px' }}>{description}</p>
          <p style={{ fontSize: '14px', color: '#7A7068', marginTop: '8px' }}>Choose a plan to see the full weekly meal schedule.</p>
        </div>

        {/* Plans grid */}
        <div style={{ padding: '0 6%', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {plans.map((plan) => (
              <Link key={plan.id} href={`/plan/${stageSlug}/${plan.id}`} className="plan-card">
                <div style={{ width: '100%', height: '180px', background: 'linear-gradient(145deg,#F0EBE3,#E0EBE0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px', position: 'relative' }}>
                  {/* SWAP: <img src={plan.image} alt={plan.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> */}
                  🍽️
                  {plan.tag && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: accentColor, color: 'white', fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '50px' }}>{plan.tag}</div>
                  )}
                </div>
                <div style={{ padding: '22px' }}>
                  <div style={{ fontFamily: 'var(--font-hero)', fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1C1C1A' }}>{plan.name}</div>
                  <p style={{ fontSize: '14px', color: '#7A7068', lineHeight: 1.6, marginBottom: '14px' }}>{plan.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: accentColor }}>{plan.price}</div>
                    <div style={{ background: '#1C1C1A', color: 'white', fontSize: '12px', fontWeight: 600, padding: '7px 16px', borderRadius: '50px' }}>See Schedule →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
