'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Stage = { id: string; name: string; age_range: string; description: string; image_url: string | null; emoji: string; tag: string | null; tag_color: string; card_bg: string; card_border: string }
type HowStep = { id: string; number: string; icon: string; title: string; description: string }
type WhyPoint = { id: string; icon: string; icon_bg: string; title: string; description: string }
type FaqItem = { id: string; question: string; answer: string }
type Testimonial = { id: string; name: string; location: string; review: string; avatar_text: string; avatar_bg: string; avatar_color: string; rating: number }
type BlogPost = { id: string; tag: string; title: string; excerpt: string; image_url: string | null }
type Logo = { url: string | null; alt_text: string }
type SlideshowImage = { name: string; url: string }

type Props = {
  content: Record<string, string>
  stages: Stage[]
  howSteps: HowStep[]
  whyPoints: WhyPoint[]
  faqItems: FaqItem[]
  testimonials: Testimonial[]
  blogPosts: BlogPost[]
  settings: Record<string, string>
  logo: Logo | null
  slideshowImages: SlideshowImage[]
}

function c(content: Record<string, string>, key: string, fallback = '') {
  return content[key] || fallback
}

export default function HomeClient({ content, stages, howSteps, whyPoints, faqItems, testimonials, blogPosts, settings, logo, slideshowImages }: Props) {

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  // ── SLIDESHOW ──
  // Uses real images from Supabase if uploaded
  // Falls back to emoji placeholders if no images uploaded yet
  const fallbackSlides = [
    { emoji: '🥕', bg: 'linear-gradient(145deg,#E8DDD0,#C5D4BF)' },
    { emoji: '🥦', bg: 'linear-gradient(145deg,#C5D4BF,#B5C9B1)' },
    { emoji: '🍠', bg: 'linear-gradient(145deg,#E8D5C0,#D4C4A8)' },
    { emoji: '🥑', bg: 'linear-gradient(145deg,#C8D8C0,#A8C0A0)' },
  ]
  const hasRealSlides = slideshowImages.length > 0
  const totalSlides = hasRealSlides ? slideshowImages.length : fallbackSlides.length

  const [slideIndex, setSlideIndex] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % totalSlides), 4000)
    return () => clearInterval(t)
  }, [totalSlides])

  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState(0)
  let touchStartX = 0

  return (
    <>
      <style>{`
        .reveal { opacity:0; transform:translateY(28px); transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .reveal.visible { opacity:1; transform:none; }
        .reveal.delay-1 { transition-delay:0.1s; }
        .reveal.delay-2 { transition-delay:0.2s; }
        .reveal.delay-3 { transition-delay:0.3s; }
        .reveal.delay-4 { transition-delay:0.4s; }
        .btn-primary { background:#E8834A; color:white; border:none; padding:13px 24px; border-radius:50px; font-size:13px; font-weight:600; cursor:pointer; letter-spacing:0.04em; text-transform:uppercase; transition:background 0.2s, transform 0.2s; white-space:nowrap; }
        .btn-primary:hover { background:#D06A32; transform:translateY(-2px); }
        .btn-outline { background:transparent; color:#1C1C1A; border:1.5px solid rgba(28,28,26,0.25); padding:12px 22px; border-radius:50px; font-size:13px; font-weight:500; cursor:pointer; transition:border-color 0.2s, color 0.2s, transform 0.2s; }
        .btn-outline:hover { border-color:#E8834A; color:#E8834A; transform:translateY(-2px); }
        .nav-link { font-size:14px; color:#7A7068; background:none; border:none; cursor:pointer; font-weight:400; position:relative; padding-bottom:2px; transition:color 0.2s; }
        .nav-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:1px; background:#1C1C1A; transition:width 0.3s; }
        .nav-link:hover { color:#1C1C1A; }
        .nav-link:hover::after { width:100%; }
        .slide { position:absolute; inset:0; transition:opacity 0.8s ease; }
        .slide.active { opacity:1; }
        .slide.hidden { opacity:0; pointer-events:none; }
        .stage-card { border-radius:20px; overflow:hidden; transition:transform 0.3s, box-shadow 0.3s; display:block; text-decoration:none; color:inherit; cursor:pointer; }
        .stage-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(0,0,0,0.08); }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-track { animation:marquee 22s linear infinite; }
        .step-card { transition:background 0.3s, border-color 0.3s, transform 0.3s; }
        .step-card:hover { background:rgba(232,131,74,0.07)!important; border-color:rgba(232,131,74,0.3)!important; transform:translateY(-4px); }
        .why-item { transition:background 0.25s, transform 0.25s; border-radius:14px; padding:16px; }
        .why-item:hover { background:#FFF0EA; transform:translateX(4px); }
        .testi-card { transition:box-shadow 0.3s, transform 0.3s; }
        .testi-card:hover { box-shadow:0 12px 30px rgba(0,0,0,0.07); transform:translateY(-3px); }
        .blog-card { background:white; border-radius:18px; overflow:hidden; transition:transform 0.3s, box-shadow 0.3s; text-decoration:none; color:inherit; display:block; }
        .blog-card:hover { transform:translateY(-4px); box-shadow:0 12px 30px rgba(0,0,0,0.07); }
        .faq-item { background:white; border-radius:14px; margin-bottom:8px; overflow:hidden; border:1px solid rgba(0,0,0,0.05); }
        .faq-question { width:100%; display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border:none; background:none; cursor:pointer; text-align:left; font-size:15px; font-weight:600; color:#1C1C1A; transition:background 0.2s; gap:12px; }
        .faq-question:hover { background:#FAFAF8; }
        .faq-answer { padding:0 22px; max-height:0; overflow:hidden; transition:max-height 0.4s cubic-bezier(0.22,1,0.36,1), padding 0.3s; }
        .faq-answer.open { max-height:200px; padding:0 22px 18px; }
        .faq-chevron { width:18px; height:18px; flex-shrink:0; transition:transform 0.3s; color:#7A7068; }
        .faq-chevron.open { transform:rotate(180deg); }
        .contact-card { text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; border-radius:20px; padding:28px 22px; border:1.5px solid transparent; transition:transform 0.3s, border-color 0.3s; cursor:pointer; }
        .cc-wa { background:#1A2E22; }
        .cc-wa:hover { border-color:#25D366; transform:translateY(-4px); }
        .cc-ig { background:#2A1A2A; }
        .cc-ig:hover { border-color:#E1306C; transform:translateY(-4px); }
        @media(max-width:768px) {
          .nav-links-wrap { display:none!important; }
          .hero-inner { flex-direction:column!important; gap:28px!important; padding-top:90px!important; }
          .hero-img-wrap { width:100%!important; flex:none!important; height:260px!important; border-radius:20px!important; }
          .hero-btns { flex-direction:column!important; gap:10px!important; }
          .hero-btns button { width:100%!important; }
          .stats-wrap { flex-wrap:wrap!important; }
          .stat-item { width:50%!important; padding:16px 8px!important; border-right:none!important; border-bottom:1px solid rgba(255,255,255,0.06)!important; }
          .stages-grid { grid-template-columns:1fr!important; }
          .steps-grid { grid-template-columns:1fr!important; }
          .why-grid { grid-template-columns:1fr!important; gap:32px!important; }
          .testi-grid { grid-template-columns:1fr!important; }
          .blog-grid { grid-template-columns:1fr!important; }
          .contact-grid { grid-template-columns:1fr!important; }
          .footer-top { flex-direction:column!important; }
        }
      `}</style>

      <main style={{ background:'#FAF9F6' }}>

        {/* NAVBAR */}
        <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(250,249,246,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(28,28,26,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:'64px' }}>
          {logo?.url
            ? <img src={logo.url} alt={logo.alt_text || 'Ninoz'} style={{ height:'36px', width:'auto', objectFit:'contain' }} />
            : <div style={{ fontFamily:'var(--font-logo)', fontSize:'26px', color:'#1C1C1A', lineHeight:1 }}>ninoz</div>
          }
          <div className="nav-links-wrap" style={{ display:'flex', gap:'32px' }}>
            {[{ label:'How It Works', id:'how' },{ label:'Menu', id:'offers' },{ label:'Reviews', id:'testimonials' },{ label:'FAQ', id:'faq' }].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="nav-link">{item.label}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => scrollTo('offers')}>{c(content, 'hero_btn_primary', 'Start Subscribing')}</button>
        </nav>

        {/* HERO */}
        <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', background:'#FAF9F6', padding:'0 6%' }}>
          <div className="hero-inner" style={{ display:'flex', alignItems:'center', gap:'60px', maxWidth:'1200px', width:'100%', margin:'0 auto', paddingTop:'80px', paddingBottom:'60px' }}>
            <div style={{ flex:1 }}>
              <div className="reveal" style={{ fontSize:'11px', fontWeight:500, color:'#7A7068', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'20px' }}>
                {c(content, 'hero_badge', 'Fresh Daily Baby Meals · Riyadh')}
              </div>
              <h1 className="reveal delay-1" style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(34px,5vw,62px)', fontWeight:700, lineHeight:1.05, marginBottom:'18px', letterSpacing:'-0.5px' }}>
                <span style={{ color:'#1C1C1A', display:'block' }}>{c(content, 'hero_headline_1', 'You Care.')}</span>
                <span style={{ color:'#4A7C59', display:'block' }}>{c(content, 'hero_headline_2', 'We Prepare.')}</span>
              </h1>
              <p className="reveal delay-2" style={{ fontFamily:'var(--font-desc)', fontSize:'15px', lineHeight:1.7, color:'#7A7068', maxWidth:'380px', marginBottom:'32px' }}>
                {c(content, 'hero_description', 'Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.')}
              </p>
              <div className="hero-btns reveal delay-3" style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'28px' }}>
                <button className="btn-primary" onClick={() => scrollTo('offers')}>{c(content, 'hero_btn_primary', 'Start Subscribing')}</button>
                <button className="btn-outline" onClick={() => scrollTo('offers')}>{c(content, 'hero_btn_secondary', 'See the Menu')}</button>
              </div>
              <div className="reveal delay-4" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ display:'flex', gap:'2px' }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color:'#E8834A', fontSize:'16px' }}>★</span>)}</div>
                <span style={{ fontSize:'13px', color:'#7A7068' }}>{c(content, 'hero_social_proof', 'Trusted by 200+ Riyadh mothers')}</span>
              </div>
            </div>

            {/* ── HERO SLIDESHOW ──
                Shows real photos uploaded from admin → Images → Slideshow
                Falls back to emoji if no photos uploaded yet */}
            <div className="hero-img-wrap reveal delay-2" style={{ flex:'0 0 460px', height:'500px', borderRadius:'28px', overflow:'hidden', position:'relative', boxShadow:'0 24px 60px rgba(28,28,26,0.1)' }}>
              {hasRealSlides
                ? slideshowImages.map((slide, i) => (
                    <div key={slide.name} className={`slide ${i === slideIndex ? 'active' : 'hidden'}`}>
                      <img
                        src={slide.url}
                        alt={slide.name}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      />
                    </div>
                  ))
                : fallbackSlides.map((slide, i) => (
                    <div key={i} className={`slide ${i === slideIndex ? 'active' : 'hidden'}`}
                      style={{ background:slide.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'110px' }}>
                      {slide.emoji}
                    </div>
                  ))
              }
              <div style={{ position:'absolute', top:'16px', right:'16px', background:'#E8834A', color:'white', fontSize:'12px', fontWeight:600, padding:'8px 18px', borderRadius:'50px', boxShadow:'0 4px 16px rgba(232,131,74,0.4)', zIndex:2 }}>
                {c(content, 'hero_badge_photo', 'Our Cooking »')}
              </div>
              <div style={{ position:'absolute', bottom:'14px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'5px', zIndex:2 }}>
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <div key={i} onClick={() => setSlideIndex(i)} style={{ width: i === slideIndex ? '18px' : '6px', height:'6px', borderRadius:'3px', background: i === slideIndex ? 'white' : 'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.3s' }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div style={{ background:'#2C2A28', overflow:'hidden', padding:'14px 0' }}>
          <div className="marquee-track" style={{ display:'flex', gap:'50px', width:'max-content' }}>
            {['🥕 100% Organic','🍼 Ages 3mo–3yr','🚚 Daily Delivery','👩‍⚕️ Nutritionist Designed','🏅 Certified Kitchen','⚡ Pause Anytime','🌿 No Preservatives',"❤️ Riyadh's Favourite",
              '🥕 100% Organic','🍼 Ages 3mo–3yr','🚚 Daily Delivery','👩‍⚕️ Nutritionist Designed','🏅 Certified Kitchen','⚡ Pause Anytime','🌿 No Preservatives',"❤️ Riyadh's Favourite",
            ].map((item, i) => (
              <div key={i} style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', whiteSpace:'nowrap' }}>{item}</div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={{ background:'#2C2A28', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div className="stats-wrap" style={{ display:'flex', justifyContent:'center', padding:'24px 6%' }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="stat-item reveal" style={{ textAlign:'center', padding:'0 40px', borderRight: i < 4 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'28px', color:'#E8834A', fontWeight:700 }}>{c(content, `stat_${i}_number`, '0')}</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'3px' }}>{c(content, `stat_${i}_label`, '')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STAGES / MENU */}
        <section id="offers" style={{ padding:'80px 6%', background:'#FAF9F6' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(74,124,89,0.1)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Our Menu</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>{c(content, 'offers_title', 'A plan for every little stage')}</h2>
            <p style={{ fontSize:'15px', color:'#7A7068', marginTop:'10px' }}>{c(content, 'offers_subtitle', "Each plan is built around your baby's exact age and nutritional needs.")}</p>
          </div>
          <div className="stages-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(stages.length, 3)},1fr)`, gap:'16px', maxWidth:'1100px', margin:'0 auto' }}
            onTouchStart={e => { touchStartX = e.touches[0].clientX }}
            onTouchEnd={e => { const diff = touchStartX - e.changedTouches[0].clientX; if (diff > 50 && activeCard < stages.length-1) setActiveCard(c => c+1); if (diff < -50 && activeCard > 0) setActiveCard(c => c-1) }}>
            {stages.map((stage, i) => (
              <Link key={stage.id} href={`/menu/${stage.id}`} className={`stage-card reveal delay-${Math.min(i+1,4)}`} style={{ background:stage.card_bg, border:`1px solid ${stage.card_border}` }}>
                <div style={{ width:'100%', height:'180px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'64px', background:`${stage.card_border}55` }}>
                  {stage.image_url
                    ? <img src={stage.image_url} alt={stage.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : stage.emoji
                  }
                </div>
                <div style={{ padding:'20px 22px 24px' }}>
                  <div style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', color:'#7A7068', marginBottom:'5px' }}>{stage.name} · {stage.age_range}</div>
                  <div style={{ fontFamily:'var(--font-hero)', fontSize:'20px', fontWeight:700, marginBottom:'7px', color:'#1C1C1A' }}>{stage.name}</div>
                  <p style={{ fontSize:'13px', color:'#7A7068', lineHeight:1.6, marginBottom:'16px' }}>{stage.description}</p>
                  {stage.tag && <div style={{ marginBottom:'14px' }}><span style={{ background:`${stage.tag_color}15`, color:stage.tag_color, fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'50px' }}>{stage.tag}</span></div>}
                  <div style={{ display:'inline-block', background:'#1C1C1A', color:'white', fontSize:'12px', fontWeight:600, padding:'9px 20px', borderRadius:'50px' }}>See Plans →</div>
                </div>
              </Link>
            ))}
          </div>
          {stages.length > 1 && (
            <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'24px' }}>
              {stages.map((_, i) => <div key={i} onClick={() => setActiveCard(i)} style={{ width: i === activeCard ? '20px' : '7px', height:'7px', borderRadius:'4px', background: i === activeCard ? '#E8834A' : 'rgba(28,28,26,0.12)', cursor:'pointer', transition:'all 0.3s' }} />)}
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ background:'#2C2A28', padding:'80px 6%', position:'relative', overflow:'hidden' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(232,131,74,0.12)', color:'#E8834A', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>How It Works</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', color:'white', fontWeight:700, lineHeight:1.1 }}>{c(content, 'how_title', '3 steps, then we handle it')}</h2>
          </div>
          <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(howSteps.length,3)},1fr)`, gap:'16px', maxWidth:'1100px', margin:'0 auto 40px' }}>
            {howSteps.map((step, i) => (
              <div key={step.id} className={`reveal step-card delay-${Math.min(i+1,4)}`} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'18px', padding:'28px 22px' }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'40px', color:'rgba(255,255,255,0.05)', lineHeight:1, marginBottom:'14px', fontWeight:700 }}>{step.number}</div>
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(232,131,74,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', marginBottom:'16px' }}>{step.icon}</div>
                <div style={{ fontSize:'16px', fontWeight:600, color:'white', marginBottom:'8px' }}>{step.title}</div>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>{step.description}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center' }}><button className="btn-primary" onClick={() => scrollTo('offers')}>Start Your Journey →</button></div>
        </section>

        {/* WHY NINOZ */}
        <section id="why" style={{ padding:'80px 6%', background:'#FAF9F6' }}>
          <div className="why-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center', maxWidth:'1100px', margin:'0 auto' }}>
            <div className="reveal" style={{ position:'relative' }}>
              <div style={{ height:'420px', borderRadius:'24px', overflow:'hidden', background:'linear-gradient(145deg,#E8DDD0,#C5D4BF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'80px' }}>🌿</div>
              <div style={{ position:'absolute', bottom:'-14px', left:'-14px', background:'white', borderRadius:'16px', padding:'12px 16px', boxShadow:'0 6px 24px rgba(0,0,0,0.07)' }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'22px', color:'#1C1C1A', fontWeight:700 }}>{c(content, 'stat_1_number', '200+')}</div>
                <div style={{ fontSize:'11px', color:'#7A7068', marginTop:'2px' }}>{c(content, 'stat_1_label', 'Families Served')}</div>
              </div>
              <div style={{ position:'absolute', top:'20px', right:'-14px', background:'white', borderRadius:'16px', padding:'12px 16px', boxShadow:'0 6px 24px rgba(0,0,0,0.07)' }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'22px', color:'#4A7C59', fontWeight:700 }}>{c(content, 'stat_4_number', '0')}</div>
                <div style={{ fontSize:'11px', color:'#7A7068', marginTop:'2px' }}>{c(content, 'stat_4_label', 'Preservatives')}</div>
              </div>
            </div>
            <div className="reveal delay-1">
              <div style={{ display:'inline-block', background:'rgba(74,124,89,0.1)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Why Ninoz</div>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,36px)', fontWeight:700, lineHeight:1.1, marginBottom:'24px' }}>{c(content, 'why_title', 'Food you can trust')}</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                {whyPoints.map(point => (
                  <div key={point.id} className="why-item" style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'11px', flexShrink:0, background:point.icon_bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{point.icon}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'14px', marginBottom:'3px' }}>{point.title}</div>
                      <div style={{ fontSize:'13px', color:'#7A7068', lineHeight:1.6 }}>{point.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" style={{ background:'#EDF2EC', padding:'80px 6%' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'rgba(74,124,89,0.12)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Reviews</div>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>{c(content, 'testi_title', 'What mums say')}</h2>
          </div>
          <div className="testi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', maxWidth:'1100px', margin:'0 auto' }}>
            {testimonials.map((t, i) => (
              <div key={t.id} className={`reveal testi-card delay-${Math.min(i+1,4)}`} style={{ background:'white', borderRadius:'18px', padding:'22px 20px', border:'1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ color:'#E8834A', fontSize:'14px', letterSpacing:'2px', marginBottom:'10px' }}>{'★'.repeat(t.rating || 5)}</div>
                <p style={{ fontSize:'13px', color:'#7A7068', lineHeight:1.75, marginBottom:'16px', fontStyle:'italic' }}>&ldquo;{t.review}&rdquo;</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:t.avatar_bg||'#FFDDD2', color:t.avatar_color||'#993D20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:600, flexShrink:0 }}>{t.avatar_text||t.name.slice(0,2)}</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600 }}>{t.name}</div>
                    <div style={{ fontSize:'11px', color:'#7A7068' }}>{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BLOG */}
        {blogPosts.length > 0 && (
          <section id="blog" style={{ padding:'80px 6%', background:'#FAF9F6' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
              <div style={{ display:'inline-block', background:'rgba(232,131,74,0.1)', color:'#E8834A', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Our Blog</div>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>{c(content, 'blog_title', 'Learn & grow together')}</h2>
              <p style={{ fontSize:'15px', color:'#7A7068', marginTop:'10px' }}>{c(content, 'blog_subtitle', 'Tips from nutritionists and fellow mums.')}</p>
            </div>
            <div className="blog-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', maxWidth:'1100px', margin:'0 auto' }}>
              {blogPosts.map((post, i) => (
                <a key={post.id} href="#" className={`blog-card reveal delay-${Math.min(i+1,4)}`}>
                  <div style={{ height:'160px', background:'linear-gradient(145deg,#F0EBE3,#E0EBE0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px', overflow:'hidden' }}>
                    {post.image_url ? <img src={post.image_url} alt={post.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '📰'}
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
        )}

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section id="faq" style={{ padding:'80px 6%', background:'#EDF2EC' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
              <div style={{ display:'inline-block', background:'rgba(74,124,89,0.12)', color:'#4A7C59', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>FAQ</div>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', fontWeight:700, lineHeight:1.1 }}>{c(content, 'faq_title', 'Common questions')}</h2>
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
        )}

        {/* CONTACT */}
        <section id="contact" style={{ background:'#2C2A28', padding:'80px 6%' }}>
          <div style={{ maxWidth:'620px', margin:'0 auto', textAlign:'center' }}>
            <div className="reveal">
              <div style={{ display:'inline-block', background:'rgba(232,131,74,0.12)', color:'#E8834A', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>Get In Touch</div>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(24px,4vw,38px)', color:'white', fontWeight:700, lineHeight:1.1, marginBottom:'10px' }}>{c(content, 'contact_title', "We'd love to hear from you")}</h2>
              <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)', marginBottom:'40px' }}>{c(content, 'contact_subtitle', 'Questions, custom plans, or allergies — reach us directly.')}</p>
            </div>
            <div className="contact-grid reveal delay-1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <a href={`https://wa.me/${settings.whatsapp_number||'966XXXXXXXXX'}`} target="_blank" className="contact-card cc-wa">
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(37,211,102,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'white' }}>WhatsApp Us</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Fastest response</div>
                <div style={{ background:'rgba(37,211,102,0.12)', color:'#25D366', fontSize:'11px', fontWeight:600, padding:'4px 12px', borderRadius:'50px' }}>Message us →</div>
              </a>
              <a href={`https://instagram.com/${settings.instagram_handle||'ninoz.sa'}`} target="_blank" className="contact-card cc-ig">
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(225,48,108,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="url(#ig4)">
                    <defs><linearGradient id="ig4" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'white' }}>Follow on Instagram</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Daily content & behind the scenes</div>
                <div style={{ background:'rgba(225,48,108,0.12)', color:'#E1306C', fontSize:'11px', fontWeight:600, padding:'4px 12px', borderRadius:'50px' }}>@{settings.instagram_handle||'ninoz.sa'} →</div>
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background:'#0E0904', padding:'44px 6% 24px' }}>
          <div className="footer-top" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:'28px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexWrap:'wrap', gap:'28px' }}>
            <div>
              {logo?.url
                ? <img src={logo.url} alt={logo.alt_text||'Ninoz'} style={{ height:'32px', width:'auto', objectFit:'contain', marginBottom:'8px' }} />
                : <div style={{ fontFamily:'var(--font-logo)', fontSize:'22px', color:'white', fontWeight:400 }}>ninoz</div>
              }
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', marginTop:'8px', maxWidth:'200px', lineHeight:1.6 }}>{c(content, 'footer_tagline', 'Fresh organic meals for babies 3 months – 3 years. Delivered daily across Riyadh.')}</div>
            </div>
            <div style={{ display:'flex', gap:'48px', flexWrap:'wrap' }}>
              {['Company','Meals','Contact'].map(col => (
                <div key={col}>
                  <div style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.18)', marginBottom:'12px' }}>{col}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {['Our Story','Our Kitchen','Careers'].map(link => <a key={link} href="#" style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', textDecoration:'none' }}>{link}</a>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'20px', fontSize:'11px', color:'rgba(255,255,255,0.15)', flexWrap:'wrap', gap:'8px' }}>
            <span>{c(content, 'footer_copyright', '© 2025 Ninoz. All rights reserved.')}</span>
            <span>Privacy Policy · Terms of Service</span>
          </div>
        </footer>

      </main>
    </>
  )
}
