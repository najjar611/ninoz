'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SubscriptionPopup from '@/components/SubscriptionPopup'

type Stage = { id: string; name: string; age_range: string; description: string; emoji: string; card_bg: string; image_url: string | null; tag: string | null; tag_color: string; is_clickable: boolean }
type Meal = { id: string; name: string; description: string; meal_type: string; image_url: string | null; allergens: string; weight_g: string; protein_g: string; carbs_g: string; fiber_g: string }
type HowStep = { id: string; icon_url: string | null; icon_bg: string; description: string; icon: string }
type WhyPoint = { id: string; title: string; description: string; title_color: string }
type Ingredient = { id: string; name: string; description: string; image_url: string | null }
type FooterLink = { id: string; label: string; url: string }
type Logo = { url: string | null; alt_text: string }
type PaymentCycle = { id: string; label: string; days: number; meals_total: number; price_sar: number }
type Faq = { id: string; question: string; answer: string }
type TickerItem = { id: string; text: string; highlight: string }

type Props = {
  stages: Stage[]; meals: Meal[]; content: Record<string, string>
  howSteps: HowStep[]; whyPoints: WhyPoint[]; ingredients: Ingredient[]
  footerLinks: FooterLink[]; logo: Logo | null; paymentCycles: PaymentCycle[]
  faqs: Faq[]; tickerItems: TickerItem[]
}

const cv = (c: Record<string, string>, k: string, fb = '') => c[k] || fb

export default function HomeClient({ stages, meals, content, howSteps, whyPoints, ingredients, footerLinks, logo, paymentCycles, faqs, tickerItems }: Props) {
  const [showPopup, setShowPopup] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('breakfast')
  const [mealIdx, setMealIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [subEmail, setSubEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const stageTX = useRef<number | null>(null)
  const mealTX = useRef<number | null>(null)
  const mealTY = useRef<number | null>(null)

  const font = cv(content, 'site_font', 'Nunito')
  const tickerAnimated = cv(content, 'ticker_animated', 'false') === 'true'
  const heroImg = cv(content, 'hero_image_url', '')
  const whyImg = cv(content, 'why_image_url', '')

  useEffect(() => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap`
    document.head.appendChild(l)
    document.documentElement.style.setProperty('--nf', `'${font}',sans-serif`)
  }, [font])

  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('nv') }), { threshold: 0.08 })
    document.querySelectorAll('.nr').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => { setMealIdx(0) }, [activeTab])

  const filtered = meals.filter(m => m.meal_type === activeTab)
  const total = filtered.length
  const get = (off: number) => total === 0 ? null : filtered[((mealIdx + off) % total + total) % total]
  const prevMealItem = get(-1)
  const currMealItem = get(0)
  const nextMealItem = get(1)

  function goNext() { if (total > 1) setMealIdx(i => (i + 1) % total) }
  function goPrev() { if (total > 1) setMealIdx(i => (i - 1 + total) % total) }

  function stageStart(e: React.TouchEvent) { stageTX.current = e.touches[0].clientX }
  function stageEnd(e: React.TouchEvent) {
    if (!stageTX.current) return
    const dx = stageTX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 40) dx > 0 ? setStageIdx(i => (i + 1) % stages.length) : setStageIdx(i => (i - 1 + stages.length) % stages.length)
    stageTX.current = null
  }

  function mealStart(e: React.TouchEvent) { mealTX.current = e.touches[0].clientX; mealTY.current = e.touches[0].clientY }
  function mealEnd(e: React.TouchEvent) {
    if (!mealTX.current) return
    const dx = mealTX.current - e.changedTouches[0].clientX
    const dy = Math.abs((mealTY.current || 0) - e.changedTouches[0].clientY)
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) dx > 0 ? goNext() : goPrev()
    mealTX.current = null
  }

  const tItems = tickerItems.length > 0 ? tickerItems : [
    { id: '1', text: 'Fresh Ingredients', highlight: '100%' },
    { id: '2', text: 'Sugar Added', highlight: '0%' },
    { id: '3', text: 'Preservatives', highlight: '0%' },
    { id: '4', text: 'Frozen Food', highlight: '0%' },
  ]

  const S = (styles: React.CSSProperties) => styles

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${font.replace(/ /g,'+')}:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:var(--nf,'${font}',sans-serif);overflow-x:hidden;background:#fff}
        :root{--or:#C84B0F;--orh:#A33A0A;--orp:#FDF0E8;--cr:#FAF5EE;--cr2:#F0E8D8;--br:#2C1A0E;--mu:#8A7A6E;--bd:rgba(44,26,14,0.08);--nf:'${font}',sans-serif}
        .nr{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}
        .nr.nv{opacity:1;transform:none}
        .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
        .btn{background:var(--or);color:#fff;border:none;padding:11px 24px;border-radius:50px;font-family:var(--nf);font-size:14px;font-weight:700;cursor:pointer;transition:background .2s,transform .15s;display:inline-flex;align-items:center;text-decoration:none;white-space:nowrap}
        .btn:hover{background:var(--orh);transform:translateY(-1px)}
        .btng{background:transparent;color:var(--br);border:1.5px solid rgba(44,26,14,.15);padding:11px 24px;border-radius:50px;font-family:var(--nf);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center}
        .btng:hover{border-color:var(--or);color:var(--or)}
        .dot{width:7px;height:7px;border-radius:50%;background:rgba(44,26,14,.15);transition:all .3s;cursor:pointer;border:none;padding:0}
        .dot.a{background:var(--or);width:20px;border-radius:4px}
        .mdot{width:6px;height:6px;border-radius:50%;background:rgba(44,26,14,.12);transition:all .3s;border:none;padding:0;cursor:pointer}
        .mdot.a{background:var(--or);width:18px;border-radius:3px}
        ${tickerAnimated ? '@keyframes ntick{from{transform:translateX(0)}to{transform:translateX(-50%)}}' : ''}
        @media(max-width:768px){
          .hide-mobile{display:none!important}
          .stack-mobile{flex-direction:column!important}
          .full-mobile{grid-template-columns:1fr!important}
          .font-sm-mobile{font-size:36px!important;letter-spacing:-1px!important}
        }
        @media(max-width:1024px){
          .hide-tablet{display:none!important}
          .full-tablet{grid-template-columns:1fr!important}
          .col2-tablet{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, background:'rgba(255,255,255,.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:66 }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
          {logo?.url ? <img src={logo.url} alt={logo.alt_text||'Ninoz'} style={{ height:34, objectFit:'contain' }} /> : <span style={{ fontSize:26, fontWeight:900, color:'var(--or)', lineHeight:1 }}>Ninoz</span>}
        </Link>
        <div className="hide-mobile" style={{ display:'flex', gap:28, alignItems:'center' }}>
          {[['How It Works','how'],['Menu','menu'],['Plans','stages'],['FAQ','faq']].map(([l,id]) => (
            <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })}
              style={{ fontSize:14, fontWeight:600, color:'var(--br)', opacity:.5, background:'none', border:'none', cursor:'pointer', transition:'opacity .2s', fontFamily:'var(--nf)' }}
              onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='.5')}>
              {l}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => setShowPopup(true)}>{cv(content,'nav_cta_text','Start Your Plan')}</button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'80px 5% 60px', background:'#fff' }} id="hero">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center', maxWidth:1200, width:'100%', margin:'0 auto' }} className="full-mobile">
          <div>
            <div className="nr" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--orp)', color:'var(--or)', fontSize:11, fontWeight:700, padding:'6px 16px', borderRadius:50, marginBottom:24, letterSpacing:'.08em', textTransform:'uppercase' }}>
              🌿 {cv(content,'hero_badge','Fresh · Organic · Daily Delivery in Riyadh')}
            </div>
            <h1 className="nr d1" style={{ fontSize:'clamp(44px,5.5vw,72px)', fontWeight:900, color:'var(--br)', lineHeight:1.06, letterSpacing:-2, marginBottom:20 }}>
              {cv(content,'hero_headline_1','You Care.')}<br />
              <span style={{ color:'var(--or)' }}>{cv(content,'hero_headline_2','We Prepare.')}</span>
            </h1>
            <p className="nr d1" style={{ fontSize:17, color:'var(--mu)', lineHeight:1.75, maxWidth:440, marginBottom:24, fontWeight:500 }}>
              {cv(content,'hero_description','Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.')}
            </p>
            <div className="nr d2" style={{ display:'flex', gap:18, flexWrap:'wrap', marginBottom:28 }}>
              {['Fresh Ingredients','No Preservatives','Cooked Daily','Pediatrician Approved'].map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--mu)', fontWeight:600 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--or)', flexShrink:0 }}/>
                  {t}
                </div>
              ))}
            </div>
            <div className="nr d2 stack-mobile" style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
              <button className="btn" onClick={() => setShowPopup(true)}>{cv(content,'hero_btn_primary','Start Your Plan')}</button>
              <button className="btng" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior:'smooth' })}>{cv(content,'hero_btn_secondary','Explore Meals')}</button>
            </div>
            <div className="nr d3" style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex' }}>
                {['#FFB347','#E8834A','#C84B0F','#7A7068','#2C1A0E'].map((c,i) => (
                  <div key={i} style={{ width:28, height:28, borderRadius:'50%', border:'2px solid #fff', marginLeft:i>0?-8:0, background:c }} />
                ))}
              </div>
              <span style={{ fontSize:13, color:'var(--mu)', fontWeight:600 }}>{cv(content,'hero_social_proof','Trusted by 200+ Riyadh mothers')}</span>
            </div>
          </div>
          <div className="nr d1" style={{ width:'100%', aspectRatio:'3/4', borderRadius:28, overflow:'hidden', background:'var(--cr)', position:'relative' }}>
            {heroImg ? <img src={heroImg} alt="Ninoz" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(145deg,#F5EAD8,#EDD8B8)', fontSize:100 }}>👶</div>}
            <div className="hide-mobile" style={{ position:'absolute', bottom:28, left:-24, background:'#fff', borderRadius:14, padding:'11px 16px', boxShadow:'0 8px 28px rgba(0,0,0,.09)', border:'1px solid rgba(0,0,0,.05)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:2 }}>Daily Fresh</div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--br)' }}>Cooked Every Morning</div>
            </div>
            <div className="hide-mobile" style={{ position:'absolute', top:28, right:-24, background:'#fff', borderRadius:14, padding:'11px 16px', boxShadow:'0 8px 28px rgba(0,0,0,.09)', border:'1px solid rgba(0,0,0,.05)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:2 }}>Nutritionist</div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--br)' }}>Approved ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ background:'var(--or)', padding:'13px 0', overflow:'hidden' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', ...(tickerAnimated ? { animation:'ntick 28s linear infinite' } : {}) }}>
          {(tickerAnimated ? [0,1] : [0]).map(r =>
            tItems.map((item,i) => (
              <span key={`${r}-${i}`} style={{ fontSize:13, fontWeight:700, color:'#fff', padding:'0 36px' }}>
                <span style={{ color:'rgba(255,255,255,.6)', marginRight:4 }}>{item.highlight}</span>{item.text} ·{' '}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── STAGES ── */}
      <section style={{ background:'var(--cr)', padding:'88px 5% 72px', overflow:'hidden' }} id="stages">
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="nr" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:48, gap:20, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--or)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>Our Plans</div>
              <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:900, color:'var(--br)', lineHeight:1.15 }}>
                {cv(content,'stages_title','Fresh Meals Built for').replace(cv(content,'stages_title_highlight','Their Stage'),'').trim()}{' '}
                <span style={{ color:'var(--or)' }}>{cv(content,'stages_title_highlight','Their Stage')}</span>
              </h2>
            </div>
            <button className="btn" onClick={() => setShowPopup(true)}>{cv(content,'stages_cta','Start Your Plan')}</button>
          </div>
          <div className="nr" style={{ position:'relative', overflow:'hidden', touchAction:'pan-y' }} onTouchStart={stageStart} onTouchEnd={stageEnd}>
            <div style={{ display:'flex', transition:'transform .45s cubic-bezier(.25,.46,.45,.94)', willChange:'transform', transform:`translateX(calc(-${stageIdx * 344}px))` }}>
              {stages.map((s, idx) => (
                <div key={s.id} style={{ minWidth:320, marginRight:24, borderRadius:24, overflow:'hidden', flexShrink:0, background:s.card_bg||'#F5EDE0', cursor:idx!==stageIdx?'pointer':'default', transition:'box-shadow .3s', boxShadow:idx===stageIdx?'0 20px 60px rgba(200,75,15,.18)':'none' }}
                  onClick={() => idx!==stageIdx && setStageIdx(idx)}>
                  <div style={{ width:'100%', height:260, display:'flex', alignItems:'center', justifyContent:'center', fontSize:72, position:'relative', overflow:'hidden', background:s.card_bg||'#F5EDE0' }}>
                    {s.image_url ? <img src={s.image_url} alt={s.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /> : <span style={{ fontSize:80 }}>{s.emoji}</span>}
                    {s.tag && <div style={{ position:'absolute', top:14, right:14, background:s.tag_color||'var(--or)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50 }}>{s.tag}</div>}
                  </div>
                  <div style={{ padding:24 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:'var(--br)', marginBottom:4 }}>{s.name}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--or)', marginBottom:10 }}>{s.age_range}</div>
                    <div style={{ fontSize:13, color:'var(--mu)', lineHeight:1.65, fontWeight:500 }}>{s.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:14, marginTop:32 }}>
            <button onClick={() => setStageIdx(i => (i-1+stages.length)%stages.length)}
              style={{ width:42, height:42, borderRadius:'50%', border:'1.5px solid rgba(44,26,14,.12)', background:'#fff', color:'var(--br)', fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--or)';(e.currentTarget as HTMLElement).style.color='#fff'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';(e.currentTarget as HTMLElement).style.color='var(--br)'}}>←</button>
            <div style={{ display:'flex', gap:6 }}>
              {stages.map((_,i) => <button key={i} className={`dot ${i===stageIdx?'a':''}`} onClick={() => setStageIdx(i)} />)}
            </div>
            <button onClick={() => setStageIdx(i => (i+1)%stages.length)}
              style={{ width:42, height:42, borderRadius:'50%', border:'1.5px solid rgba(44,26,14,.12)', background:'#fff', color:'var(--br)', fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--or)';(e.currentTarget as HTMLElement).style.color='#fff'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';(e.currentTarget as HTMLElement).style.color='var(--br)'}}>→</button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background:'#fff', padding:'88px 5%' }} id="how">
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="nr" style={{ textAlign:'center', marginBottom:60 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--mu)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>Process</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:900, color:'var(--br)', marginBottom:10 }}>{cv(content,'how_title','How Ninoz Works')}</h2>
            <p style={{ fontSize:16, color:'var(--mu)', fontWeight:500 }}>{cv(content,'how_subtitle','Three steps to peace of mind — and a well-fed baby.')}</p>
          </div>
          <div className="nr d1" style={{ display:'flex', alignItems:'flex-start' }}>
            {howSteps.map((step,i) => (
              <>
                <div key={step.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'0 16px' }}>
                  <div style={{ width:136, height:136, borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, fontSize:44, overflow:'hidden', flexShrink:0, background:step.icon_bg||(i===0?'#FAF5EE':i===1?'#FDF0E8':'#C84B0F') }}>
                    {step.icon_url ? <img src={step.icon_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:24 }} /> : <span>{i===0?'📋':i===1?'👨‍🍳':'🚚'}</span>}
                  </div>
                  <p style={{ fontSize:14, color:'var(--mu)', lineHeight:1.7, fontWeight:500, maxWidth:190 }}>{step.description}</p>
                </div>
                {i < howSteps.length-1 && (
                  <div key={`c${i}`} style={{ flexShrink:0, width:48, paddingTop:68, display:'flex', alignItems:'center' }}>
                    <div style={{ width:'100%', height:1.5, background:'repeating-linear-gradient(to right,rgba(200,75,15,.25) 0,rgba(200,75,15,.25) 5px,transparent 5px,transparent 11px)' }}/>
                  </div>
                )}
              </>
            ))}
          </div>
          <div className="nr d2" style={{ textAlign:'center', marginTop:52 }}>
            <button className="btn" style={{ padding:'14px 48px', fontSize:15 }} onClick={() => setShowPopup(true)}>{cv(content,'how_cta','Get Started')}</button>
          </div>
        </div>
      </section>

      {/* ── MENU ── */}
      <section id="menu">
        <div style={{ display:'flex', background:'var(--cr)', minHeight:680 }}>
          {/* Left orange panel */}
          <div style={{ width:340, minWidth:300, background:'var(--or)', display:'flex', flexDirection:'column', padding:32, position:'relative', overflow:'hidden' }}>
            <div style={{ content:'', position:'absolute', width:560, height:560, borderRadius:'50%', background:'rgba(0,0,0,.07)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:36, position:'relative', zIndex:1 }}>
              <Link href="/" style={{ fontSize:20, fontWeight:900, color:'#fff', textDecoration:'none' }}>Ninoz</Link>
              <button className="btn" style={{ fontSize:12, padding:'9px 16px' }} onClick={() => setShowPopup(true)}>{cv(content,'menu_cta','Start your plan')}</button>
            </div>
            <div style={{ position:'relative', zIndex:1, flex:1 }}>
              <h2 style={{ fontSize:38, fontWeight:900, color:'#fff', lineHeight:1.2 }}>
                {[cv(content,'menu_headline_1','Real Food'),cv(content,'menu_headline_2','Real Ingredients'),cv(content,'menu_headline_3','Every Single Day')].map((l,i) => (
                  <span key={i} style={{ display:'block' }}>{l}</span>
                ))}
              </h2>
            </div>
            <div style={{ display:'flex', gap:8, position:'relative', zIndex:1, marginTop:'auto', paddingTop:20 }}>
              {(['breakfast','lunch','dinner'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex:1, padding:'12px 6px', borderRadius:12, border:`1.5px solid ${activeTab===tab?'#fff':'rgba(255,255,255,.3)'}`, background:activeTab===tab?'#fff':'transparent', color:activeTab===tab?'var(--or)':'rgba(255,255,255,.65)', fontFamily:'var(--nf)', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .2s', textAlign:'center' }}>
                  {cv(content,`menu_tab_${tab}`,tab.charAt(0).toUpperCase()+tab.slice(1))}
                </button>
              ))}
            </div>
          </div>

          {/* Right — peeking meal carousel */}
          <div style={{ flex:1, background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 0', overflow:'hidden', position:'relative', minHeight:680 }}
            onTouchStart={mealStart} onTouchEnd={mealEnd}>
            {/* Cream circle bg */}
            <div style={{ position:'absolute', width:440, height:440, borderRadius:'50%', background:'var(--cr)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:0 }}/>

            {total === 0 ? (
              <div style={{ textAlign:'center', color:'var(--mu)', position:'relative', zIndex:1, padding:'40px 20px' }}>
                <div style={{ fontSize:56, marginBottom:12 }}>🍽️</div>
                <p style={{ fontWeight:600 }}>No meals yet.</p>
                <p style={{ fontSize:13, marginTop:4 }}>Add meals from the admin portal.</p>
              </div>
            ) : (
              <>
                {/* Counter */}
                <div style={{ fontSize:12, fontWeight:700, color:'var(--mu)', letterSpacing:'.06em', marginBottom:16, position:'relative', zIndex:1 }}>
                  {mealIdx+1} / {total} meals
                </div>

                {/* PEEKING CAROUSEL */}
                <div style={{ position:'relative', width:'100%', height:260, zIndex:1, userSelect:'none', touchAction:'pan-y' }}>
                  {/* PREV — peeks from left */}
                  {prevMealItem && total > 1 && (
                    <div onClick={goPrev}
                      style={{ position:'absolute', top:'50%', left:0, transform:'translateY(-50%) scale(.75)', opacity:.45, zIndex:2, cursor:'pointer', transition:'all .4s cubic-bezier(.25,.46,.45,.94)', filter:'blur(.5px)' }}>
                      <div style={{ width:180, height:180, borderRadius:'50%', overflow:'hidden', background:'var(--cr2)', display:'flex', alignItems:'center', justifyContent:'center', border:'5px solid #fff', boxShadow:'0 10px 36px rgba(200,75,15,.08)', fontSize:56 }}>
                        {prevMealItem.image_url ? <img src={prevMealItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /> : <span>🍽️</span>}
                      </div>
                    </div>
                  )}

                  {/* CURRENT — center */}
                  {currMealItem && (
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%) scale(1)', opacity:1, zIndex:3, transition:'all .4s cubic-bezier(.25,.46,.45,.94)' }}>
                      <div style={{ width:240, height:240, borderRadius:'50%', overflow:'hidden', background:'var(--cr2)', display:'flex', alignItems:'center', justifyContent:'center', border:'5px solid #fff', boxShadow:'0 12px 48px rgba(200,75,15,.15)', fontSize:80 }}>
                        {currMealItem.image_url ? <img src={currMealItem.image_url} alt={currMealItem.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /> : <span>🍽️</span>}
                      </div>
                    </div>
                  )}

                  {/* NEXT — peeks from right */}
                  {nextMealItem && total > 1 && (
                    <div onClick={goNext}
                      style={{ position:'absolute', top:'50%', right:0, transform:'translateY(-50%) scale(.75)', opacity:.45, zIndex:2, cursor:'pointer', transition:'all .4s cubic-bezier(.25,.46,.45,.94)', filter:'blur(.5px)' }}>
                      <div style={{ width:180, height:180, borderRadius:'50%', overflow:'hidden', background:'var(--cr2)', display:'flex', alignItems:'center', justifyContent:'center', border:'5px solid #fff', boxShadow:'0 10px 36px rgba(200,75,15,.08)', fontSize:56 }}>
                        {nextMealItem.image_url ? <img src={nextMealItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /> : <span>🍽️</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Meal info */}
                {currMealItem && (
                  <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400, textAlign:'center', padding:'16px 20px 0' }}>
                    <div style={{ fontSize:20, fontWeight:900, color:'var(--or)', marginBottom:8 }}>{currMealItem.name}</div>
                    <div style={{ fontSize:13, color:'var(--mu)', lineHeight:1.65, fontWeight:500, marginBottom:16 }}>{currMealItem.description}</div>
                    {(currMealItem.weight_g||currMealItem.protein_g) && (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
                        {[{v:currMealItem.weight_g,l:'Weight'},{v:currMealItem.protein_g,l:'Protein'},{v:currMealItem.carbs_g,l:'Carbs'},{v:currMealItem.fiber_g,l:'Fiber'}]
                          .filter(n=>n.v).map(n=>(
                          <div key={n.l} style={{ background:'var(--or)', borderRadius:10, padding:'12px 6px', textAlign:'center' }}>
                            <span style={{ fontSize:17, fontWeight:900, color:'#fff', display:'block', lineHeight:1, marginBottom:3 }}>{n.v}</span>
                            <span style={{ fontSize:9, color:'rgba(255,255,255,.85)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700 }}>{n.l}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {currMealItem.allergens && (
                      <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#FDF5E8', borderRadius:8, padding:'8px 14px', border:'1px solid #F0DEC8', fontSize:12, color:'var(--br)', fontWeight:600, marginBottom:12 }}>
                        ⚠️ Allergen: <strong style={{ marginLeft:4 }}>{currMealItem.allergens}</strong>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:5, justifyContent:'center', marginTop:8 }}>
                      {filtered.slice(0,8).map((_,i) => (
                        <button key={i} className={`mdot ${i===mealIdx?'a':''}`} onClick={() => setMealIdx(i)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── WHY / INGREDIENTS ── */}
      <section style={{ background:'var(--cr)', padding:'88px 5%' }} id="ingredients">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center', maxWidth:1200, margin:'0 auto' }} className="full-tablet">
          <div className="nr">
            <h2 style={{ fontSize:'clamp(44px,6vw,76px)', fontWeight:900, lineHeight:1.05, marginBottom:28, color:'var(--br)' }}>
              Only <span style={{ color:'var(--or)' }}>Real</span><br/>Ingredients
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:32 }}>
              {whyPoints.map(p => (
                <div key={p.id}>
                  <div style={{ fontSize:15, fontWeight:800, marginBottom:3, color:p.title_color||'var(--or)' }}>{p.title}</div>
                  <div style={{ fontSize:13, color:'var(--mu)', lineHeight:1.6, fontWeight:500 }}>{p.description}</div>
                </div>
              ))}
            </div>
            {ingredients.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {ingredients.slice(0,4).map(ing => (
                  <div key={ing.id} style={{ borderRadius:14, overflow:'hidden', background:'#fff', boxShadow:'0 2px 10px rgba(0,0,0,.04)' }}>
                    <div style={{ width:'100%', height:80, background:'var(--cr2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                      {ing.image_url ? <img src={ing.image_url} alt={ing.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /> : <span>🥕</span>}
                    </div>
                    <div style={{ fontSize:12, fontWeight:800, color:'var(--br)', padding:'7px 10px 2px' }}>{ing.name}</div>
                    <div style={{ fontSize:10, color:'var(--mu)', padding:'0 10px 8px', lineHeight:1.4 }}>{ing.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="nr d2">
            <div style={{ width:'100%', aspectRatio:'3/4', borderRadius:28, overflow:'hidden', background:'var(--cr2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:80 }}>
              {whyImg ? <img src={whyImg} alt="Why Ninoz" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /> : <span>👶</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
        <section style={{ background:'#fff', padding:'88px 5%' }} id="faq">
          <div style={{ maxWidth:700, margin:'0 auto' }}>
            <div className="nr" style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--or)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>FAQ</div>
              <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:900, color:'var(--br)', lineHeight:1.15 }}>{cv(content,'faq_title','Common Questions')}</h2>
              <p style={{ fontSize:15, color:'var(--mu)', marginTop:10, fontWeight:500 }}>{cv(content,'faq_subtitle','Everything you need to know about Ninoz.')}</p>
            </div>
            <div className="nr d1">
              {faqs.map(faq => (
                <div key={faq.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                  <button onClick={() => setOpenFaq(openFaq===faq.id?null:faq.id)}
                    style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--nf)', fontSize:15, fontWeight:700, color:'var(--br)', textAlign:'left', gap:16 }}>
                    <span>{faq.question}</span>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:openFaq===faq.id?'var(--or)':'var(--orp)', color:openFaq===faq.id?'#fff':'var(--or)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0, transition:'transform .3s,background .2s', transform:openFaq===faq.id?'rotate(45deg)':'none', fontWeight:300, lineHeight:1 }}>+</div>
                  </button>
                  <div style={{ maxHeight:openFaq===faq.id?300:0, overflow:'hidden', transition:'max-height .35s ease,padding .25s', ...(openFaq===faq.id?{paddingBottom:18}:{}) }}>
                    <p style={{ fontSize:14, color:'var(--mu)', lineHeight:1.75, fontWeight:500 }}>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer>
        <div style={{ background:'var(--or)', padding:'60px 5%', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            {[{t:'10%',l:'4%',e:'🪆'},{t:'60%',l:'2%',e:'🚲'},{t:'15%',l:'18%',e:'🧸'},{t:'10%',r:'18%',e:'🏀'},{t:'65%',r:'15%',e:'🪀'},{t:'12%',r:'4%',e:'🚂'}].map((x,i)=>(
              <span key={i} style={{ position:'absolute', fontSize:52, opacity:.1, userSelect:'none', top:x.t, left:(x as any).l, right:(x as any).r }}>{x.e}</span>
            ))}
          </div>
          <div style={{ fontSize:'clamp(64px,12vw,120px)', fontWeight:900, color:'rgba(255,255,255,.18)', lineHeight:1, position:'relative', zIndex:1, letterSpacing:-3 }}>Ninoz</div>
        </div>
        <div style={{ background:'var(--cr)', padding:'56px 5% 40px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:40, borderTop:'1px solid rgba(44,26,14,.07)' }} className="col2-tablet full-mobile">
          <div>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--or)', marginBottom:16, display:'block', textTransform:'uppercase', letterSpacing:'.08em' }}>{cv(content,'footer_about_title','About Ninoz')}</span>
            <div style={{ fontSize:13, color:'var(--mu)', lineHeight:1.75 }}>
              <strong style={{ color:'var(--br)', display:'block', marginBottom:4, fontWeight:700 }}>Hi. We're Ninoz.</strong>
              {cv(content,'footer_about_text','We cook fresh daily meals for babies and toddlers in Riyadh.')}
            </div>
            <ul style={{ listStyle:'none', margin:'10px 0 14px' }}>
              {["Cooked the morning of delivery","Designed for your baby's stage","Approved by a pediatric nutritionist","Free from salt, sugar and preservatives"].map(b=>(
                <li key={b} style={{ fontSize:13, color:'var(--mu)', padding:'3px 0', display:'flex', gap:8, lineHeight:1.4 }}>
                  <span style={{ color:'var(--or)', flexShrink:0 }}>–</span>{b}
                </li>
              ))}
            </ul>
            <div style={{ fontSize:13, color:'var(--mu)', lineHeight:1.75, fontStyle:'italic' }}>{cv(content,'footer_about_closing',"You handle the love. We handle the food.")}</div>
          </div>
          <div>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--or)', marginBottom:16, display:'block', textTransform:'uppercase', letterSpacing:'.08em' }}>{cv(content,'footer_links_title','Useful Links')}</span>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {footerLinks.map(l=><a key={l.id} href={l.url} style={{ fontSize:13, color:'var(--mu)', textDecoration:'none', fontWeight:500 }}>{l.label}</a>)}
            </div>
          </div>
          <div>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--or)', marginBottom:16, display:'block', textTransform:'uppercase', letterSpacing:'.08em' }}>{cv(content,'footer_contact_title','Get in Touch')}</span>
            {[
              { icon:'☺️', text: cv(content,'footer_contact_tagline',"We'd love to hear from you"), href: null },
              cv(content,'footer_contact_whatsapp') ? { icon:'📱', text:'WhatsApp Us', href:`https://wa.me/${cv(content,'footer_contact_whatsapp')}` } : null,
              { icon:'📧', text: cv(content,'footer_contact_email','hello@ninoz.sa'), href:`mailto:${cv(content,'footer_contact_email','hello@ninoz.sa')}` },
            ].filter(Boolean).map((item: any, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:'rgba(200,75,15,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{item.icon}</div>
                <div style={{ fontSize:13, color:'var(--mu)', lineHeight:1.5 }}>
                  {item.href ? <a href={item.href} style={{ color:'var(--or)', textDecoration:'none', fontWeight:600 }}>{item.text}</a> : item.text}
                </div>
              </div>
            ))}
          </div>
          <div>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--or)', marginBottom:16, display:'block', textTransform:'uppercase', letterSpacing:'.08em' }}>{cv(content,'footer_subscribe_title','Subscribe Now')}</span>
            <p style={{ fontSize:13, color:'var(--mu)', lineHeight:1.75, marginBottom:14 }}>Enter your email to start your plan.</p>
            {subscribed ? (
              <div style={{ background:'#E8F5EE', color:'#2D6A4F', padding:'12px 16px', borderRadius:10, fontSize:13, fontWeight:600 }}>✓ You're on the list!</div>
            ) : (
              <>
                <input type="email" placeholder="your@email.com" value={subEmail} onChange={e=>setSubEmail(e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(44,26,14,.1)', borderRadius:10, fontSize:13, fontFamily:'var(--nf)', color:'var(--br)', outline:'none', boxSizing:'border-box', marginBottom:8, background:'#fff' }} />
                <button className="btn" style={{ width:'100%', borderRadius:10, justifyContent:'center' }} onClick={() => { if(subEmail.includes('@')){ setSubscribed(true); setShowPopup(true) } }}>
                  Start Your Plan →
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ background:'var(--br)', padding:'16px 5%', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.3)' }}>{cv(content,'footer_copyright','© 2025 Ninoz. All rights reserved.')}</span>
          <div style={{ display:'flex', gap:20 }}>
            {['Terms','Privacy','Allergens'].map(l=><a key={l} href="#" style={{ fontSize:12, color:'rgba(255,255,255,.25)', textDecoration:'none' }}>{l}</a>)}
          </div>
        </div>
      </footer>

      {showPopup && <SubscriptionPopup stages={stages} paymentCycles={paymentCycles} content={content} onClose={() => setShowPopup(false)} />}
    </>
  )
}
