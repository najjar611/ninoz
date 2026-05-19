'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stage = { id: string; name: string; age_range: string; description: string; emoji: string }
type PaymentCycle = { id: string; label: string; days: number; meals_total: number; price_sar: number }

type Props = {
  stages: Stage[]
  paymentCycles: PaymentCycle[]
  content: Record<string, string>
  onClose: () => void
}

const g = (c: Record<string, string>, k: string, f = '') => c[k] || f

const FOOD = [
  { top: '5%', left: '2%', emoji: '🥕', size: 72, rotate: -20 },
  { top: '5%', right: '2%', emoji: '🥦', size: 72, rotate: 15 },
  { bottom: '5%', left: '2%', emoji: '🍊', size: 68, rotate: 10 },
  { bottom: '5%', right: '2%', emoji: '🫛', size: 68, rotate: -15 },
  { top: '40%', left: '-2%', emoji: '🥬', size: 56, rotate: 25 },
  { top: '40%', right: '-2%', emoji: '🍠', size: 56, rotate: -10 },
]

export default function SubscriptionPopup({ stages, paymentCycles, content, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [kidBirthday, setKidBirthday] = useState('')
  const [stageId, setStageId] = useState('')
  const [cycleId, setCycleId] = useState('')

  function canNext() {
    if (step === 1) return email.includes('@') && email.includes('.')
    if (step === 2) return parentName.trim().length > 0 && kidName.trim().length > 0
    if (step === 3) return !!stageId
    if (step === 4) return !!cycleId
    return false
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const selectedStage = stages.find(s => s.id === stageId)
      const selectedCycle = paymentCycles.find(c => c.id === cycleId)
      const { error: err } = await supabase.from('lead_subscribers').insert({
        email,
        parent_name: parentName,
        kid_name: kidName,
        kid_birthday: kidBirthday || null,
        stage: selectedStage?.name || stageId,
        payment_cycle: selectedCycle?.label || cycleId,
        status: 'lead',
      })
      if (err) throw err
      setDone(true)
    } catch (e: any) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const O = '#C84B0F'
  const BR = '#2C1A0E'
  const MU = '#8A7A6E'
  const CR = '#FAF5EE'

  const inp: React.CSSProperties = {
    width: '100%', padding: '14px 16px', border: `1.5px solid rgba(200,75,15,0.25)`,
    borderRadius: 12, fontSize: 16, color: BR, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14,
    background: 'rgba(250,245,238,0.5)',
  }

  const titles = [
    g(content, 'popup_step1_title', "Let's get started"),
    g(content, 'popup_step2_title', 'Meal Picks, Just for you'),
    g(content, 'popup_step3_title', 'Customized Your Plan'),
    g(content, 'popup_step4_title', 'Payment Cycle'),
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(44,26,14,0.6)', backdropFilter:'blur(8px)' }}
      onClick={onClose}>
      <div style={{ background:'white', borderRadius:28, width:'100%', maxWidth:480, position:'relative', overflow:'hidden', maxHeight:'92vh', overflowY:'auto', animation:'spop 0.3s ease' }}
        onClick={e => e.stopPropagation()}>
        <style>{`@keyframes spop { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>

        {/* Food decorations */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          {FOOD.map((f,i) => (
            <span key={i} style={{ position:'absolute', fontSize:f.size, opacity:0.15, userSelect:'none', top:(f as any).top, bottom:(f as any).bottom, left:(f as any).left, right:(f as any).right, transform:`rotate(${f.rotate}deg)`, display:'block' }}>
              {f.emoji}
            </span>
          ))}
        </div>

        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, zIndex:10, width:32, height:32, borderRadius:'50%', background:'rgba(44,26,14,0.08)', border:'none', color:BR, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        {done ? (
          <div style={{ padding:'3rem 2rem', textAlign:'center', position:'relative', zIndex:1 }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎉</div>
            <h2 style={{ fontSize:'1.6rem', fontWeight:900, color:BR, marginBottom:'0.7rem' }}>You're on the list, {parentName}!</h2>
            <p style={{ fontSize:'0.95rem', color:MU, lineHeight:1.7, marginBottom:'1.5rem' }}>
              We'll reach out to <strong>{email}</strong> shortly to confirm your plan for <strong>{kidName}</strong>.<br/><br/>No payment taken yet — we'll walk you through everything.
            </p>
            <button onClick={onClose} style={{ background:O, color:'white', border:'none', padding:'14px 40px', borderRadius:50, fontFamily:'inherit', fontSize:'1rem', fontWeight:700, cursor:'pointer' }}>Back to Home</button>
          </div>
        ) : (
          <div style={{ padding:'2.5rem 2rem', position:'relative', zIndex:1 }}>
            {/* Progress */}
            <div style={{ display:'flex', gap:6, marginBottom:'1.5rem' }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{ flex:1, height:4, borderRadius:2, background:n<=step?O:'rgba(200,75,15,0.15)', transition:'background 0.3s' }}/>
              ))}
            </div>

            <h2 style={{ fontSize:'1.6rem', fontWeight:900, color:O, textAlign:'center', marginBottom:'0.4rem' }}>{titles[step-1]}</h2>
            {step === 2 && <p style={{ fontSize:'0.85rem', color:MU, textAlign:'center', marginBottom:'1.5rem', lineHeight:1.6 }}>{g(content,'popup_step2_subtitle','With a few details we will tailor your experience')}</p>}
            {step === 3 && <p style={{ fontSize:'0.85rem', color:MU, textAlign:'center', marginBottom:'1.5rem' }}>{g(content,'popup_step3_subtitle','Fresh & healthy meals delivered to your doorstep')}</p>}
            {step === 4 && <p style={{ fontSize:'0.85rem', color:MU, textAlign:'center', marginBottom:'1.5rem' }}>{g(content,'popup_step4_subtitle','Fresh & healthy meals delivered to your doorstep')}</p>}

            {step === 1 && (
              <div style={{ marginTop:'1.5rem' }}>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:BR, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{g(content,'popup_step1_field1','Email')}</label>
                <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoFocus
                  onFocus={e => (e.target.style.borderColor=O)} onBlur={e => (e.target.style.borderColor='rgba(200,75,15,0.25)')}
                  onKeyDown={e => { if(e.key==='Enter'&&canNext()) setStep(2) }} />
              </div>
            )}

            {step === 2 && (
              <div style={{ marginTop:'0.5rem' }}>
                {[
                  { label: g(content,'popup_step2_field1','Your First Name'), val: parentName, set: setParentName, type:'text', ph:'e.g. Sara' },
                  { label: g(content,'popup_step2_field2',"Kid's Name"), val: kidName, set: setKidName, type:'text', ph:'e.g. Adam' },
                  { label: `${g(content,'popup_step2_field3',"Kid's Birthday")} (optional)`, val: kidBirthday, set: setKidBirthday, type:'date', ph:'' },
                ].map((f,i) => (
                  <div key={i}>
                    <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:BR, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</label>
                    <input style={{ ...inp, marginBottom: i === 2 ? 0 : 14 }} type={f.type} placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}
                      onFocus={e => (e.target.style.borderColor=O)} onBlur={e => (e.target.style.borderColor='rgba(200,75,15,0.25)')} />
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:'0.5rem' }}>
                {stages.map(s => (
                  <div key={s.id} onClick={() => setStageId(s.id)}
                    style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', border:`2px solid ${stageId===s.id?O:'rgba(200,75,15,0.15)'}`, borderRadius:14, cursor:'pointer', background:stageId===s.id?'rgba(200,75,15,0.05)':'white', transition:'all 0.2s' }}>
                    <span style={{ fontSize:'2rem' }}>{s.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, color:BR, fontSize:'1rem' }}>{s.name}</div>
                      <div style={{ fontSize:'0.8rem', color:MU }}>{s.age_range} · {s.description}</div>
                    </div>
                    {stageId === s.id && <div style={{ width:22, height:22, borderRadius:'50%', background:O, color:'white', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✓</div>}
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:'0.5rem' }}>
                {paymentCycles.map(cy => (
                  <div key={cy.id} onClick={() => setCycleId(cy.id)}
                    style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', border:`2px solid ${cycleId===cy.id?O:'rgba(200,75,15,0.15)'}`, borderRadius:14, cursor:'pointer', background:cycleId===cy.id?'rgba(200,75,15,0.05)':'white', transition:'all 0.2s' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, color:O, fontSize:'1rem' }}>{cy.label}</div>
                      <div style={{ fontSize:'0.8rem', color:MU }}>{cy.days} days / {cy.meals_total} meals total</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:900, color:BR, fontSize:'1.1rem' }}>{cy.price_sar} SAR</div>
                      <div style={{ fontSize:'0.7rem', color:MU }}>per {cy.label.toLowerCase()}</div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize:'0.75rem', color:MU, textAlign:'center', marginTop:4 }}>No payment now — we'll contact you to confirm.</p>
              </div>
            )}

            {error && <div style={{ background:'#FEE2E2', color:'#DC2626', padding:'10px 14px', borderRadius:8, fontSize:'0.85rem', marginTop:8 }}>{error}</div>}

            <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
              {step > 1 && (
                <button onClick={() => setStep(s=>s-1)}
                  style={{ padding:'14px 20px', border:'1.5px solid rgba(44,26,14,0.12)', borderRadius:12, background:'white', fontFamily:'inherit', fontSize:'0.95rem', fontWeight:600, color:MU, cursor:'pointer' }}>
                  ← Back
                </button>
              )}
              <button disabled={!canNext()||loading} onClick={() => { if(step<4) setStep(s=>s+1); else submit() }}
                style={{ flex:1, padding:'14px', background:canNext()&&!loading?O:'rgba(200,75,15,0.3)', color:'white', border:'none', borderRadius:12, fontFamily:'inherit', fontSize:'0.95rem', fontWeight:800, cursor:canNext()&&!loading?'pointer':'not-allowed', transition:'background 0.2s', letterSpacing:'0.05em' }}>
                {loading ? 'Submitting...' : step === 4 ? g(content,'popup_btn_submit','SUBMIT') : g(content,'popup_btn_continue','CONTINUE')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
