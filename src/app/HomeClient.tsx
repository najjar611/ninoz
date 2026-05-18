'use client'

// ══════════════════════════════════════════════════════════
// HomeClient.tsx — v5
// Full homepage client component
// v5 additions:
//   - IngredientsRow in Why Ninoz section (from Supabase)
//   - Footer replaced with new Footer component
//   - "Start Your Plan" / "Start Subscribing" opens SubscriptionPopup
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import IngredientsRow from '@/components/IngredientsRow'
import Footer from '@/components/Footer'
import SubscriptionPopup from '@/components/SubscriptionPopup'

// ── TYPES ──────────────────────────────────────────────────
type Stage = {
  id: string; name: string; age_range: string; description: string
  emoji: string; tag: string | null; tag_color: string; bg_color: string
  card_bg: string; menu_url: string; position: number
}
type PlanDetail = {
  id: string; stage: string; plan_number: number; name: string
  description: string; price: string; tag: string | null; image_url: string | null; is_active: boolean
}
type Meal = { id: string; name: string; stage_id: string; meal_type: string; is_active: boolean }
type HowStep = { id: string; number: string; icon: string; title: string; description: string; position: number }
type WhyPoint = { id: string; icon: string; icon_bg: string; title: string; description: string; position: number }
type Testimonial = {
  id: string; name: string; location: string; avatar_text: string
  avatar_bg: string; avatar_color: string; review: string; rating: number
}
type BlogPost = { id: string; tag: string; title: string; excerpt: string; emoji: string; image_url: string | null }
type FaqItem = { id: string; question: string; answer: string }
type FooterLink = { id: string; column: string; label: string; url: string }
type Logo = { url: string | null; alt_text: string }
type FormField = { id: string; key: string; label: string; type: string; required: boolean; is_active: boolean; position: number }
type Ingredient = { id: string; name: string; description: string; image_url: string | null; position: number; is_active: boolean }

type Props = {
  stages: Stage[]
  planDetails: PlanDetail[]
  meals: Meal[]
  content: Record<string, string>
  howSteps: HowStep[]
  whyPoints: WhyPoint[]
  testimonials: Testimonial[]
  blogPosts: BlogPost[]
  faqItems: FaqItem[]
  footerLinks: FooterLink[]
  logo: Logo | null
  formFields: FormField[]
  ingredients: Ingredient[]
}

export default function HomeClient({
  stages, planDetails, meals, content, howSteps, whyPoints,
  testimonials, blogPosts, faqItems, footerLinks, logo, formFields, ingredients
}: Props) {

  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [showSubPopup, setShowSubPopup] = useState(false)
  const slideTimer = useRef<NodeJS.Timeout | null>(null)

  // Hero slideshow images — add real images to /public/hero/
  const slides = [
    { bg: '#FDF0E8', emoji: '🍱' },
    { bg: '#F0F5F1', emoji: '🥕' },
    { bg: '#F5F0EA', emoji: '🍳' },
  ]

  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setSlideIndex(i => (i + 1) % slides.length)
    }, 3500)
    return () => { if (slideTimer.current) clearInterval(slideTimer.current) }
  }, [])

  // Scroll to section helper
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Get content value with fallback
  const c = (key: string, fallback = '') => content[key] || fallback

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --orange: #C84B0F;
          --orange-light: #E8834A;
          --cream: #FAF5EE;
          --brown: #2C1A0E;
          --font-hero: 'Nunito', sans-serif;
          --font-body: 'Nunito Sans', sans-serif;
        }

        body { font-family: var(--font-body); }

        /* ── REVEAL ── */
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        .delay-1 { transition-delay: 0.12s; }
        .delay-2 { transition-delay: 0.24s; }
        .delay-3 { transition-delay: 0.36s; }

        /* ── NAV ── */
        .nav-link {
          background: none; border: none; cursor: pointer;
          font-family: var(--font-body); font-size: 14px; font-weight: 600;
          color: var(--brown); opacity: 0.65; transition: opacity 0.2s;
        }
        .nav-link:hover { opacity: 1; }
        .nav-links-wrap { display: flex; gap: 32px; align-items: center; }
        .nav-mobile-btn { display: none; }

        /* ── BUTTONS ── */
        .btn-primary {
          background: var(--orange); color: white; border: none;
          padding: 13px 28px; border-radius: 50px;
          font-family: var(--font-hero); font-size: 15px; font-weight: 800;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
        }
        .btn-primary:hover { background: #A33A0A; transform: translateY(-1px); }

        .btn-secondary {
          background: rgba(44,26,14,0.07); color: var(--brown); border: none;
          padding: 13px 28px; border-radius: 50px;
          font-family: var(--font-hero); font-size: 15px; font-weight: 700;
          cursor: pointer; transition: background 0.2s;
          text-decoration: none; display: inline-block;
        }
        .btn-secondary:hover { background: rgba(44,26,14,0.12); }

        /* ── HERO ── */
        .hero-inner { display: flex; align-items: center; gap: 60px; max-width: 1200px; width: 100%; margin: 0 auto; padding-top: 80px; padding-bottom: 60px; }
        .hero-text { flex: 1; }
        .hero-img-wrap { flex: 1; height: 520px; border-radius: 32px; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; transition: background 0.8s ease; font-size: 120px; }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 32px; }
        .hero-trust { display: flex; align-items: center; gap: 8px; margin-top: 20px; }

        /* ── STATS BAR ── */
        .stats-wrap { display: flex; background: var(--brown); }
        .stat-item { flex: 1; padding: 28px 20px; text-align: center; border-right: 1px solid rgba(255,255,255,0.08); }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-family: var(--font-hero); font-size: 28px; font-weight: 900; color: #FFB347; display: block; }
        .stat-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; display: block; text-transform: uppercase; letter-spacing: 0.06em; }

        /* ── PLANS / STAGES ── */
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

        .stage-card {
          border-radius: 28px; overflow: hidden; cursor: pointer;
          transition: transform 0.25s, box-shadow 0.25s;
          position: relative;
        }
        .stage-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(200,75,15,0.15); }

        /* ── HOW IT WORKS ── */
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }

        .step-card {
          background: rgba(255,255,255,0.06); border-radius: 20px;
          padding: 32px 28px; border: 1px solid rgba(255,255,255,0.1);
          transition: background 0.2s;
        }
        .step-card:hover { background: rgba(255,255,255,0.1); }

        /* ── WHY NINOZ ── */
        .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .why-img { width: 100%; height: 480px; border-radius: 28px; object-fit: cover; background: #F0E8D8; display: flex; align-items: center; justify-content: center; font-size: 80px; position: relative; overflow: hidden; }
        .why-pill-1 { position: absolute; left: 24px; bottom: 24px; background: white; border-radius: 14px; padding: 12px 18px; box-shadow: 0 8px 28px rgba(0,0,0,0.12); }
        .why-pill-2 { position: absolute; right: 24px; top: 24px; background: white; border-radius: 14px; padding: 12px 18px; box-shadow: 0 8px 28px rgba(0,0,0,0.12); }

        /* ── TESTIMONIALS ── */
        .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .testi-card { background: white; border-radius: 20px; padding: 28px; border: 1px solid rgba(44,26,14,0.06); }

        /* ── BLOG ── */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { background: white; border-radius: 20px; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; display: block; }
        .blog-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); }

        /* ── FAQ ── */
        .faq-item { border-bottom: 1px solid rgba(44,26,14,0.08); }
        .faq-question {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 20px 0; background: none; border: none; cursor: pointer;
          font-family: var(--font-hero); font-size: 16px; font-weight: 700;
          color: var(--brown); text-align: left; gap: 16px;
        }
        .faq-chevron { width: 20px; height: 20px; flex-shrink: 0; transition: transform 0.3s; color: var(--orange); }
        .faq-chevron.open { transform: rotate(180deg); }
        .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.25s; }
        .faq-answer.open { max-height: 300px; padding-bottom: 16px; }

        /* ── CONTACT ── */
        .contact-card {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 28px 20px; text-decoration: none;
          transition: background 0.2s, transform 0.2s;
        }
        .contact-card:hover { background: rgba(255,255,255,0.1); transform: translateY(-3px); }
        .cc-wa:hover { border-color: rgba(37,211,102,0.3); }
        .cc-ig:hover { border-color: rgba(225,48,108,0.3); }

        /* ── SECTION PADDING ── */
        .section-pad { padding: 100px 6%; }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .nav-links-wrap { display: none !important; }
          .hero-inner { flex-direction: column !important; gap: 32px !important; padding-top: 80px !important; }
          .hero-img-wrap { width: 100% !important; height: 280px !important; }
          .hero-text h1 { font-size: 38px !important; }
          .hero-btns { flex-direction: column !important; }
          .stats-wrap { flex-wrap: wrap !important; }
          .stat-item { width: 50% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .why-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .why-img { height: 300px !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .blog-grid { grid-template-columns: 1fr !important; }
          .section-pad { padding: 60px 5% !important; }
        }
        @media (max-width: 480px) {
          .stat-item { width: 100% !important; }
          .hero-text h1 { font-size: 32px !important; }
        }
      `}</style>

      <main style={{ background: 'var(--cream)' }}>

        {/* ══ NAVBAR ══ */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(250,245,238,0.96)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(44,26,14,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6%', height: '68px',
        }}>
          {/* Logo */}
          {logo?.url ? (
            <img src={logo.url} alt={logo.alt_text} style={{ height: 36, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontFamily: 'var(--font-hero)', fontSize: '28px', fontWeight: 900, color: 'var(--orange)', lineHeight: 1 }}>
              Ninoz
            </div>
          )}

          <div className="nav-links-wrap">
            {[
              { label: 'Menu', href: '/menu/stage1' },
              { label: 'How It Works', id: 'how' },
              { label: 'Plans', id: 'offers' },
              { label: 'FAQ', id: 'faq' },
              { label: 'Blog', id: 'blog' },
            ].map(item => item.href ? (
              <Link key={item.label} href={item.href} style={{ fontSize: 14, fontWeight: 600, color: 'var(--brown)', opacity: 0.65, textDecoration: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}
              >{item.label}</Link>
            ) : (
              <button key={item.label} className="nav-link" onClick={() => scrollTo(item.id!)}>{item.label}</button>
            ))}
          </div>

          <button className="btn-primary" style={{ fontSize: 14, padding: '10px 22px' }} onClick={() => setShowSubPopup(true)}>
            Start Your Plan
          </button>
        </nav>


        {/* ══ HERO ══ */}
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'var(--cream)', padding: '0 6%' }}>
          <div className="hero-inner">
            <div className="hero-text">
              <div className="reveal" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--orange)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,75,15,0.08)', padding: '6px 14px', borderRadius: '50px' }}>
                🌿 {c('hero_badge', 'Fresh · Organic · Daily Delivery in Riyadh')}
              </div>
              <h1 className="reveal delay-1" style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 900, color: 'var(--brown)', lineHeight: 1.08, letterSpacing: '-1px', marginBottom: '20px' }}>
                {c('hero_headline_1', 'You Care.')}<br />
                <span style={{ color: 'var(--orange)' }}>{c('hero_headline_2', 'We Prepare.')}</span>
              </h1>
              <p className="reveal delay-2" style={{ fontSize: '17px', color: '#7A7068', lineHeight: 1.7, maxWidth: '460px', marginBottom: '8px' }}>
                {c('hero_description', 'Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.')}
              </p>

              {/* Trust badges */}
              <div className="reveal delay-2" style={{ display: 'flex', gap: 20, margin: '20px 0', flexWrap: 'wrap' }}>
                {[
                  { icon: '🌿', label: 'Fresh Ingredients' },
                  { icon: '🚫', label: 'No Preservatives' },
                  { icon: '⏰', label: 'Cooked Daily' },
                  { icon: '👶', label: 'Pediatrician Approved' },
                ].map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A7068', fontWeight: 600 }}>
                    <span>{b.icon}</span> {b.label}
                  </div>
                ))}
              </div>

              <div className="hero-btns reveal delay-3">
                <button className="btn-primary" onClick={() => setShowSubPopup(true)}>
                  {c('hero_btn_primary', 'Start Your Plan')}
                </button>
                <Link href="/menu/stage1" className="btn-secondary">
                  {c('hero_btn_secondary', 'Explore Meals')}
                </Link>
              </div>

              <div className="hero-trust reveal delay-3" style={{ marginTop: 24 }}>
                <div style={{ display: 'flex' }}>
                  {['#FFB347', '#E8834A', '#C84B0F', '#2C1A0E', '#7A7068'].map((c, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid white', marginLeft: i > 0 ? -8 : 0 }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: '#7A7068', fontWeight: 600 }}>
                  {c('hero_social_proof', 'Trusted by 200+ Riyadh mothers')}
                </span>
              </div>
            </div>

            {/* Hero image / slideshow */}
            <div className="hero-img-wrap" style={{ background: slides[slideIndex].bg }}>
              <span style={{ fontSize: 120 }}>{slides[slideIndex].emoji}</span>
            </div>
          </div>
        </section>


        {/* ══ STATS BAR ══ */}
        <div className="stats-wrap">
          {[
            { num: c('stat_1_number', '200+'), label: c('stat_1_label', 'Happy Families') },
            { num: c('stat_2_number', '3mo–3yr'), label: c('stat_2_label', 'Age Range') },
            { num: c('stat_3_number', '100%'), label: c('stat_3_label', 'Fresh Daily') },
            { num: c('stat_4_number', '0'), label: c('stat_4_label', 'Preservatives') },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>


        {/* ══ PLANS / STAGES ══ */}
        <section id="offers" className="section-pad" style={{ background: 'white' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', background: 'rgba(200,75,15,0.08)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: 16 }}>
                Our Menu
              </div>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: 'var(--brown)', lineHeight: 1.1, marginBottom: 12 }}>
                {c('offers_title', 'A plan for every little stage')}
              </h2>
              <p style={{ fontSize: 16, color: '#7A7068', maxWidth: 500, margin: '0 auto' }}>
                {c('offers_subtitle', 'Each plan is built around your baby\'s exact age and nutritional needs.')}
              </p>
            </div>

            <div className="plans-grid reveal delay-1">
              {stages.map(stage => (
                <Link key={stage.id} href={stage.menu_url || `/menu/${stage.id}`} style={{ textDecoration: 'none' }}>
                  <div className="stage-card" style={{ background: stage.card_bg || '#FDF0E8' }}>
                    {/* Top: image or emoji */}
                    <div style={{ height: 200, background: stage.bg_color || '#F0E0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, position: 'relative' }}>
                      <span>{stage.emoji}</span>
                      {stage.tag && (
                        <div style={{ position: 'absolute', top: 14, right: 14, background: stage.tag_color || 'var(--orange)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: '50px' }}>
                          {stage.tag}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '24px' }}>
                      <div style={{ fontFamily: 'var(--font-hero)', fontSize: 22, fontWeight: 900, color: 'var(--brown)', marginBottom: 6 }}>{stage.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', marginBottom: 10 }}>{stage.age_range}</div>
                      <p style={{ fontSize: 13, color: '#7A7068', lineHeight: 1.6, marginBottom: 20 }}>{stage.description}</p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--orange)', color: 'white', padding: '10px 20px', borderRadius: '50px', fontSize: 13, fontWeight: 700 }}>
                        See Menu →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* ══ HOW IT WORKS ══ */}
        <section id="how" className="section-pad" style={{ background: 'var(--brown)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 12 }}>
                {c('how_title', '3 steps, then we handle it')}
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '0 auto' }}>
                Three steps to peace of mind — and a well-fed baby.
              </p>
            </div>

            <div className="steps-grid">
              {howSteps.map((step, i) => (
                <div key={step.id} className={`step-card reveal delay-${i}`}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{step.icon}</div>
                  <div style={{ fontFamily: 'var(--font-hero)', fontSize: 13, fontWeight: 800, color: 'var(--orange-light)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Step {step.number}
                  </div>
                  <div style={{ fontFamily: 'var(--font-hero)', fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 10 }}>{step.title}</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ══ WHY NINOZ ══ */}
        <section id="why" className="section-pad" style={{ background: 'var(--cream)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', background: 'rgba(200,75,15,0.08)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: 16 }}>
                Why Ninoz
              </div>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: 'var(--brown)', lineHeight: 1.1 }}>
                {c('why_title', 'Food you can trust')}
              </h2>
            </div>

            <div className="why-grid reveal">
              {/* Left: image + floating pills */}
              <div style={{ position: 'relative' }}>
                <div className="why-img">
                  🍱
                </div>
                <div className="why-pill-1">
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>100% Organic</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginTop: 2 }}>No preservatives ever</div>
                </div>
                <div className="why-pill-2">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4A7C59', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pediatrician</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginTop: 2 }}>Approved recipes</div>
                </div>
              </div>

              {/* Right: why points */}
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 48 }}>
                  {whyPoints.map(point => (
                    <div key={point.id} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: point.icon_bg || '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        {point.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-hero)', fontSize: 17, fontWeight: 800, color: 'var(--brown)', marginBottom: 4 }}>{point.title}</div>
                        <p style={{ fontSize: 14, color: '#7A7068', lineHeight: 1.65 }}>{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── INGREDIENTS ROW ── */}
                {ingredients.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-hero)', fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginBottom: 16 }}>
                      Only Real Ingredients
                    </div>
                    <IngredientsRow ingredients={ingredients} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>


        {/* ══ TESTIMONIALS ══ */}
        <section id="testimonials" className="section-pad" style={{ background: 'white' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', background: 'rgba(200,75,15,0.08)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: 16 }}>
                Reviews
              </div>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: 'var(--brown)', lineHeight: 1.1 }}>
                {c('testi_title', 'What mums say')}
              </h2>
            </div>

            <div className="testi-grid reveal delay-1">
              {testimonials.map(t => (
                <div key={t.id} className="testi-card">
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: 14, color: s <= (t.rating || 5) ? '#FFB347' : '#E8D5C4' }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: '#5A5048', lineHeight: 1.75, marginBottom: 20 }}>"{t.review}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.avatar_bg || '#FFDDD2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: t.avatar_color || '#993D20' }}>
                      {t.avatar_text || t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brown)' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#C9A98A' }}>{t.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ══ BLOG ══ */}
        {blogPosts.length > 0 && (
          <section id="blog" className="section-pad" style={{ background: 'var(--cream)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
                <div style={{ display: 'inline-block', background: 'rgba(200,75,15,0.08)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: 16 }}>
                  Blog
                </div>
                <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: 'var(--brown)', lineHeight: 1.1, marginBottom: 12 }}>
                  {c('blog_title', 'Learn & grow together')}
                </h2>
                <p style={{ fontSize: 16, color: '#7A7068' }}>{c('blog_subtitle', 'Tips from nutritionists and fellow mums.')}</p>
              </div>

              <div className="blog-grid reveal delay-1">
                {blogPosts.slice(0, 3).map(post => (
                  <a key={post.id} href="#" className="blog-card">
                    <div style={{ height: 180, background: '#F0E8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
                      {post.image_url ? (
                        <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{post.emoji || '📖'}</span>
                      )}
                    </div>
                    <div style={{ padding: '20px 22px 24px' }}>
                      <div style={{ display: 'inline-block', background: 'rgba(200,75,15,0.08)', color: 'var(--orange)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: '50px', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {post.tag}
                      </div>
                      <div style={{ fontFamily: 'var(--font-hero)', fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginBottom: 8, lineHeight: 1.3 }}>{post.title}</div>
                      <p style={{ fontSize: 13, color: '#7A7068', lineHeight: 1.65 }}>{post.excerpt}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* ══ FAQ ══ */}
        <section id="faq" className="section-pad" style={{ background: '#EDF2EC' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', background: 'rgba(74,124,89,0.12)', color: '#4A7C59', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: 16 }}>
                FAQ
              </div>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: 'var(--brown)', lineHeight: 1.1 }}>
                {c('faq_title', 'Common questions')}
              </h2>
            </div>

            <div className="reveal" style={{ maxWidth: 720, margin: '0 auto' }}>
              {faqItems.map(item => (
                <div key={item.id} className="faq-item">
                  <button className="faq-question" onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}>
                    <span>{item.question}</span>
                    <svg className={`faq-chevron ${openFaq === item.id ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className={`faq-answer ${openFaq === item.id ? 'open' : ''}`}>
                    <p style={{ fontSize: 14, color: '#7A7068', lineHeight: 1.75 }}>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ══ CONTACT ══ */}
        <section id="contact" className="section-pad" style={{ background: 'var(--brown)' }}>
          <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
            <div className="reveal">
              <div style={{ display: 'inline-block', background: 'rgba(232,131,74,0.12)', color: '#E8834A', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: 16 }}>
                Get In Touch
              </div>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: 'clamp(28px,4vw,40px)', color: 'white', fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
                {c('contact_title', 'We\'d love to hear from you')}
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 44 }}>
                {c('contact_subtitle', 'Questions, custom plans, or allergies — reach us directly.')}
              </p>
            </div>

            <div className="contact-grid reveal delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <a href="https://wa.me/966XXXXXXXXX" target="_blank" rel="noreferrer" className="contact-card cc-wa">
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📱</div>
                <div style={{ fontFamily: 'var(--font-hero)', fontSize: 16, fontWeight: 800, color: 'white' }}>WhatsApp</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Quick replies, Mon–Sat</div>
              </a>
              <a href="https://instagram.com/ninoz.sa" target="_blank" rel="noreferrer" className="contact-card cc-ig">
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(225,48,108,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📸</div>
                <div style={{ fontFamily: 'var(--font-hero)', fontSize: 16, fontWeight: 800, color: 'white' }}>Instagram</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>@ninoz.sa</div>
              </a>
            </div>
          </div>
        </section>


        {/* ══ FOOTER ══ */}
        <Footer footerLinks={footerLinks} />

      </main>

      {/* ══ SUBSCRIPTION POPUP ══ */}
      {showSubPopup && (
        <SubscriptionPopup onClose={() => setShowSubPopup(false)} />
      )}
    </>
  )
}
