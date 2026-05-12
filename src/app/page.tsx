'use client'

import { useEffect, useRef } from 'react'

export default function Home() {

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Smooth scroll
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        /* Reveal animation */
        .reveal {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal.visible { opacity: 1; transform: none; }
        .reveal.delay-1 { transition-delay: 0.1s; }
        .reveal.delay-2 { transition-delay: 0.2s; }
        .reveal.delay-3 { transition-delay: 0.3s; }
        .reveal.delay-4 { transition-delay: 0.4s; }

        /* Hover lift */
        .lift {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s;
          cursor: pointer;
        }
        .lift:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,0,0,0.1); }

        /* Button hover */
        .btn-primary {
          background: var(--color-dark); color: white; border: none;
          padding: 15px 32px; border-radius: 50px; font-size: 15px;
          font-weight: 500; cursor: pointer;
          box-shadow: 0 6px 24px rgba(26,17,8,0.2);
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover {
          background: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255,107,53,0.35);
        }
        .btn-outline {
          padding: 15px 32px; border-radius: 50px;
          background: transparent; color: var(--color-dark);
          border: 1.5px solid rgba(26,17,8,0.2);
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: border-color 0.2s, color 0.2s, transform 0.2s;
        }
        .btn-outline:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          transform: translateY(-2px);
        }

        /* Nav link hover */
        .nav-link {
          font-size: 14px; color: var(--color-brown-mid);
          text-decoration: none; font-weight: 500;
          position: relative; padding-bottom: 2px;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 1.5px; background: var(--color-primary);
          transition: width 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .nav-link:hover { color: var(--color-dark); }
        .nav-link:hover::after { width: 100%; }

        /* Floating card animation */
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .float { animation: float 5s ease-in-out infinite; }

        /* Marquee */
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 20s linear infinite; }

        /* Step card hover */
        .step-card {
          transition: background 0.3s, border-color 0.3s, transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .step-card:hover {
          background: rgba(255,107,53,0.08) !important;
          border-color: rgba(255,107,53,0.3) !important;
          transform: translateY(-4px);
        }

        /* Why item hover */
        .why-item {
          transition: background 0.25s, transform 0.25s;
          border-radius: 18px; padding: 20px;
        }
        .why-item:hover { background: #FFF0EA; transform: translateX(6px); }

        /* Testi card */
        .testi-card { transition: box-shadow 0.3s, transform 0.3s; }
        .testi-card:hover { box-shadow: 0 16px 50px rgba(0,0,0,0.1); transform: translateY(-4px); }

        /* Contact card */
        .contact-card {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s;
          text-decoration: none; display: flex; flex-direction: column;
          align-items: center; gap: 14px; text-align: center;
          border-radius: 24px; padding: 32px 28px; border: 1.5px solid transparent;
          cursor: pointer;
        }
        .cc-wa { background: #1A2E22; }
        .cc-wa:hover { border-color: #25D366; transform: translateY(-4px); }
        .cc-ig { background: #2A1A2A; }
        .cc-ig:hover { border-color: #E1306C; transform: translateY(-4px); }

        /* Image placeholder */
        .img-slot {
          width: 100%; height: 100%; object-fit: cover;
          border-radius: inherit;
        }
      `}</style>

      <main style={{ background: 'var(--color-cream)' }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(255,249,245,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(196,138,103,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6%', height: '70px',
        }}>
          <div style={{ fontFamily: 'var(--font-logo)', fontSize: '36px', fontWeight: 400, lineHeight: 1 }}>
            Ninoz<span style={{ color: 'var(--color-primary)' }}>.</span>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { label: 'Meal Plans', id: 'offers' },
              { label: 'How It Works', id: 'how' },
              { label: 'Why Ninoz', id: 'why' },
              { label: 'Testimonials', id: 'testimonials' },
              { label: 'Contact', id: 'contact' },
            ].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {item.label}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => scrollTo('offers')}>
            Get Started
          </button>
        </nav>

        {/* ── HERO ── */}
        <section style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          padding: '100px 6% 60px',
          background: 'linear-gradient(135deg, var(--color-cream) 0%, var(--color-peach) 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', width: '600px', height: '600px',
            background: 'var(--color-sage)', borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
            top: '-150px', right: '-150px', opacity: 0.2, filter: 'blur(80px)',
          }} />
          <div style={{
            position: 'absolute', width: '400px', height: '400px',
            background: 'var(--color-primary)', borderRadius: '40% 60% 30% 70%',
            bottom: '-100px', left: '-100px', opacity: 0.1, filter: 'blur(80px)',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: '60px',
            maxWidth: '1100px', width: '100%', margin: '0 auto',
            zIndex: 1, position: 'relative',
          }}>
            <div style={{ flex: 1 }}>
              <div className="reveal" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--color-sage)', color: '#3a5c37',
                borderRadius: '50px', padding: '7px 16px',
                fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: '28px',
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6E9269', animation: 'pulse 2s infinite' }} />
                Fresh · Organic · Daily Delivery in Riyadh
              </div>

              <h1 className="reveal delay-1" style={{
                fontFamily: 'var(--font-hero)', fontSize: '52px',
                fontWeight: 400, lineHeight: 1.1, marginBottom: '24px',
              }}>
                Fresh food<br />for your<br />
                <span style={{ color: 'var(--color-primary)' }}>little one.</span>
              </h1>

              <p className="reveal delay-2" style={{
                fontFamily: 'var(--font-desc)', fontSize: '22px', lineHeight: 1.6,
                color: 'var(--color-brown-mid)', maxWidth: '440px', marginBottom: '40px',
              }}>
                Daily-prepared meals for babies aged 3–12 months — delivered every morning.
              </p>

              <div className="reveal delay-3" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '44px' }}>
                <button className="btn-primary" onClick={() => scrollTo('offers')}>Choose Your Plan →</button>
                <button className="btn-outline" onClick={() => scrollTo('how')}>How It Works</button>
              </div>

              <div className="reveal delay-4" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--color-brown-mid)' }}>
                <div style={{ display: 'flex' }}>
                  {['سم', 'نع', 'رب', 'فا'].map((av, i) => (
                    <div key={i} style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--color-sage)', border: '2px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 600, color: '#3a5c37',
                      marginLeft: i === 0 ? 0 : '-8px',
                    }}>{av}</div>
                  ))}
                </div>
                <span><strong style={{ color: 'var(--color-dark)' }}>200+ families</strong> in Riyadh trust Ninoz</span>
              </div>
            </div>

            {/* Hero card */}
            <div className="float" style={{ flexShrink: 0, width: '360px', position: 'relative' }}>
              <div style={{
                background: 'white', borderRadius: '28px', padding: '10px',
                boxShadow: '0 30px 80px rgba(26,17,8,0.12)',
              }}>
                <div style={{
                  position: 'absolute', top: '-12px', right: '20px',
                  background: 'var(--color-sage-dark)', color: 'white',
                  fontSize: '12px', fontWeight: 600, padding: '7px 16px', borderRadius: '50px',
                }}>🌿 Today&apos;s Blend</div>
                <div style={{
                  width: '100%', height: '240px', borderRadius: '20px', overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--color-peach), var(--color-sage))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '64px', marginBottom: '16px', position: 'relative',
                }}>
                  {/* Replace emoji with: <img className="img-slot" src="/meal-1.jpg" alt="Today's meal" /> */}
                  🥕🍠
                </div>
                <div style={{ padding: '8px 12px 16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-brown-mid)', marginBottom: '6px' }}>
                    Stage 1 · 3–6 months
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
                    Carrot & Sweet Potato Purée
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-brown-mid)' }}>
                    Vitamin A · Iron-rich · Organic
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div style={{ background: 'var(--color-dark)', overflow: 'hidden', padding: '18px 0' }}>
          <div className="marquee-track" style={{ display: 'flex', gap: '60px', width: 'max-content' }}>
            {[
              '🥕 100% Organic', '🍼 Ages 3–12 Months', '🚚 Daily Delivery',
              '👩‍⚕️ Nutritionist Designed', '🏅 Certified Kitchen', '⚡ Pause Anytime',
              '🌿 No Preservatives', '❤️ Riyadh\'s Favourite',
              '🥕 100% Organic', '🍼 Ages 3–12 Months', '🚚 Daily Delivery',
              '👩‍⚕️ Nutritionist Designed', '🏅 Certified Kitchen', '⚡ Pause Anytime',
              '🌿 No Preservatives', '❤️ Riyadh\'s Favourite',
            ].map((item, i) => (
              <div key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{
          background: 'var(--color-dark)', padding: '32px 6%',
          display: 'flex', justifyContent: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[
            { num: '200+', label: 'Happy Families' },
            { num: '3–12', label: 'Months Covered' },
            { num: '100%', label: 'Fresh Daily' },
            { num: '0', label: 'Preservatives' },
          ].map((stat, i, arr) => (
            <div key={i} className="reveal" style={{
              textAlign: 'center', padding: '0 50px',
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-hero)', fontSize: '36px', color: 'var(--color-primary)' }}>
                {stat.num}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── OFFERS ── */}
        <section id="offers" style={{ padding: '100px 6%' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block', background: '#FFF0EA', color: 'var(--color-primary)',
              fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
            }}>What We Offer</div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '42px', lineHeight: 1.1 }}>
              A plan for every little stage
            </h2>
            <p style={{ fontFamily: 'var(--font-desc)', fontSize: '18px', color: 'var(--color-brown-mid)', marginTop: '14px' }}>
              Each plan is built around your baby&apos;s exact age and nutritional needs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
            {[
              {
                emoji: '🍼', tag: 'Stage 1 · 3–6 months', title: 'Baby Blends',
                desc: 'Smooth, silky purées for babies aged 3–6 months. Gentle on tiny tummies, packed with essential vitamins.',
                bg: 'linear-gradient(145deg, #FFF0EA, #FFDDD2)', img: 'meal-1.jpg', delay: 'delay-1',
              },
              {
                emoji: '🥄', tag: 'Stage 2 · 6–12 months', title: 'Textured Meals',
                desc: 'Graduated textures and bolder flavors. Iron, protein, and essential nutrients as they explore real food.',
                bg: 'linear-gradient(145deg, #E8F5EE, #D4EDD9)', img: 'meal-2.jpg', delay: 'delay-2',
              },
            ].map((card) => (
              <div key={card.title} className={`reveal lift ${card.delay}`} style={{
                borderRadius: '28px', padding: '0', overflow: 'hidden',
                background: card.bg,
              }}>
                {/* Image */}
                <div style={{
                  width: '100%', height: '220px', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '72px', background: 'rgba(255,255,255,0.3)',
                }}>
                  {/* Replace with: <img className="img-slot" src={`/${card.img}`} alt={card.title} /> */}
                  {card.emoji}
                </div>
                <div style={{ padding: '28px 32px 32px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-brown-mid)', marginBottom: '8px' }}>
                    {card.tag}
                  </div>
                  <div style={{ fontFamily: 'var(--font-hero)', fontSize: '28px', marginBottom: '10px' }}>
                    {card.title}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--color-brown-mid)', lineHeight: 1.65, marginBottom: '24px' }}>
                    {card.desc}
                  </p>
                  <button className="btn-primary" onClick={() => scrollTo('contact')} style={{ fontSize: '13px', padding: '10px 22px' }}>
                    Get This Plan →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" style={{ background: 'var(--color-dark)', padding: '100px 6%', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-200px', right: '-200px',
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'rgba(255,107,53,0.06)', pointerEvents: 'none',
          }} />
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(255,107,53,0.15)', color: 'var(--color-primary)',
              fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
            }}>3 Simple Steps</div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '42px', color: 'white', lineHeight: 1.1 }}>
              How it works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto 52px' }}>
            {[
              { num: '01', icon: '📋', title: 'Pick Your Plan', desc: 'Choose your baby\'s stage, tell us about allergies, and select weekly or monthly. Takes 3 minutes.', delay: 'delay-1' },
              { num: '02', icon: '✏️', title: 'Personalise It', desc: 'Our nutritionist builds a full meal plan. Adjust any meal to fit your baby\'s taste anytime.', delay: 'delay-2' },
              { num: '03', icon: '🚚', title: 'Delivered Daily', desc: 'Fresh meals at your door every morning. Pause, skip, or modify with one tap — no commitments.', delay: 'delay-3' },
            ].map((step) => (
              <div key={step.num} className={`reveal step-card ${step.delay}`} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px', padding: '36px 28px',
              }}>
                <div style={{ fontFamily: 'var(--font-hero)', fontSize: '52px', color: 'rgba(255,255,255,0.06)', lineHeight: 1, marginBottom: '16px' }}>
                  {step.num}
                </div>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'rgba(255,107,53,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', marginBottom: '20px',
                }}>{step.icon}</div>
                <div style={{ fontFamily: 'var(--font-hero)', fontSize: '20px', color: 'white', marginBottom: '12px' }}>
                  {step.title}
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn-primary" onClick={() => scrollTo('offers')}>Start Your Journey →</button>
          </div>
        </section>

        {/* ── WHY NINOZ ── */}
        <section id="why" style={{ padding: '100px 6%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', maxWidth: '1100px', margin: '0 auto' }}>
            <div className="reveal" style={{
              height: '480px', borderRadius: '28px', overflow: 'hidden',
              background: 'linear-gradient(145deg, var(--color-peach), var(--color-sage))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '100px', position: 'relative',
            }}>
              {/* Replace with: <img className="img-slot" src="/kitchen.jpg" alt="Our Kitchen" /> */}
              🌿
              <div style={{
                position: 'absolute', bottom: '-20px', left: '-20px',
                background: 'white', borderRadius: '20px', padding: '16px 20px',
                boxShadow: '0 12px 40px rgba(26,17,8,0.1)',
              }}>
                <div style={{ fontFamily: 'var(--font-hero)', fontSize: '28px', color: 'var(--color-dark)' }}>200+</div>
                <div style={{ fontSize: '12px', color: 'var(--color-brown-mid)', marginTop: '2px' }}>Families Served</div>
              </div>
              <div style={{
                position: 'absolute', top: '30px', right: '-24px',
                background: 'white', borderRadius: '20px', padding: '16px 20px',
                boxShadow: '0 12px 40px rgba(26,17,8,0.1)',
              }}>
                <div style={{ fontFamily: 'var(--font-hero)', fontSize: '28px', color: 'var(--color-dark)' }}>0</div>
                <div style={{ fontSize: '12px', color: 'var(--color-brown-mid)', marginTop: '2px' }}>Preservatives</div>
              </div>
            </div>

            <div className="reveal delay-1">
              <div style={{
                display: 'inline-block', background: '#FFF0EA', color: 'var(--color-primary)',
                fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
              }}>Why Ninoz</div>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '42px', lineHeight: 1.1, marginBottom: '32px' }}>
                Food you can trust
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: '🏅', bg: '#FFF0EA', title: 'Certified Kitchen', desc: 'Our kitchen meets Saudi food safety standards. Every meal prepared same day it\'s delivered.' },
                  { icon: '👩‍⚕️', bg: '#E8F5EE', title: 'Pediatric Nutritionist-Approved', desc: 'Every recipe reviewed by a certified pediatric nutritionist for each age and stage.' },
                  { icon: '🌱', bg: '#FEF3E2', title: '100% Organic, Always', desc: 'No preservatives, no artificial anything. Just real, wholesome ingredients sourced fresh daily.' },
                  { icon: '⚡', bg: '#F0ECF9', title: 'Made for Working Mums', desc: 'We hand back 2–3 hours of your day, every day.' },
                ].map((item) => (
                  <div key={item.title} className="why-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                      background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{item.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-brown-mid)', lineHeight: 1.65 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" style={{ background: '#EAF3E8', padding: '100px 6%' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(45,106,79,0.15)', color: 'var(--color-sage-dark)',
              fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
            }}>Testimonials</div>
            <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '42px', lineHeight: 1.1 }}>
              What mums say
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
            {[
              { av: 'سم', name: 'Sara Al-Mansouri', text: '"Ninoz has been a lifesaver. As a working mum I used to spend hours prepping on weekends. Now my baby eats fresh nutritious meals daily."', color: '#FFDDD2', tc: '#993D20', delay: 'delay-1' },
              { av: 'نع', name: 'Noura Al-Ghamdi', text: '"I was skeptical — fresh food delivered daily in Riyadh? But it works perfectly. My daughter loves every single meal."', color: '#D4EDD9', tc: '#2D6A4F', delay: 'delay-2' },
              { av: 'رب', name: 'Reem Al-Bakr', text: '"The ability to customize based on my son\'s allergies was the biggest selling point. I can\'t imagine going back to making it myself."', color: '#DDEEFF', tc: '#1A5EA8', delay: 'delay-3' },
            ].map((t) => (
              <div key={t.name} className={`reveal testi-card ${t.delay}`} style={{
                background: 'white', borderRadius: '24px', padding: '28px 24px',
              }}>
                <div style={{ color: '#F59E0B', fontSize: '16px', letterSpacing: '3px', marginBottom: '14px' }}>★★★★★</div>
                <p style={{ fontSize: '14px', color: 'var(--color-brown-mid)', lineHeight: 1.75, marginBottom: '20px', fontStyle: 'italic' }}>
                  {t.text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: t.color, color: t.tc,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 600,
                  }}>{t.av}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-brown-mid)' }}>Happy Mum · Riyadh</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" style={{ background: 'var(--color-dark)', padding: '100px 6%' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <div className="reveal">
              <div style={{
                display: 'inline-block', background: 'rgba(255,107,53,0.15)', color: 'var(--color-primary)',
                fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
              }}>Get In Touch</div>
              <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '42px', color: 'white', lineHeight: 1.1, marginBottom: '14px' }}>
                We&apos;d love to hear from you
              </h2>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '48px' }}>
                Questions, custom plans, allergies — reach us directly.
              </p>
            </div>

            <div className="reveal delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* WhatsApp */}
              <a href="https://wa.me/966XXXXXXXXX" target="_blank" className="contact-card cc-wa">
                <div style={{
                  width: '60px', height: '60px', borderRadius: '18px',
                  background: 'rgba(37,211,102,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>WhatsApp Us</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Fastest response</div>
                <div style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '50px' }}>
                  Message us →
                </div>
              </a>

              {/* Instagram */}
              <a href="https://instagram.com/ninoz.sa" target="_blank" className="contact-card cc-ig">
                <div style={{
                  width: '60px', height: '60px', borderRadius: '18px',
                  background: 'rgba(225,48,108,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="url(#ig)">
                    <defs>
                      <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f09433"/>
                        <stop offset="50%" stopColor="#dc2743"/>
                        <stop offset="100%" stopColor="#bc1888"/>
                      </linearGradient>
                    </defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>Follow on Instagram</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Daily content & behind the scenes</div>
                <div style={{ background: 'rgba(225,48,108,0.15)', color: '#E1306C', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '50px' }}>
                  @ninoz.sa →
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#0E0904', padding: '50px 6% 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '36px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '32px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-logo)', fontSize: '28px', color: 'white' }}>
                Ninoz<span style={{ color: 'var(--color-primary)' }}>.</span>
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', maxWidth: '220px', lineHeight: 1.6 }}>
                Fresh, organic meals for babies 3–12 months. Delivered daily across Riyadh.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
              {[
                { title: 'Company', links: ['Our Story', 'Our Kitchen', 'Careers'] },
                { title: 'Meals', links: ['Baby Blends', 'Textured Meals', 'Gift a Plan', 'FAQs'] },
                { title: 'Contact', links: ['WhatsApp', 'Instagram', 'Email'] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', marginBottom: '16px' }}>
                    {col.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {col.links.map(link => (
                      <a key={link} href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.2)', flexWrap: 'wrap', gap: '8px' }}>
            <span>© 2025 Ninoz. All rights reserved.</span>
            <span>Privacy Policy · Terms of Service</span>
          </div>
        </footer>

      </main>
    </>
  )
}
