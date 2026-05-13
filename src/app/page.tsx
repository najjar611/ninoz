'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { blogPosts, faqItems } from './menu/meals-data'

export default function Home() {

  // ── SCROLL REVEAL ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  // ── HERO SLIDESHOW ──
  // To add images: edit this array
  // To change speed: edit 4000 (ms)
  const slides = [
    { emoji: '🥕', bg: 'linear-gradient(145deg,#E8DDD0,#C5D4BF)' },
    { emoji: '🥦', bg: 'linear-gradient(145deg,#C5D4BF,#B5C9B1)' },
    { emoji: '🍠', bg: 'linear-gradient(145deg,#E8D5C0,#D4C4A8)' },
    { emoji: '🥑', bg: 'linear-gradient(145deg,#C8D8C0,#A8C0A0)' },
    // SWAP: { src:'/slideshow/slide-1.jpg', label:'...' }
  ]
  const [slideIndex, setSlideIndex] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [])

  // ── PLAN CARDS ──
  const [activeCard, setActiveCard] = useState(0)
  let touchStartX = 0
  const plans = [
    { stage:'Stage 1', age:'3–6 months', title:'Baby Blends',    desc:'Smooth, silky purées for babies just starting their food journey.', emoji:'🍼', bg:'#FDF6F2', border:'#F0DDD3', imgBg:'#F5EAE3', href:'/menu/stage-1', tag:'Most Popular', tagColor:'#E8834A' },
    { stage:'Stage 2', age:'6–12 months', title:'Textured Meals', desc:'Graduated textures and bolder flavors. Iron, protein, and essential nutrients.', emoji:'🥄', bg:'#F2F7F4', border:'#D4E6DA', imgBg:'#E0EBE0', href:'/menu/stage-2', tag:'Nutritionist Pick', tagColor:'#4A7C59' },
    { stage:'Stage 3', age:'1–3 years',  title:'Big Baby Meals', desc:'Proper toddler meals with real chunks and exciting flavors.', emoji:'🥘', bg:'#F4F2F8', border:'#DDD6EC', imgBg:'#E8E0F0', href:'/menu/stage-3', tag:'New', tagColor:'#7B5EA7' },
  ]

  // ── FAQ ACCORDION ──
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  return (
    <>
      <style>{`
        /* ── REVEAL ── */
        .reveal { opacity:0; transform:translateY(24px); transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .reveal.visible { opacity:1; transform:none; }
        .reveal.delay-1 { transition-delay:0.1s; }
        .reveal.delay-2 { transition-delay:0.2s; }
        .reveal.delay-3 { transition-delay:0.3s; }
        .reveal.delay-4 { transition-delay:0.4s; }

        /* ── BUTTONS ── */
        .btn-primary { background:#E8834A; color:white; border:none; padding:13px 24px; border-radius:50px; font-size:13px; font-weight:600; cursor:pointer; letter-spacing:0.04em; text-transform:uppercase; transition:background 0.2s, transform 0.2s; white-space:nowrap; }
        .btn-primary:hover { background:#D06A32; transform:translateY(-2px); }
        .btn-outline { background:transparent; color:#1C1C1A; border:1.5px solid rgba(28,28,26,0.25); padding:12px 22px; border-radius:50px; font-size:13px; font-weight:500; cursor:pointer; transition:border-color 0.2s, color 0.2s, transform 0.2s; }
        .btn-outline:hover { border-color:#E8834A; color:#E8834A; transform:translateY(-2px); }

        /* ── NAV LINKS ── */
        .nav-link { font-size:14px; color:#7A7068; background:none; border:none; cursor:pointer; font-weight:400; position:relative; padding-bottom:2px; transition:color 0.2s; }
        .nav-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:1px; background:#1C1C1A; transition:width 0.3s cubic-bezier(0.22,1,0.36,1); }
        .nav-link:hover { color:#1C1C1A; }
        .nav-link:hover::after { width:100%; }

        /* ── SLIDESHOW ── */
        .slide { position:absolute; inset:0; transition:opacity 0.8s ease; display:flex; align-items:center; justify-content:center; }
        .slide.active { opacity:1; }
        .slide.hidden { opacity:0; pointer-events:none; }

        /* ── PLAN CARDS ── */
        .plan-card { border-radius:20px; overflow:hidden; transition:transform 0.3s, box-shadow 0.3s; display:block; text-decoration:none; color:inherit; cursor:pointer; }
        .plan-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(0,0,0,0.08); }

        /* ── MARQUEE ── */
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-track { animation:marquee 22s linear infinite; }

        /* ── STEP CARDS ── */
        .step-card { transition:background 0.3s, border-color 0.3s, transform 0.3s; }
        .step-card:hover { background:rgba(232,131,74,0.07)!important; border-color:rgba(232,131,74,0.3)!important; transform:translateY(-4px); }

        /* ── WHY ITEMS ── */
        .why-item { transition:background 0.25s, transform 0.25s; border-radius:14px; padding:16px; }
        .why-item:hover { background:#FFF0EA; transform:translateX(4px); }

        /* ── TESTIMONIAL CARDS ── */
        .testi-card { transition:box-shadow 0.3s, transform 0.3s; }
        .testi-card:hover { box-shadow:0 12px 30px rgba(0,0,0,0.07); transform:translateY(-3px); }

        /* ── BLOG CARDS ── */
        .blog-card { background:white; border-radius:18px; overflow:hidden; transition:transform 0.3s, box-shadow 0.3s; text-decoration:none; color:inherit; display:block; }
        .blog-card:hover { transform:translateY(-4px); box-shadow:0 12px 30px rgba(0,0,0,0.07); }

        /* ── FAQ ── */
        .faq-item { background:white; border-radius:14px; margin-bottom:8px; overflow:hidden; border:1px solid rgba(0,0,0,0.05); }
        .faq-question { width:100%; display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border:none; background:none; cursor:pointer; text-align:left; font-size:15px; font-weight:600; color:#1C1C1A; transition:background 0.2s; gap:12px; }
        .faq-question:hover { background:#FAFAF8; }
        .faq-answer { padding:0 22px; max-height:0; overflow:hidden; transition:max-height 0.4s cubic-bezier(0.22,1,0.36,1), padding 0.3s; }
        .faq-answer.open { max-height:200px; padding:0 22px 18px; }
        .faq-chevron { width:18px; height:18px; flex-shrink:0; transition:transform 0.3s; color:#7A7068; }
        .faq-chevron.open { transform:rotate(180deg); }

        /* ── CONTACT CARDS ── */
        .contact-card { text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; border-radius:20px; padding:28px 22px; border:1.5px solid transparent; transition:transform 0.3s, border-color 0.3s; cursor:pointer; }
        .cc-wa { background:#1A2E22; }
        .cc-wa:hover { border-color:#25D366; transform:translateY(-4px); }
        .cc-ig { background:#2A1A2A; }
        .cc-ig:hover { border-color:#E1306C; transform:translateY(-4px); }

        /* ══════════════════════════════════════
           MOBILE RESPONSIVE
           Fixes all sections for small screens
        ══════════════════════════════════════ */
        @media (max-width: 768px) {
          /* Nav — hide links, shrink button */
          .nav-links-wrap { display:none!important; }
          .nav-cta { padding:10px 16px!important; font-size:12px!important; }

          /* Hero — stack vertically */
          .hero-inner { flex-direction:column!important; gap:28px!important; padding-top:90px!important; padding-bottom:40px!important; }
          .hero-img-wrap { width:100%!important; flex:none!important; height:240px!important; border-radius:20px!important; }
          .hero-text h1 { font-size:36px!important; letter-spacing:-0.5px!important; }
          .hero-text p { font-size:14px!important; }
          .hero-btns { flex-direction:column!important; gap:10px!important; }
          .hero-btns button { width:100%!important; }

          /* Stats — 2x2 grid, smaller font */
          .stats-wrap { flex-wrap:wrap!important; padding:20px 4%!important; }
          .stat-item { width:50%!important; padding:16px 8px!important; border-right:none!important; border-bottom:1px solid rgba(255,255,255,0.06)!important; }
          .stat-num { font-size:22px!important; }
          .stat-label { font-size:11px!important; }

          /* Plans — single column */
          .plans-grid { grid-template-columns:1fr!important; }

          /* How it works — single column */
          .steps-grid { grid-template-columns:1fr!important; }

          /* Why — stack */
          .why-grid { grid-template-columns:1fr!important; gap:32px!important; }
          .why-img { height:260px!important; }
          .why-pill-1 { left:8px!important; bottom:-8px!important; }
          .why-pill-2 { right:8px!important; top:16px!important; }

          /* Testimonials — single column */
          .testi-grid { grid-template-columns:1fr!important; }

          /* Blog — single column */
          .blog-grid { grid-template-columns:1fr!important; }

          /* Contact — single column */
          .contact-grid { grid-template-columns:1fr!important; }

          /* Footer */
          .footer-top { flex-direction:column!important; }
          .footer-cols { gap:28px!important; flex-wrap:wrap!important; }

          /* Section padding — less on mobile */
          .section-pad { padding:60px 5%!important; }
        }

        @media (max-width: 480px) {
          .stat-item { width:100%!important; }
          .hero-text h1 { font-size:30px!important; }
          .stat-num { font-size:20px!important; }
        }
      `}</style>

      <main style={{ background: '#FAF9F6' }}>

        {/* ════════════════════════
            NAVBAR
            To add/remove links: edit the array
        ════════════════════════ */}
        <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(250,249,246,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(28,28,26,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:'64px' }}>
          <div style={{ fontFamily:'var(--font-logo)', fontSize:'26px', color:'#1C1C1A', lineHeight:1 }}>ninoz</div>
          <div className="nav-links-wrap" style={{ display:'flex', gap:'32px' }}>
            {[
              { label:'How It Works', id:'how' },
              { label:'Menu', id:'offers' },
              { label:'Reviews', id:'testimonials' },
              { label:'FAQ', id:'faq' },
            ].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="nav-link">{item.label}</button>
            ))}
          </div>
          {/* CTA — smaller on mobile via .nav-cta */}
          <button className="btn-primary nav-cta" onClick={() => scrollTo('offers')}>
            Start Subscribing
          </button>
        </nav>


        {/* ════════════════════════
            HERO
            Slideshow on right side
            To add images: edit slides array above
        ════════════════════════ */}
        <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', background:'#FAF9F6', padding:'0 6%' }}>
          <div className="hero-inner" style={{ display:'flex', alignItems:'center', gap:'60px', maxWidth:'1200px', width:'100%', margin:'0 auto', paddingTop:'80px', paddingBottom:'60px' }}>

            <div className="hero-text" style={{ flex:1 }}>
              <div className="reveal" style={{ fontSize:'11px', fontWeight:500, color:'#7A7068', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'20px' }}>
                Fresh Daily Baby Meals · Riyadh
              </div>
              <h1 className="reveal delay-1" style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(34px,5vw,62px)', fontWeight:700, lineHeight:1.05, marginBottom:'18px', letterSpacing:'-0.5px' }}>
                <span style={{ color:'#1C1C1A', display:'block' }}>You Care.</span>
                <span style={{ color:'#4A7C59', display:'block' }}>We Prepare.</span>
              </h1>
              <p className="reveal delay-2" style={{ fontFamily:'var(--font-desc)', fontSize:'15px', lineHeight:1.7, color:'#7A7068', maxWidth:'380px', marginBottom:'32px' }}>
                Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.
              </p>
              <div className="hero-btns reveal delay-3" style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'28px' }}>
                <button className="btn-primary" onClick={() => scrollTo('offers')}>Start Subscribing</button>
                <button className="btn-outline" onClick={() => scrollTo('offers')}>See the Menu</button>
              </div>
              <div className="reveal delay-4" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ display:'flex', gap:'2px' }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ color:'#E8834A', fontSize:'16px' }}>★</span>)}
                </div>
                <span style={{ fontSize:'13px', color:'#7A7068' }}>
                  Trusted by <strong style={{ color:'#1C1C1A' }}>200+</strong> Riyadh mothers
                </span>
              </div>
            </div>

            {/* Slideshow
                SWAP emojis with real images — see comment above */}
            <div className="hero-img-wrap reveal delay-2" style={{ flex:'0 0 460px', height:'500px', borderRadius:'28px', overflow:'hidden', position:'relative', boxShadow:'0 24px 60px rgba(28,28,26,0.1)' }}>
              {slides.map((slide, i) => (
                <div key={i} className={`slide ${i === slideIndex ? 'active' : 'hidden'}`} style={{ background: slide.bg, fontSize:'110px' }}>
                  {/* SWAP: <img src={slide.src} alt={slide.label} style={{width:'100%',height:'100%',objectFit:'cover'}} /> */}
                  {slide.emoji}
                </div>
              ))}
              {/* "Our Cooking" badge — change text here */}
              <div style={{ position:'absolute', top:'16px', right:'16px', background:'#E8834A', color:'white', fontSize:'12px', fontWeight:600, padding:'8px 18px', borderRadius:'50px', boxShadow:'0 4px 16px rgba(232,131,74,0.4)', zIndex:2 }}>
                Our Cooking »
              </div>
              {/* Slideshow dots */}
              <div style={{ position:'absolute', bottom:'14px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'5px', zIndex:2 }}>
                {slides.map((_, i) => (
                  <div key={i} onClick={() => setSlideIndex(i)} style={{ width: i === slideIndex ? '18px' : '6px', height:'6px', borderRadius:'3px', background: i === slideIndex ? 'white' : 'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.3s' }} />
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* MARQUEE */}
        <div style={{ background:'#2C2A28', overflow:'hidden', padding:'14px 0' }}>
          <div className="marquee-track" style={{ display:'flex', gap:'50px', width:'max-content' }}>
            {[
              '🥕 100% Organic','🍼 Ages 3mo–3yr','🚚 Daily Delivery',
              '👩‍⚕️ Nutritionist Designed','🏅 Certified Kitchen','⚡ Pause Anytime',
              '🌿 No Preservatives',"❤️ Riyadh's Favourite",
              '🥕 100% Organic','🍼 Ages 3mo–3yr','🚚 Daily Delivery',
              '👩‍⚕️ Nutritionist Designed','🏅 Certified Kitchen','⚡ Pause Anytime',
              '🌿 No Preservatives',"❤️ Riyadh's Favourite",
            ].map((item, i) => (
              <div key={i} style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', whiteSpace:'nowrap' }}>{item}</div>
            ))}
          </div>
        </div>


        {/* STATS BAR
            To change numbers: edit num values
            To change labels: edit label values */}
        <div style={{ background:'#2C2A28', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div className="stats-wrap" style={{ display:'flex', justifyContent:'center', padding:'24px 6%' }}>
            {[
              { num:'200+', label:'Happy Families' },
              { num:'3mo–3yr', label:'Age Range' },
              { num:'100%', label:'Fresh Daily' },
              { num:'0', label:'Preservatives' },
            ].map((stat, i, arr) => (
              <div key={i} className="stat-item reveal" style={{ textAlign:'center', padding:'0 40px', borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div className="stat-num" style={{ fontFamily:'var(--font-hero)', fontSize:'28px', color:'#E8834A', fontWeight:700 }}>{stat.num}</div>
                <div className="stat-label" style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'3px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>


        {/* ════════════════════════
            MEAL PLANS
            Entire card is clickable
            To edit: edit plans array above
        ════════════════════════ */}
        <section id="offers" className="section-pad" style={{ padding:'80px 6%', background:'#FAF9F6' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(74,124,89,0.1)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Our Menu</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>A plan for every little stage</h2>
            <p style={{ fontSize:'15px', color:'#7A7068', marginTop:'10px' }}>Each plan is built around your baby&apos;s exact age and nutritional needs.</p>
          </div>

          <div
            className="plans-grid"
            style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', maxWidth:'1100px', margin:'0 auto' }}
            onTouchStart={e => { touchStartX = e.touches[0].clientX }}
            onTouchEnd={e => {
              const diff = touchStartX - e.changedTouches[0].clientX
              if (diff > 50 && activeCard < 2) setActiveCard(c => c+1)
              if (diff < -50 && activeCard > 0) setActiveCard(c => c-1)
            }}
          >
            {plans.map((plan, i) => (
              <Link key={plan.stage} href={plan.href} className={`plan-card reveal delay-${i+1}`} style={{ background:plan.bg, border:`1px solid ${plan.border}` }}>
                <div style={{ width:'100%', height:'180px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'64px', background:plan.imgBg }}>
                  {/* SWAP: <img src="/plans/stage-X.jpg" style={{width:'100%',height:'100%',objectFit:'cover'}} /> */}
                  {plan.emoji}
                </div>
                <div style={{ padding:'20px 22px 24px' }}>
                  <div style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', color:'#7A7068', marginBottom:'5px' }}>{plan.stage} · {plan.age}</div>
                  <div style={{ fontFamily:'var(--font-hero)', fontSize:'20px', fontWeight:700, marginBottom:'7px', color:'#1C1C1A' }}>{plan.title}</div>
                  <p style={{ fontSize:'13px', color:'#7A7068', lineHeight:1.6, marginBottom:'16px' }}>{plan.desc}</p>
                  <div style={{ marginBottom:'14px' }}>
                    <span style={{ background:`${plan.tagColor}15`, color:plan.tagColor, fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'50px' }}>{plan.tag}</span>
                  </div>
                  <div style={{ display:'inline-block', background:'#1C1C1A', color:'white', fontSize:'12px', fontWeight:600, padding:'9px 20px', borderRadius:'50px' }}>See Plans →</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'24px' }}>
            {plans.map((_, i) => (
              <div key={i} onClick={() => setActiveCard(i)} style={{ width: i === activeCard ? '20px' : '7px', height:'7px', borderRadius:'4px', background: i === activeCard ? '#E8834A' : 'rgba(28,28,26,0.12)', cursor:'pointer', transition:'all 0.3s' }} />
            ))}
          </div>
        </section>


        {/* HOW IT WORKS */}
        <section id="how" className="section-pad" style={{ background:'#2C2A28', padding:'80px 6%', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(232,131,74,0.05)', top:'-100px', right:'-100px', pointerEvents:'none' }} />
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(232,131,74,0.12)', color:'#E8834A', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>How It Works</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', color:'white', fontWeight:700, lineHeight:1.1 }}>3 steps, then we handle it</h2>
          </div>
          <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', maxWidth:'1100px', margin:'0 auto 40px' }}>
            {[
              { num:'01', icon:'📋', title:'Pick Your Plan',  desc:"Choose your baby's stage, note any allergies, and pick weekly or monthly." },
              { num:'02', icon:'✏️', title:'Personalise It', desc:"Our nutritionist builds your full meal plan. Adjust any meal anytime." },
              { num:'03', icon:'🚚', title:'We Deliver',      desc:'Fresh meals every morning. Pause or skip anytime — no commitments.' },
            ].map((step, i) => (
              <div key={step.num} className={`reveal step-card delay-${i+1}`} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'18px', padding:'28px 22px' }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'40px', color:'rgba(255,255,255,0.05)', lineHeight:1, marginBottom:'14px', fontWeight:700 }}>{step.num}</div>
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(232,131,74,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', marginBottom:'16px' }}>{step.icon}</div>
                <div style={{ fontSize:'16px', fontWeight:600, color:'white', marginBottom:'8px' }}>{step.title}</div>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center' }}>
            <button className="btn-primary" onClick={() => scrollTo('offers')}>Start Your Journey →</button>
          </div>
        </section>


        {/* WHY NINOZ */}
        <section id="why" className="section-pad" style={{ padding:'80px 6%', background:'#FAF9F6' }}>
          <div className="why-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center', maxWidth:'1100px', margin:'0 auto' }}>
            <div className="reveal" style={{ position:'relative' }}>
              <div className="why-img" style={{ height:'420px', borderRadius:'24px', overflow:'hidden', background:'linear-gradient(145deg,#E8DDD0,#C5D4BF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'80px' }}>
                {/* SWAP: <img src="/kitchen.jpg" style={{width:'100%',height:'100%',objectFit:'cover'}} /> */}
                🌿
              </div>
              <div className="why-pill-1" style={{ position:'absolute', bottom:'-14px', left:'-14px', background:'white', borderRadius:'16px', padding:'12px 16px', boxShadow:'0 6px 24px rgba(0,0,0,0.07)' }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'22px', color:'#1C1C1A', fontWeight:700 }}>200+</div>
                <div style={{ fontSize:'11px', color:'#7A7068', marginTop:'2px' }}>Families Served</div>
              </div>
              <div className="why-pill-2" style={{ position:'absolute', top:'20px', right:'-14px', background:'white', borderRadius:'16px', padding:'12px 16px', boxShadow:'0 6px 24px rgba(0,0,0,0.07)' }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'22px', color:'#4A7C59', fontWeight:700 }}>0</div>
                <div style={{ fontSize:'11px', color:'#7A7068', marginTop:'2px' }}>Preservatives</div>
              </div>
            </div>
            <div className="reveal delay-1">
              <div style={{ display:'inline-block', background:'rgba(74,124,89,0.1)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Why Ninoz</div>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,36px)', fontWeight:700, lineHeight:1.1, marginBottom:'24px' }}>Food you can trust</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                {[
                  { icon:'🏅', bg:'#FFF0EA', title:'Certified Kitchen',     desc:"Saudi food safety certified. Every meal prepared same morning it's delivered." },
                  { icon:'👩‍⚕️', bg:'#E8F5EE', title:'Nutritionist-Approved', desc:'Every recipe reviewed by a certified pediatric nutritionist.' },
                  { icon:'🌱', bg:'#FEF9EE', title:'100% Organic',           desc:'No preservatives, no artificial anything. Real ingredients, always.' },
                  { icon:'⚡', bg:'#F0ECF9', title:'Made for Working Mums', desc:'We give you 2–3 hours back every single day.' },
                ].map(item => (
                  <div key={item.title} className="why-item" style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'11px', flexShrink:0, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'14px', marginBottom:'3px' }}>{item.title}</div>
                      <div style={{ fontSize:'13px', color:'#7A7068', lineHeight:1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* TESTIMONIALS */}
        <section id="testimonials" className="section-pad" style={{ background:'#EDF2EC', padding:'80px 6%' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(74,124,89,0.12)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Reviews</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>What mums say</h2>
          </div>
          <div className="testi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', maxWidth:'1100px', margin:'0 auto' }}>
            {[
              { av:'سم', name:'Sara Al-Mansouri', bg:'#FFDDD2', tc:'#993D20', delay:'delay-1', text:'"Ninoz has been a lifesaver. As a working mum I used to spend hours prepping. Now my baby eats fresh meals daily."' },
              { av:'نع', name:'Noura Al-Ghamdi',  bg:'#D4EDD9', tc:'#2D6A4F', delay:'delay-2', text:'"I was skeptical — fresh food daily in Riyadh? But it works perfectly. My daughter loves every single meal."' },
              { av:'رب', name:'Reem Al-Bakr',     bg:'#DDEEFF', tc:'#1A5EA8', delay:'delay-3', text:"\"Customizing based on my son's allergies was the biggest win. I can't imagine going back.\"" },
            ].map(t => (
              <div key={t.name} className={`reveal testi-card ${t.delay}`} style={{ background:'white', borderRadius:'18px', padding:'22px 20px', border:'1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ color:'#E8834A', fontSize:'14px', letterSpacing:'2px', marginBottom:'10px' }}>★★★★★</div>
                <p style={{ fontSize:'13px', color:'#7A7068', lineHeight:1.75, marginBottom:'16px', fontStyle:'italic' }}>{t.text}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:t.bg, color:t.tc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:600, flexShrink:0 }}>{t.av}</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600 }}>{t.name}</div>
                    <div style={{ fontSize:'11px', color:'#7A7068' }}>Riyadh</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* BLOG
            To add/edit posts: edit blogPosts in meals-data.ts */}
        <section id="blog" className="section-pad" style={{ padding:'80px 6%', background:'#FAF9F6' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(232,131,74,0.1)', color:'#E8834A', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Our Blog</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>Learn & grow together</h2>
            <p style={{ fontSize:'15px', color:'#7A7068', marginTop:'10px' }}>Tips from nutritionists and fellow mums.</p>
          </div>
          <div className="blog-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', maxWidth:'1100px', margin:'0 auto' }}>
            {blogPosts.map((post, i) => (
              <a key={post.id} href="#" className={`blog-card reveal delay-${i+1}`}>
                <div style={{ height:'160px', background:'linear-gradient(145deg,#F0EBE3,#E0EBE0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px' }}>
                  {/* SWAP: <img src={post.image} style={{width:'100%',height:'100%',objectFit:'cover'}} /> */}
                  {post.emoji}
                </div>
                <div style={{ padding:'18px 20px 22px' }}>
                  <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'#E8834A', marginBottom:'6px' }}>{post.tag}</div>
                  <div style={{ fontFamily:'var(--font-hero)', fontSize:'15px', fontWeight:700, lineHeight:1.3, marginBottom:'8px', color:'#1C1C1A' }}>{post.title}</div>
                  <p style={{ fontSize:'12px', color:'#7A7068', lineHeight:1.65 }}>{post.excerpt}</p>
                </div>
              </a>
            ))}
          </div>
        </section>


        {/* FAQ
            To edit questions: edit faqItems in meals-data.ts */}
        <section id="faq" className="section-pad" style={{ padding:'80px 6%', background:'#EDF2EC' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(74,124,89,0.12)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>FAQ</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>Common questions</h2>
          </div>
          <div className="reveal" style={{ maxWidth:'680px', margin:'0 auto' }}>
            {faqItems.map(item => (
              <div key={item.id} className="faq-item">
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}>
                  <span style={{ fontSize:'14px' }}>{item.question}</span>
                  <svg className={`faq-chevron ${openFaq === item.id ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className={`faq-answer ${openFaq === item.id ? 'open' : ''}`}>
                  <p style={{ fontSize:'13px', color:'#7A7068', lineHeight:1.75 }}>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* CONTACT
            WhatsApp: replace 966XXXXXXXXX
            Instagram: replace ninoz.sa */}
        <section id="contact" className="section-pad" style={{ background:'#2C2A28', padding:'80px 6%' }}>
          <div style={{ maxWidth:'620px', margin:'0 auto', textAlign:'center' }}>
            <div className="reveal">
              <div style={{ display:'inline-block', background:'rgba(232,131,74,0.12)', color:'#E8834A', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Get In Touch</div>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', color:'white', fontWeight:700, lineHeight:1.1, marginBottom:'10px' }}>We&apos;d love to hear from you</h2>
              <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)', marginBottom:'40px' }}>Questions, custom plans, or allergies — reach us directly.</p>
            </div>
            <div className="contact-grid reveal delay-1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <a href="https://wa.me/966XXXXXXXXX" target="_blank" className="contact-card cc-wa">
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(37,211,102,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'white' }}>WhatsApp Us</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Fastest response</div>
                <div style={{ background:'rgba(37,211,102,0.12)', color:'#25D366', fontSize:'11px', fontWeight:600, padding:'4px 12px', borderRadius:'50px' }}>Message us →</div>
              </a>
              <a href="https://instagram.com/ninoz.sa" target="_blank" className="contact-card cc-ig">
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(225,48,108,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="url(#ig2)">
                    <defs><linearGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'white' }}>Follow on Instagram</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Daily content & behind the scenes</div>
                <div style={{ background:'rgba(225,48,108,0.12)', color:'#E1306C', fontSize:'11px', fontWeight:600, padding:'4px 12px', borderRadius:'50px' }}>@ninoz.sa →</div>
              </a>
            </div>
          </div>
        </section>


        {/* FOOTER */}
        <footer style={{ background:'#0E0904', padding:'44px 6% 24px' }}>
          <div className="footer-top" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:'28px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexWrap:'wrap', gap:'28px' }}>
            <div>
              <div style={{ fontFamily:'var(--font-logo)', fontSize:'22px', color:'white', fontWeight:400 }}>ninoz</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', marginTop:'8px', maxWidth:'200px', lineHeight:1.6 }}>
                Fresh organic meals for babies 3 months – 3 years. Delivered daily across Riyadh.
              </div>
            </div>
            <div className="footer-cols" style={{ display:'flex', gap:'48px', flexWrap:'wrap' }}>
              {[
                { title:'Company', links:['Our Story','Our Kitchen','Careers'] },
                { title:'Meals',   links:['Baby Blends','Textured Meals','Big Baby Meals','FAQs'] },
                { title:'Contact', links:['WhatsApp','Instagram','Email'] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.18)', marginBottom:'12px' }}>{col.title}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {col.links.map(link => <a key={link} href="#" style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', textDecoration:'none' }}>{link}</a>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'20px', fontSize:'11px', color:'rgba(255,255,255,0.15)', flexWrap:'wrap', gap:'8px' }}>
            <span>© 2025 Ninoz. All rights reserved.</span>
            <span>Privacy Policy · Terms of Service</span>
          </div>
        </footer>

      </main>
    </>
  )
}
