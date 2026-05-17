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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  // Hero background — uses first slideshow image if available
  const heroBg = slideshowImages.length > 0 ? slideshowImages[0].url : null

  const [openFaq, setOpenFaq] = useState<string | null>(null)

  return (
    <>
      <style>{`
        .reveal { opacity:0; transform:translateY(24px); transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .reveal.visible { opacity:1; transform:none; }
        .reveal.delay-1 { transition-delay:0.1s; }
        .reveal.delay-2 { transition-delay:0.2s; }
        .reveal.delay-3 { transition-delay:0.3s; }
        .reveal.delay-4 { transition-delay:0.4s; }

        /* ── BUTTONS ── */
        .btn-primary { background:var(--orange); color:white; border:none; padding:14px 32px; border-radius:50px; font-size:14px; font-weight:700; cursor:pointer; transition:background 0.2s, transform 0.2s; white-space:nowrap; }
        .btn-primary:hover { background:var(--orange-light); transform:translateY(-2px); }
        .btn-outline { background:rgba(255,255,255,0.15); color:white; border:2px solid rgba(255,255,255,0.5); padding:13px 30px; border-radius:50px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; backdrop-filter:blur(4px); }
        .btn-outline:hover { background:rgba(255,255,255,0.25); border-color:white; transform:translateY(-2px); }
        .btn-outline-dark { background:transparent; color:var(--brown-soft); border:2px solid rgba(44,26,14,0.2); padding:13px 30px; border-radius:50px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .btn-outline-dark:hover { border-color:var(--orange); color:var(--orange); transform:translateY(-2px); }

        /* ── NAV ── */
        .nav-link { font-size:14px; color:white; background:none; border:none; cursor:pointer; font-weight:600; position:relative; padding-bottom:2px; transition:color 0.2s; text-shadow:0 1px 4px rgba(0,0,0,0.3); }
        .nav-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:2px; background:white; transition:width 0.3s; border-radius:2px; }
        .nav-link:hover::after { width:100%; }

        /* ── STAGE CARDS ── */
        .stage-card { background:white; border-radius:16px; padding:20px 24px; border:1px solid rgba(44,26,14,0.08); transition:transform 0.3s, box-shadow 0.3s; cursor:pointer; text-decoration:none; display:block; color:inherit; }
        .stage-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(44,26,14,0.12); }

        /* ── HOW CARDS ── */
        .step-card { background:white; border-radius:20px; border:1px solid rgba(44,26,14,0.08); transition:transform 0.3s, box-shadow 0.3s; }
        .step-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(44,26,14,0.08); }

        /* ── TESTI CARDS ── */
        .testi-card { background:white; border-radius:20px; border:1px solid rgba(44,26,14,0.08); transition:box-shadow 0.3s, transform 0.3s; display:flex; flex-direction:column; }
        .testi-card:hover { box-shadow:0 12px 30px rgba(44,26,14,0.08); transform:translateY(-3px); }

        .why-item { transition:background 0.25s, transform 0.25s; border-radius:14px; padding:14px; }
        .why-item:hover { background:rgba(200,75,15,0.06); transform:translateX(4px); }

        .blog-card { background:white; border-radius:20px; overflow:hidden; border:1px solid rgba(44,26,14,0.08); transition:transform 0.3s, box-shadow 0.3s; text-decoration:none; color:inherit; display:block; }
        .blog-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(44,26,14,0.1); }

        /* ── FAQ ── */
        .faq-item { background:white; border-radius:14px; margin-bottom:10px; overflow:hidden; border:1px solid rgba(44,26,14,0.08); }
        .faq-question { width:100%; display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border:none; background:none; cursor:pointer; text-align:left; font-size:15px; font-weight:700; color:var(--text); transition:background 0.2s; gap:12px; font-family:var(--font-body); }
        .faq-question:hover { background:rgba(200,75,15,0.04); }
        .faq-answer { padding:0 22px; max-height:0; overflow:hidden; transition:max-height 0.4s cubic-bezier(0.22,1,0.36,1), padding 0.3s; }
        .faq-answer.open { max-height:300px; padding:0 22px 20px; }
        .faq-chevron { width:20px; height:20px; flex-shrink:0; transition:transform 0.3s; color:var(--orange); }
        .faq-chevron.open { transform:rotate(180deg); }

        .contact-card { text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; border-radius:20px; padding:28px 22px; border:2px solid transparent; transition:transform 0.3s, border-color 0.3s; cursor:pointer; }
        .cc-wa { background:#1A2E22; }
        .cc-wa:hover { border-color:#25D366; transform:translateY(-4px); }
        .cc-ig { background:#2A1A2A; }
        .cc-ig:hover { border-color:#E1306C; transform:translateY(-4px); }

        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-track { animation:marquee 28s linear infinite; }

        /* ══ DESKTOP ══ */
        @media(min-width:769px) {
          .testi-wrap { display:grid !important; grid-template-columns:repeat(3,1fr) !important; }
          .testi-wrap .h-item { flex:none !important; max-width:none !important; }
          .how-wrap { display:grid !important; grid-template-columns:repeat(3,1fr) !important; }
          .how-wrap .h-item { flex:none !important; max-width:none !important; }
        }

        /* ══ MOBILE ══ */
        @media(max-width:768px) {
          .nav-links-wrap { display:none !important; }
          .hero-content h1 { font-size:44px !important; }
          .hero-badges { gap:14px !important; flex-wrap:wrap !important; }
          .hero-btns { flex-direction:column !important; gap:10px !important; }
          .hero-btns button, .hero-btns a { width:100% !important; text-align:center !important; }
          .stages-layout { flex-direction:column !important; }
          .stages-photo { display:none !important; }
          .why-grid { grid-template-columns:1fr !important; gap:32px !important; }
          .blog-grid { grid-template-columns:1fr !important; }
          .contact-grid { grid-template-columns:1fr !important; }
          .footer-top { flex-direction:column !important; }
          .stat-ticker { flex-wrap:wrap !important; }
          .testi-wrap { display:flex !important; overflow-x:auto !important; scroll-snap-type:x mandatory !important; gap:14px !important; }
          .testi-wrap .h-item { flex:0 0 82vw !important; max-width:320px !important; scroll-snap-align:start !important; }
          .how-wrap { display:flex !important; overflow-x:auto !important; scroll-snap-type:x mandatory !important; gap:16px !important; }
          .how-wrap .h-item { flex:0 0 82vw !important; max-width:320px !important; scroll-snap-align:start !important; }
        }
      `}</style>

      <main style={{ background:'var(--cream)' }}>

        {/* ══════════════════════════════════
            HERO — Full screen background image
            Text overlaid on top
        ══════════════════════════════════ */}
        <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column' }}>

          {/* Background image or gradient */}
          <div style={{
            position:'absolute', inset:0, zIndex:0,
            background: heroBg ? `url(${heroBg}) center/cover no-repeat` : 'linear-gradient(135deg, #C84B0F 0%, #8B3210 50%, #2C1A0E 100%)',
          }}>
            {/* Dark overlay for text readability */}
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
          </div>

          {/* NAVBAR — over the hero image */}
          <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(0,0,0,0.2)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:'68px' }}>
            {logo?.url
              ? <a href="/"><img src={logo.url} alt={logo.alt_text||'Ninoz'} style={{ height:'40px', width:'auto', objectFit:'contain', cursor:'pointer' }} /></a>
              : <a href="/" style={{ fontFamily:'var(--font-hero)', fontSize:'28px', color:'white', fontWeight:900, textDecoration:'none', letterSpacing:'-0.5px', textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>Ninoz</a>
            }
            <div className="nav-links-wrap" style={{ display:'flex', gap:'36px' }}>
              {[{ label:'Menu', id:'offers' },{ label:'How It Works', id:'how' },{ label:'Plans', id:'offers' },{ label:'FAQ', id:'faq' },{ label:'About', id:'why' }].map(item => (
                <button key={item.label} onClick={() => scrollTo(item.id)} className="nav-link">{item.label}</button>
              ))}
            </div>
            <button className="btn-primary" style={{ fontSize:'13px', padding:'11px 22px' }} onClick={() => scrollTo('offers')}>
              Start Your Plan
            </button>
          </nav>

          {/* Hero content */}
          <div className="hero-content" style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'120px 6% 80px', maxWidth:'700px' }}>
            <h1 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(48px,7vw,84px)', fontWeight:900, lineHeight:1.0, marginBottom:'20px', color:'var(--orange)', letterSpacing:'-1px', textShadow:'0 2px 20px rgba(0,0,0,0.3)' }}>
              <span style={{ display:'block' }}>{c(content, 'hero_headline_1', 'You Care.')}</span>
              <span style={{ display:'block' }}>{c(content, 'hero_headline_2', 'We Prepare.')}</span>
            </h1>
            <p style={{ fontSize:'18px', lineHeight:1.7, color:'white', maxWidth:'480px', marginBottom:'36px', fontWeight:500, textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
              {c(content, 'hero_description', 'Fresh, Healthy daily meals for your little ones. Cooked today, delivered to your doorstep.')}
            </p>

            {/* 4 badges */}
            <div className="hero-badges" style={{ display:'flex', gap:'24px', marginBottom:'40px', flexWrap:'wrap' }}>
              {[
                { icon:'🌿', label:'Fresh Ingredients' },
                { icon:'🚫', label:'No Preservatives' },
                { icon:'⏰', label:'Cooked Daily' },
                { icon:'👨‍⚕️', label:'Pediatrician Approved' },
              ].map(badge => (
                <div key={badge.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', backdropFilter:'blur(4px)' }}>{badge.icon}</div>
                  <span style={{ fontSize:'11px', color:'white', fontWeight:600, textAlign:'center', maxWidth:'72px', lineHeight:1.3, textShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>{badge.label}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="hero-btns" style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
              <button className="btn-primary" onClick={() => scrollTo('offers')}>
                {c(content, 'hero_btn_primary', 'Start Your Plan')}
              </button>
              <button className="btn-outline" onClick={() => scrollTo('offers')}>
                {c(content, 'hero_btn_secondary', 'Explore Meals')}
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            STATS BAR — text only, like PDF
            Dark orange background, horizontal
        ══════════════════════════════════ */}
        <div style={{ background:'var(--orange-bg)', padding:'14px 0', overflow:'hidden' }}>
          <div className="stat-ticker" style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'0', maxWidth:'1100px', margin:'0 auto', flexWrap:'nowrap' }}>
            {[
              { num: c(content,'stat_3_number','100%'), label: c(content,'stat_3_label','Fresh Ingredients') },
              { num: c(content,'stat_1_number','0%'),   label: c(content,'stat_1_label','Sugar Added or Sweetener') },
              { num: c(content,'stat_2_number','0%'),   label: c(content,'stat_2_label','Preservatives & Synthetics') },
              { num: c(content,'stat_4_number','0%'),   label: c(content,'stat_4_label','Frozen Food') },
            ].map((stat, i, arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0 28px', borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.2)' : 'none', whiteSpace:'nowrap' }}>
                <span style={{ fontFamily:'var(--font-hero)', fontSize:'18px', color: i === 0 ? '#FFD166' : 'white', fontWeight:900 }}>{stat.num}</span>
                <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════
            STAGES — Left: text + cards, Right: photo
            Matches PDF page 2 layout
        ══════════════════════════════════ */}
        <section id="offers" style={{ padding:'80px 6%', background:'var(--cream)' }}>
          <div className="stages-layout" style={{ display:'flex', gap:'60px', maxWidth:'1200px', margin:'0 auto', alignItems:'flex-start' }}>

            {/* Left: headline + stage cards */}
            <div style={{ flex:'1 1 500px' }}>
              <h2 className="reveal" style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(32px,4vw,52px)', fontWeight:900, color:'var(--orange)', lineHeight:1.1, marginBottom:'8px' }}>
                Fresh Meals Built for
              </h2>
              <h2 className="reveal" style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(32px,4vw,52px)', fontWeight:900, color:'var(--orange)', lineHeight:1.1, marginBottom:'40px' }}>
                Their Stage
              </h2>

              {/* Stage cards stacked */}
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {stages.map((stage, i) => (
                  <Link key={stage.id} href={`/menu/${stage.id}`} className={`stage-card reveal delay-${Math.min(i+1,4)}`}>
                    <div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:'6px' }}>
                      {stage.name}: {stage.age_range}
                    </div>
                    {stage.tag && (
                      <div style={{ display:'inline-block', background:'var(--orange)', color:'white', fontSize:'12px', fontWeight:700, padding:'3px 12px', borderRadius:'4px', marginBottom:'10px' }}>
                        {stage.tag}
                      </div>
                    )}
                    <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.65, marginBottom:'10px' }}>{stage.description}</p>
                    <span style={{ fontSize:'13px', color:'var(--orange)', fontWeight:700 }}>Explore Meals →</span>
                  </Link>
                ))}
              </div>

              <div style={{ marginTop:'32px' }}>
                <button className="btn-primary" onClick={() => scrollTo('offers')}>Start Your Plan</button>
              </div>
            </div>

            {/* Right: large product photo */}
            <div className="stages-photo reveal delay-2" style={{ flex:'0 0 480px', height:'560px', borderRadius:'24px', overflow:'hidden', position:'sticky', top:'80px' }}>
              {slideshowImages.length > 1
                ? <img src={slideshowImages[1].url} alt="Ninoz meals" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : slideshowImages.length === 1
                  ? <img src={slideshowImages[0].url} alt="Ninoz meals" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', background:'linear-gradient(145deg,#F2EAE0,#E8D5C4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'100px' }}>🍱</div>
              }
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════ */}
        <section id="how" style={{ background:'var(--cream-dark)', padding:'80px 6%' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'var(--orange)', marginBottom:'10px' }}>
              {c(content, 'how_title', 'How it Works')}
            </h2>
            <p style={{ fontSize:'16px', color:'var(--text-muted)' }}>Three steps to peace of mind — and a well-fed baby.</p>
          </div>
          <div className="how-wrap" style={{ display:'flex', gap:'20px', maxWidth:'1100px', margin:'0 auto 40px', scrollSnapType:'x mandatory', WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
            {howSteps.map((step, i) => (
              <div key={step.id} className={`h-item step-card reveal delay-${Math.min(i+1,4)}`} style={{ padding:'32px 28px', flex:1 }}>
                <div style={{ fontFamily:'var(--font-hero)', fontSize:'52px', color:'var(--orange)', fontWeight:900, lineHeight:1, marginBottom:'20px' }}>{step.number}</div>
                <div style={{ width:'80px', height:'80px', borderRadius:'18px', background:'rgba(200,75,15,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', marginBottom:'20px' }}>{step.icon}</div>
                <div style={{ fontSize:'17px', fontWeight:800, color:'var(--text)', marginBottom:'10px', fontFamily:'var(--font-hero)' }}>{step.title}</div>
                <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.7 }}>{step.description}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center' }}>
            <button className="btn-primary" onClick={() => scrollTo('offers')}>Get Started</button>
          </div>
        </section>

        {/* ══════════════════════════════════
            WHY NINOZ — Left text + points, Right photo
            Matches PDF page 4 layout
        ══════════════════════════════════ */}
        <section id="why" style={{ padding:'80px 6%', background:'var(--cream)' }}>
          <div className="why-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center', maxWidth:'1200px', margin:'0 auto' }}>

            {/* Left: headline + why points */}
            <div className="reveal">
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(32px,4vw,56px)', fontWeight:900, lineHeight:1.05, marginBottom:'32px', color:'var(--orange)' }}>
                Only Real<br/>Ingredients
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'20px', marginBottom:'40px' }}>
                {whyPoints.map(point => (
                  <div key={point.id} className="why-item" style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                    <div style={{ fontWeight:800, fontSize:'15px', color:'var(--orange)', fontFamily:'var(--font-hero)' }}>{point.title}</div>
                    <div style={{ fontSize:'14px', color:'var(--brown-soft)', lineHeight:1.65 }}>{point.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: photo */}
            <div className="reveal delay-1" style={{ position:'relative' }}>
              <div style={{ height:'480px', borderRadius:'24px', overflow:'hidden', background:'#F2EAE0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'80px' }}>
                {slideshowImages.length > 2
                  ? <img src={slideshowImages[2].url} alt="Baby eating" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : '👶'
                }
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            TESTIMONIALS — unchanged
        ══════════════════════════════════ */}
        <section id="testimonials" style={{ background:'var(--cream-dark)', padding:'80px 6%' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
            <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'var(--orange)', marginBottom:'10px' }}>
              {c(content, 'testi_title', 'What mums say')}
            </h2>
          </div>
          {testimonials.length > 0 ? (
            <div className="testi-wrap" style={{ display:'flex', gap:'16px', maxWidth:'1100px', margin:'0 auto', scrollSnapType:'x mandatory', WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
              {testimonials.map((t, i) => (
                <div key={t.id} className={`h-item testi-card reveal delay-${Math.min(i+1,4)}`} style={{ padding:'26px 24px', flex:1 }}>
                  <div style={{ color:'var(--orange)', fontSize:'18px', letterSpacing:'3px', marginBottom:'14px' }}>{'★'.repeat(t.rating || 5)}</div>
                  <p style={{ fontSize:'14px', color:'var(--brown-soft)', lineHeight:1.8, marginBottom:'20px', fontStyle:'italic', flex:1 }}>&ldquo;{t.review}&rdquo;</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:t.avatar_bg||'#FFDDD2', color:t.avatar_color||'#993D20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, flexShrink:0 }}>{t.avatar_text||t.name.slice(0,2)}</div>
                    <div>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text)' }}>{t.name}</div>
                      <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{t.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'14px' }}>No reviews yet. Add them from the admin portal.</p>
          )}
        </section>

        {/* ══════════════════════════════════
            BLOG — unchanged
        ══════════════════════════════════ */}
        {blogPosts.length > 0 && (
          <section id="blog" style={{ padding:'80px 6%', background:'var(--cream)' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'var(--orange)', marginBottom:'10px' }}>
                {c(content, 'blog_title', 'Learn & grow together')}
              </h2>
              <p style={{ fontSize:'16px', color:'var(--text-muted)' }}>{c(content, 'blog_subtitle', 'Tips from nutritionists and fellow mums.')}</p>
            </div>
            <div className="blog-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', maxWidth:'1100px', margin:'0 auto' }}>
              {blogPosts.map((post, i) => (
                <a key={post.id} href="#" className={`blog-card reveal delay-${Math.min(i+1,4)}`}>
                  <div style={{ height:'180px', background:'#F2EAE0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'52px', overflow:'hidden' }}>
                    {post.image_url ? <img src={post.image_url} alt={post.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '📰'}
                  </div>
                  <div style={{ padding:'20px 22px 24px' }}>
                    <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--orange)', marginBottom:'8px' }}>{post.tag}</div>
                    <div style={{ fontFamily:'var(--font-hero)', fontSize:'17px', fontWeight:800, lineHeight:1.35, marginBottom:'8px', color:'var(--text)' }}>{post.title}</div>
                    <p style={{ fontSize:'13px', color:'var(--text-muted)', lineHeight:1.65 }}>{post.excerpt}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════
            FAQ — unchanged
        ══════════════════════════════════ */}
        {faqItems.length > 0 && (
          <section id="faq" style={{ padding:'80px 6%', background:'var(--cream-dark)' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'48px' }}>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'var(--orange)', marginBottom:'10px' }}>
                {c(content, 'faq_title', 'Common questions')}
              </h2>
            </div>
            <div className="reveal" style={{ maxWidth:'700px', margin:'0 auto' }}>
              {faqItems.map(item => (
                <div key={item.id} className="faq-item">
                  <button className="faq-question" onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}>
                    <span>{item.question}</span>
                    <svg className={`faq-chevron ${openFaq === item.id ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className={`faq-answer ${openFaq === item.id ? 'open' : ''}`}>
                    <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8 }}>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════
            CONTACT — unchanged
        ══════════════════════════════════ */}
        <section id="contact" style={{ background:'var(--brown)', padding:'80px 6%' }}>
          <div style={{ maxWidth:'640px', margin:'0 auto', textAlign:'center' }}>
            <div className="reveal">
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(28px,4vw,44px)', color:'white', fontWeight:900, marginBottom:'12px' }}>
                {c(content, 'contact_title', "We'd love to hear from you")}
              </h2>
              <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.5)', marginBottom:'40px' }}>
                {c(content, 'contact_subtitle', 'Questions, custom plans, or allergies — reach us directly.')}
              </p>
            </div>
            <div className="contact-grid reveal delay-1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <a href={`https://wa.me/${settings.whatsapp_number||'966XXXXXXXXX'}`} target="_blank" className="contact-card cc-wa">
                <div style={{ width:'54px', height:'54px', borderRadius:'14px', background:'rgba(37,211,102,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'white' }}>WhatsApp Us</div>
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)' }}>Fastest response</div>
                <div style={{ background:'rgba(37,211,102,0.15)', color:'#25D366', fontSize:'12px', fontWeight:700, padding:'5px 16px', borderRadius:'50px' }}>Message us →</div>
              </a>
              <a href={`https://instagram.com/${settings.instagram_handle||'ninoz.sa'}`} target="_blank" className="contact-card cc-ig">
                <div style={{ width:'54px', height:'54px', borderRadius:'14px', background:'rgba(225,48,108,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="url(#ig8)">
                    <defs><linearGradient id="ig8" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'white' }}>Follow on Instagram</div>
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)' }}>Daily content & behind the scenes</div>
                <div style={{ background:'rgba(225,48,108,0.15)', color:'#E1306C', fontSize:'12px', fontWeight:700, padding:'5px 16px', borderRadius:'50px' }}>@{settings.instagram_handle||'ninoz.sa'} →</div>
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background:'#1A0E07', padding:'48px 6% 28px' }}>
          <div className="footer-top" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:'32px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap', gap:'28px' }}>
            <div>
              {logo?.url
                ? <a href="/"><img src={logo.url} alt={logo.alt_text||'Ninoz'} style={{ height:'36px', width:'auto', objectFit:'contain', marginBottom:'10px', cursor:'pointer' }} /></a>
                : <a href="/" style={{ fontFamily:'var(--font-hero)', fontSize:'26px', color:'var(--orange)', fontWeight:900, textDecoration:'none', display:'block', marginBottom:'10px' }}>Ninoz</a>
              }
              <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)', maxWidth:'210px', lineHeight:1.65 }}>
                {c(content, 'footer_tagline', 'Fresh organic meals for babies 3 months – 3 years. Delivered daily across Riyadh.')}
              </div>
            </div>
            <div style={{ display:'flex', gap:'48px', flexWrap:'wrap' }}>
              {['Company','Meals','Contact'].map(col => (
                <div key={col}>
                  <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.25)', marginBottom:'14px' }}>{col}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {col === 'Meals'
                      ? stages.map(s => <a key={s.id} href={`/menu/${s.id}`} style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>{s.name}</a>)
                      : ['Our Story','Our Kitchen','Careers'].map(link => <a key={link} href="#" style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>{link}</a>)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'22px', fontSize:'12px', color:'rgba(255,255,255,0.2)', flexWrap:'wrap', gap:'8px' }}>
            <span>{c(content, 'footer_copyright', '© 2025 Ninoz. All rights reserved.')}</span>
            <span>Privacy Policy · Terms of Service</span>
          </div>
        </footer>

      </main>
    </>
  )
}
