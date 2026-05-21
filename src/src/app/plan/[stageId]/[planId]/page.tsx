// ════════════════════════════════════════════════════════════
// PLAN SCHEDULE PAGE — /plan/[stageId]/[planId]
// Shows the weekly meal schedule for a plan
// Pulls from weekly_schedules table
// Edit meals from /admin/stages → plan → schedule
// ════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function PlanSchedulePage(props: { params: Promise<{ stageId: string; planId: string }> }) {
  const { stageId, planId } = await props.params
  const supabase = await createClient()

  const [stageRes, planRes, schedRes] = await Promise.all([
    supabase.from('stages').select('id, name, tag_color').eq('id', stageId).single(),
    supabase.from('plan_details').select('*').eq('id', planId).single(),
    supabase.from('weekly_schedules').select('*').eq('plan_id', planId).order('day_number'),
  ])

  if (!planRes.data) notFound()
  const stage = stageRes.data
  const plan = planRes.data
  const schedule = schedRes.data || []
  const accentColor = plan.tag_color || stage?.tag_color || '#E8834A'

  const mealBg: Record<string, string> = { breakfast:'#FFF0EA', lunch:'#E8F5EE', dinner:'#EEE8F8' }
  const mealColor: Record<string, string> = { breakfast:'#E8834A', lunch:'#4A7C59', dinner:'#7B5EA7' }

  return (
    <>
      <style>{`
        .day-card { background:white; border-radius:16px; padding:20px; border:1px solid rgba(0,0,0,0.06); transition:box-shadow 0.2s, transform 0.2s; }
        .day-card:hover { box-shadow:0 8px 30px rgba(0,0,0,0.07); transform:translateY(-2px); }
        .meal-badge { display:inline-block; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; padding:3px 10px; border-radius:50px; margin-bottom:4px; }
        .back-btn { display:inline-flex; align-items:center; gap:6px; font-size:14px; color:#7A7068; text-decoration:none; font-weight:500; transition:color 0.2s; }
        .back-btn:hover { color:#1C1C1A; }
        .subscribe-btn { background:#E8834A; color:white; border:none; padding:15px 32px; border-radius:50px; font-size:14px; font-weight:600; cursor:pointer; transition:background 0.2s, transform 0.2s; }
        .subscribe-btn:hover { background:#D06A32; transform:translateY(-2px); }
        @media(max-width:768px) { .schedule-grid { grid-template-columns:1fr!important; } }
      `}</style>

      <main style={{ background:'#F5F3EE', minHeight:'100vh', paddingBottom:'80px' }}>

        {/* Header */}
        <div style={{ background:'white', borderBottom:'1px solid rgba(0,0,0,0.06)', padding:'0 6%', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Link href={`/menu/${stageId}`} className="back-btn">← Back to Plans</Link>
            <div style={{ fontFamily:'var(--font-logo)', fontSize:'24px', color:'#1C1C1A' }}>ninoz</div>
            <div style={{ width:'100px' }} />
          </div>
        </div>

        {/* Plan info */}
        <div style={{ padding:'48px 6% 36px', maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ display:'inline-block', background:`${accentColor}18`, color:accentColor, fontSize:'12px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'6px 16px', borderRadius:'50px', marginBottom:'16px' }}>
            Weekly Schedule
          </div>
          <h1 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,44px)', fontWeight:700, lineHeight:1.1, marginBottom:'10px', color:'#1C1C1A' }}>
            {plan.name}
          </h1>
          <p style={{ fontSize:'15px', color:'#7A7068', lineHeight:1.7, maxWidth:'560px', marginBottom:'6px' }}>{plan.description}</p>
          <p style={{ fontSize:'14px', fontWeight:600, color:accentColor }}>{plan.price}</p>
        </div>

        {/* Schedule grid */}
        <div style={{ padding:'0 6%', maxWidth:'1100px', margin:'0 auto 48px' }}>
          <div className="schedule-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
            {schedule.map((day, i) => (
              <div key={day.id} className="day-card">
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'16px', fontWeight:700, color:'#1C1C1A', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:`${accentColor}18`, color:accentColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>{i+1}</div>
                  {day.day}
                </div>
                {day.image_url && (
                  <img src={day.image_url} alt={day.day} style={{ width:'100%', height:'80px', objectFit:'cover', borderRadius:'8px', marginBottom:'12px' }} />
                )}
                {(['breakfast','lunch','dinner'] as const).map(meal => (
                  <div key={meal} style={{ marginBottom:'10px' }}>
                    <div className="meal-badge" style={{ background:mealBg[meal], color:mealColor[meal] }}>{meal}</div>
                    <div style={{ fontSize:'13px', color:'#1C1C1A', fontWeight:500 }}>{day[meal]}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {schedule.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px', color:'#C9A98A', fontSize:'14px' }}>
              No schedule available yet.
            </div>
          )}
        </div>

        {/* Subscribe CTA */}
        <div style={{ textAlign:'center', padding:'0 6%' }}>
          <p style={{ fontSize:'15px', color:'#7A7068', marginBottom:'18px' }}>Ready to subscribe to this plan?</p>
          <button className="subscribe-btn">Subscribe to {plan.name} →</button>
        </div>
      </main>
    </>
  )
}
