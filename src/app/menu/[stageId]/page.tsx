// ════════════════════════════════════════════════════════════
// MENU PAGE — /menu/[stageId]
// Shows all plans for a stage
// Pulls from plan_details table in Supabase
// Edit plans from /admin/stages
// ════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function MenuPage({ params }: { params: Promise<{ stageId: string }> }) {
  const supabase = await createClient()
  const { stageId } = await params

  const [stageRes, plansRes] = await Promise.all([
    supabase.from('stages').select('*').eq('id', stageId).single(),
    supabase.from('plan_details').select('*').eq('stage_id', stageId).eq('is_active', true).order('plan_number'),
  ])

  if (!stageRes.data) notFound()
  const stage = stageRes.data
  const plans = plansRes.data || []

  return (
    <>
      <style>{`
        .plan-card { background:white; border-radius:20px; overflow:hidden; border:2px solid transparent; transition:transform 0.3s, border-color 0.3s, box-shadow 0.3s; cursor:pointer; text-decoration:none; display:block; color:inherit; }
        .plan-card:hover { transform:translateY(-5px); border-color:${stage.tag_color || '#E8834A'}; box-shadow:0 16px 40px rgba(0,0,0,0.08); }
        .back-btn { display:inline-flex; align-items:center; gap:6px; font-size:14px; color:#7A7068; text-decoration:none; font-weight:500; transition:color 0.2s; }
        .back-btn:hover { color:#1C1C1A; }
        @media(max-width:768px) { .plans-grid { grid-template-columns:1fr!important; } }
      `}</style>

      <main style={{ background:'#F5F3EE', minHeight:'100vh', paddingBottom:'80px' }}>

        {/* Header */}
        <div style={{ background:'white', borderBottom:'1px solid rgba(0,0,0,0.06)', padding:'0 6%', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Link href="/" className="back-btn">← Back</Link>
            <div style={{ fontFamily:'var(--font-logo)', fontSize:'24px', color:'#1C1C1A' }}>ninoz</div>
            <div style={{ width:'60px' }} />
          </div>
        </div>

        {/* Page header */}
        <div style={{ padding:'48px 6% 36px', maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ display:'inline-block', background:`${stage.tag_color || '#E8834A'}18`, color: stage.tag_color || '#E8834A', fontSize:'12px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'6px 16px', borderRadius:'50px', marginBottom:'16px' }}>
            {stage.name} · {stage.age_range}
          </div>
          <h1 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(28px,4vw,48px)', fontWeight:700, lineHeight:1.1, marginBottom:'12px', color:'#1C1C1A' }}>
            {stage.name}
          </h1>
          <p style={{ fontSize:'16px', color:'#7A7068', lineHeight:1.7, maxWidth:'560px' }}>{stage.description}</p>
          <p style={{ fontSize:'14px', color:'#7A7068', marginTop:'8px' }}>Choose a plan to see the full weekly meal schedule.</p>
        </div>

        {/* Plans grid */}
        <div style={{ padding:'0 6%', maxWidth:'1100px', margin:'0 auto' }}>
          <div className="plans-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:'20px' }}>
            {plans.map(plan => (
              <Link key={plan.id} href={`/plan/${stageId}/${plan.id}`} className="plan-card">
                <div style={{ width:'100%', height:'200px', background:'linear-gradient(145deg,#F0EBE3,#E0EBE0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'56px', position:'relative', overflow:'hidden' }}>
                  {plan.image_url
                    ? <img src={plan.image_url} alt={plan.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : plan.emoji || '🍽️'
                  }
                  {plan.tag && (
                    <div style={{ position:'absolute', top:'12px', left:'12px', background: plan.tag_color || '#E8834A', color:'white', fontSize:'11px', fontWeight:600, padding:'4px 12px', borderRadius:'50px' }}>{plan.tag}</div>
                  )}
                </div>
                <div style={{ padding:'22px' }}>
                  <div style={{ fontFamily:'var(--font-hero)', fontSize:'20px', fontWeight:700, marginBottom:'8px', color:'#1C1C1A' }}>{plan.name}</div>
                  <p style={{ fontSize:'14px', color:'#7A7068', lineHeight:1.6, marginBottom:'14px' }}>{plan.description}</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:'14px', fontWeight:600, color: plan.tag_color || '#E8834A' }}>{plan.price}</div>
                    <div style={{ background:'#1C1C1A', color:'white', fontSize:'12px', fontWeight:600, padding:'7px 16px', borderRadius:'50px' }}>See Schedule →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {plans.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px', color:'#C9A98A', fontSize:'14px' }}>
              No plans available yet. Check back soon.
            </div>
          )}
        </div>
      </main>
    </>
  )
}
