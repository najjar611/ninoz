'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SubscriptionPopup from '@/components/SubscriptionPopup'

type Stage = { id: string; name: string; age_range: string; description: string; emoji: string; card_bg: string; image_url: string | null; tag: string | null; tag_color: string }
type Meal = { id: string; name: string; description: string; meal_type: string; image_url: string | null; allergens: string; weight_g: string; protein_g: string; carbs_g: string; fiber_g: string }
type HowStep = { id: string; icon_url: string | null; icon_bg: string; description: string }
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

const g = (c: Record<string, string>, k: string, f = '') => c[k] || f

export default function HomeClient(p: Props) {
  const { stages, meals, content, howSteps, whyPoints, ingredients, footerLinks, logo, paymentCycles, faqs, tickerItems } = p

  const [popup, setPopup] = useState(false)
  const [stageI, setStageI] = useState(0)
  const [tab, setTab] = useState('breakfast')
  const [mealI, setMealI] = useState(0)
  const [faq, setFaq] = useState<string | null>(null)
  const [subDone, setSubDone] = useState(false)
  const [subEmail, setSubEmail] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const stTx = useRef<number | null>(null)
  const mlTx = useRef<number | null>(null)
  const mlTy = useRef<number | null>(null)

  const font = g(content, 'site_font', 'Nunito')
  const animated = g(content, 'ticker_animated', 'false') === 'true'
  const heroImg = g(content, 'hero_image_url', '')
  const whyImg = g(content, 'why_image_url', '')

  useEffect(() => {
    const lnk = document.createElement('link')
    lnk.rel = 'stylesheet'
    lnk.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap`
    document.head.appendChild(lnk)
    document.body.style.fontFamily = `'${font}', sans-serif`
  }, [font])

  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).style.opacity = '1', (e.target as HTMLElement).style.transform = 'translateY(0)' }), { threshold: 0.1 })
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => { setMealI(0) }, [tab])

  const mls = meals.filter(m => m.meal_type === tab)
  const tot = mls.length
  const getM = (o: number) => tot === 0 ? null : mls[((mealI + o) % tot + tot) % tot]
  const prev = getM(-1), curr = getM(0), next = getM(1)

  const nextM = () => { if (tot > 1) setMealI(i => (i + 1) % tot) }
  const prevM = () => { if (tot > 1) setMealI(i => (i - 1 + tot) % tot) }

  const reveal = (delay = 0): React.CSSProperties => ({
    opacity: 0, transform: 'translateY(20px)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`
  })

  const tItems = tickerItems.length > 0 ? tickerItems : [
    { id: '1', text: 'Fresh Ingredients', highlight: '100%' },
    { id: '2', text: 'Sugar Added', highlight: '0%' },
    { id: '3', text: 'Preservatives', highlight: '0%' },
    { id: '4', text: 'Frozen Food', highlight: '0%' },
  ]

  // Colors — warm orange gradient palette
  const O = '#C84B0F'
  const O2 = '#D96020'
  const O3 = '#E8834A'
  const CR = '#FAF5EE'
  const CR2 = '#F5EAD8'
  const CR3 = '#FDEEDE'
  const BR = '#2C1A0E'
  const MU = '#8A7A6E'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; font-size: 18px; }
        body { font-family: '${font}', sans-serif; overflow-x: hidden; background: ${CR}; color: ${BR}; }
        [data-reveal] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        img { max-width: 100%; display: block; }
        button { cursor: pointer; font-family: inherit; }
        a { text-decoration: none; }

        /* BTN */
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border-radius: 50px; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-primary { background: ${O}; color: white; }
        .btn-primary:hover { background: #A33A0A; transform: translateY(-1px); }
        .btn-outline { background: transparent; color: ${BR}; border: 2px solid rgba(44,26,14,0.2); }
        .btn-outline:hover { border-color: ${O}; color: ${O}; }
        .btn-white { background: white; color: ${O}; }
        .btn-white:hover { background: ${CR2}; }

        /* NAV */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: rgba(250,245,238,0.97); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(200,75,15,0.1); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 0 5%; height: 72px; max-width: 1400px; margin: 0 auto; }
        .nav-logo { font-size: 1.6rem; font-weight: 900; color: ${O}; }
        .nav-logo img { height: 38px; object-fit: contain; }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-link { font-size: 0.9rem; font-weight: 600; color: ${BR}; opacity: 0.55; background: none; border: none; transition: opacity 0.2s; }
        .nav-link:hover { opacity: 1; }
        .nav-ham { display: none; background: none; border: none; font-size: 1.5rem; color: ${BR}; }
        .nav-mobile { display: none; flex-direction: column; gap: 0; background: white; border-top: 1px solid rgba(200,75,15,0.1); }
        .nav-mobile.open { display: flex; }
        .nav-mobile a, .nav-mobile button { padding: 1rem 5%; font-size: 1rem; font-weight: 600; color: ${BR}; border: none; background: none; text-align: left; border-bottom: 1px solid rgba(44,26,14,0.06); }

        /* HERO */
        .hero { min-height: 100vh; background: linear-gradient(160deg, white 0%, ${CR} 60%, ${CR2} 100%); display: flex; align-items: center; padding: 90px 5% 60px; }
        .hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; max-width: 1300px; width: 100%; margin: 0 auto; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: ${CR3}; color: ${O}; font-size: 0.7rem; font-weight: 700; padding: 8px 18px; border-radius: 50px; margin-bottom: 1.5rem; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid rgba(200,75,15,0.2); }
        .hero-h1 { font-size: clamp(2.8rem, 5vw, 5rem); font-weight: 900; color: ${BR}; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 1.2rem; }
        .hero-h1 span { color: ${O}; }
        .hero-desc { font-size: 1.05rem; color: ${MU}; line-height: 1.8; max-width: 480px; margin-bottom: 1.5rem; font-weight: 500; }
        .hero-trust { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.8rem; }
        .hero-ti { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: ${MU}; font-weight: 600; }
        .hero-ti::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: ${O}; flex-shrink: 0; }
        .hero-btns { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .hero-proof { display: flex; align-items: center; gap: 12px; }
        .hero-avs { display: flex; }
        .hero-av { width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; margin-left: -10px; }
        .hero-av:first-child { margin-left: 0; }
        .hero-img { position: relative; }
        .hero-photo { width: 100%; aspect-ratio: 3/4; border-radius: 28px; overflow: hidden; background: ${CR2}; }
        .hero-photo img { width: 100%; height: 100%; object-fit: cover; }
        .hero-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 7rem; background: linear-gradient(145deg, ${CR2}, #E8D0B0); }
        .hero-pill { position: absolute; background: white; border-radius: 16px; padding: 12px 18px; box-shadow: 0 8px 32px rgba(44,26,14,0.12); border: 1px solid rgba(200,75,15,0.1); }
        .hero-pill-1 { bottom: 2rem; left: -1.5rem; }
        .hero-pill-2 { top: 2rem; right: -1.5rem; }
        .pill-label { font-size: 0.6rem; font-weight: 700; color: ${MU}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
        .pill-val { font-size: 0.9rem; font-weight: 800; color: ${BR}; }

        /* TICKER */
        .ticker { background: ${O}; padding: 14px 0; overflow: hidden; }
        .ticker-track { display: flex; white-space: nowrap; ${animated ? 'animation: tick 30s linear infinite;' : ''} }
        .ticker-item { font-size: 0.85rem; font-weight: 700; color: white; padding: 0 2.5rem; }
        .ticker-hi { color: rgba(255,255,255,0.6); margin-right: 5px; }
        @keyframes tick { from { transform: translateX(0) } to { transform: translateX(-50%) } }

        /* STAGES */
        .stages { background: ${CR}; padding: 6rem 5%; overflow: hidden; }
        .stages-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 3rem; gap: 1.5rem; flex-wrap: wrap; }
        .sec-lbl { font-size: 0.7rem; font-weight: 700; color: ${O}; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
        .sec-title { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 900; color: ${BR}; line-height: 1.15; }
        .sec-title span { color: ${O}; }
        .stages-wrap { position: relative; overflow: hidden; touch-action: pan-y; }
        .stages-track { display: flex; transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .stage-card { min-width: clamp(280px, 33vw, 360px); margin-right: 1.5rem; border-radius: 24px; overflow: hidden; flex-shrink: 0; transition: box-shadow 0.3s, transform 0.3s; }
        .stage-card.active { box-shadow: 0 24px 64px rgba(200,75,15,0.2); transform: scale(1.02); }
        .stage-img { width: 100%; height: clamp(200px, 22vw, 280px); display: flex; align-items: center; justify-content: center; font-size: 5rem; position: relative; overflow: hidden; }
        .stage-img img { width: 100%; height: 100%; object-fit: cover; }
        .stage-body { padding: 1.5rem; }
        .stage-name { font-size: 1.4rem; font-weight: 900; color: ${BR}; margin-bottom: 4px; }
        .stage-age { font-size: 0.85rem; font-weight: 700; color: ${O}; margin-bottom: 0.6rem; }
        .stage-desc { font-size: 0.85rem; color: ${MU}; line-height: 1.65; font-weight: 500; }
        .stages-nav { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; }
        .nav-btn { width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid rgba(200,75,15,0.2); background: white; color: ${BR}; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .nav-btn:hover { background: ${O}; color: white; border-color: ${O}; }
        .dots { display: flex; gap: 6px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(200,75,15,0.2); transition: all 0.3s; border: none; padding: 0; }
        .dot.a { background: ${O}; width: 22px; border-radius: 4px; }

        /* HOW */
        .how { background: linear-gradient(180deg, ${CR2} 0%, ${CR3} 100%); padding: 6rem 5%; }
        .how-inner { max-width: 1100px; margin: 0 auto; }
        .how-head { text-align: center; margin-bottom: 4rem; }
        .how-title { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; color: ${BR}; margin-bottom: 0.8rem; }
        .how-sub { font-size: 1.05rem; color: ${MU}; font-weight: 500; }
        .how-steps { display: flex; align-items: flex-start; gap: 0; }
        .how-step { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 1.2rem; }
        .how-line { flex-shrink: 0; width: 48px; padding-top: 4.5rem; }
        .how-line-inner { width: 100%; height: 2px; background: repeating-linear-gradient(to right, rgba(200,75,15,0.3) 0, rgba(200,75,15,0.3) 6px, transparent 6px, transparent 13px); }
        .how-icon { width: clamp(100px, 10vw, 144px); height: clamp(100px, 10vw, 144px); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.2rem; font-size: 2.8rem; overflow: hidden; flex-shrink: 0; }
        .how-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 24px; }
        .how-desc { font-size: 0.9rem; color: ${MU}; line-height: 1.7; font-weight: 500; max-width: 200px; }
        .how-cta { text-align: center; margin-top: 3.5rem; }

        /* MENU */
        .menu-wrap { display: flex; min-height: 700px; }
        .menu-left { width: clamp(280px, 30vw, 380px); background: ${O}; display: flex; flex-direction: column; padding: 2.5rem; position: relative; overflow: hidden; flex-shrink: 0; }
        .menu-left::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: rgba(0,0,0,0.08); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
        .menu-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; position: relative; z-index: 1; }
        .menu-logo { font-size: 1.4rem; font-weight: 900; color: white; }
        .menu-h { flex: 1; position: relative; z-index: 1; }
        .menu-h h2 { font-size: clamp(2rem, 3.5vw, 2.8rem); font-weight: 900; color: white; line-height: 1.2; }
        .menu-tabs { display: flex; gap: 8px; margin-top: auto; padding-top: 1.5rem; position: relative; z-index: 1; }
        .menu-tab { flex: 1; padding: 0.8rem 0.4rem; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.35); background: transparent; color: rgba(255,255,255,0.65); font-size: 0.9rem; font-weight: 700; transition: all 0.2s; text-align: center; }
        .menu-tab.a { background: white; color: ${O}; border-color: white; }
        .menu-tab:hover:not(.a) { background: rgba(255,255,255,0.12); color: white; }

        /* MEAL CAROUSEL — Instagram style */
        .menu-right { flex: 1; background: ${CR}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 0; overflow: hidden; position: relative; min-height: 700px; }
        .menu-bg-circle { position: absolute; width: 480px; height: 480px; border-radius: 50%; background: ${CR2}; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 0; }
        .meal-counter { font-size: 0.75rem; font-weight: 700; color: ${MU}; letter-spacing: 0.08em; margin-bottom: 1rem; position: relative; z-index: 1; }
        .meal-carousel { position: relative; width: 100%; height: 300px; z-index: 1; touch-action: pan-y; user-select: none; flex-shrink: 0; }
        .meal-slot { position: absolute; top: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .meal-slot-prev { left: 0; transform: translateY(-50%) translateX(-15%) scale(0.72); opacity: 0.4; z-index: 2; cursor: pointer; filter: blur(1px); }
        .meal-slot-curr { left: 50%; transform: translateY(-50%) translateX(-50%) scale(1); opacity: 1; z-index: 3; }
        .meal-slot-next { right: 0; transform: translateY(-50%) translateX(15%) scale(0.72); opacity: 0.4; z-index: 2; cursor: pointer; filter: blur(1px); }
        .meal-photo { border-radius: 50%; overflow: hidden; background: ${CR2}; display: flex; align-items: center; justify-content: center; border: 5px solid white; box-shadow: 0 12px 48px rgba(200,75,15,0.15); }
        .meal-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .meal-info { position: relative; z-index: 1; width: 100%; max-width: 420px; text-align: center; padding: 1rem 1.5rem 0; }
        .meal-name { font-size: 1.3rem; font-weight: 900; color: ${O}; margin-bottom: 0.5rem; }
        .meal-desc { font-size: 0.85rem; color: ${MU}; line-height: 1.7; font-weight: 500; margin-bottom: 1rem; }
        .nutr { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 0.8rem; }
        .nutr-box { background: ${O}; border-radius: 10px; padding: 0.7rem 0.3rem; text-align: center; }
        .nutr-val { font-size: 1.05rem; font-weight: 900; color: white; display: block; line-height: 1; margin-bottom: 3px; }
        .nutr-lbl { font-size: 0.55rem; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
        .allergen { display: inline-flex; align-items: center; gap: 7px; background: rgba(200,75,15,0.08); border-radius: 8px; padding: 7px 14px; font-size: 0.8rem; color: ${BR}; font-weight: 600; margin-bottom: 0.8rem; }
        .meal-dots { display: flex; gap: 5px; justify-content: center; margin-top: 0.6rem; }
        .meal-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(200,75,15,0.15); transition: all 0.3s; border: none; padding: 0; cursor: pointer; }
        .meal-dot.a { background: ${O}; width: 20px; border-radius: 3px; }

        /* WHY */
        .why { background: linear-gradient(180deg, ${CR3} 0%, ${CR} 100%); padding: 6rem 5%; }
        .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; max-width: 1300px; margin: 0 auto; }
        .why-title { font-size: clamp(2.8rem, 5.5vw, 5rem); font-weight: 900; line-height: 1.05; margin-bottom: 1.8rem; color: ${BR}; }
        .why-title span { color: ${O}; }
        .why-pts { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .why-pt-t { font-size: 1rem; font-weight: 800; margin-bottom: 3px; }
        .why-pt-d { font-size: 0.85rem; color: ${MU}; line-height: 1.65; font-weight: 500; }
        .ing-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .ing-card { border-radius: 16px; overflow: hidden; background: white; box-shadow: 0 2px 12px rgba(200,75,15,0.08); }
        .ing-img { width: 100%; height: 80px; background: ${CR2}; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
        .ing-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ing-name { font-size: 0.75rem; font-weight: 800; color: ${BR}; padding: 7px 10px 2px; }
        .ing-desc { font-size: 0.65rem; color: ${MU}; padding: 0 10px 8px; line-height: 1.4; }
        .why-photo { width: 100%; aspect-ratio: 3/4; border-radius: 28px; overflow: hidden; background: ${CR2}; display: flex; align-items: center; justify-content: center; font-size: 5rem; }
        .why-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* FAQ */
        .faq { background: ${CR}; padding: 6rem 5%; }
        .faq-inner { max-width: 760px; margin: 0 auto; }
        .faq-head { text-align: center; margin-bottom: 3rem; }
        .faq-item { border-bottom: 1px solid rgba(200,75,15,0.12); }
        .faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1.3rem 0; background: none; border: none; font-size: 1rem; font-weight: 700; color: ${BR}; text-align: left; gap: 1rem; }
        .faq-icon { width: 28px; height: 28px; border-radius: 50%; background: ${CR3}; color: ${O}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; transition: all 0.3s; border: 1px solid rgba(200,75,15,0.2); }
        .faq-icon.open { transform: rotate(45deg); background: ${O}; color: white; }
        .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.4s ease, padding 0.3s; }
        .faq-a.open { max-height: 400px; padding-bottom: 1.2rem; }
        .faq-a p { font-size: 0.9rem; color: ${MU}; line-height: 1.8; font-weight: 500; }

        /* FOOTER */
        .footer-hero { background: linear-gradient(135deg, ${O} 0%, #A33A0A 100%); padding: 4rem 5%; text-align: center; position: relative; overflow: hidden; }
        .footer-toys { position: absolute; inset: 0; pointer-events: none; }
        .toy { position: absolute; font-size: 3.5rem; opacity: 0.1; user-select: none; }
        .footer-word { font-size: clamp(4rem, 12vw, 8rem); font-weight: 900; color: rgba(255,255,255,0.15); line-height: 1; position: relative; z-index: 1; letter-spacing: -0.04em; }
        .footer-cols { background: ${CR}; padding: 3.5rem 5% 2.5rem; display: grid; grid-template-columns: repeat(4,1fr); gap: 2.5rem; border-top: 1px solid rgba(200,75,15,0.1); }
        .footer-col-t { font-size: 0.7rem; font-weight: 800; color: ${O}; margin-bottom: 1rem; display: block; text-transform: uppercase; letter-spacing: 0.08em; }
        .footer-text { font-size: 0.82rem; color: ${MU}; line-height: 1.8; }
        .footer-bul { list-style: none; margin: 0.7rem 0 1rem; }
        .footer-bul li { font-size: 0.82rem; color: ${MU}; padding: 3px 0; display: flex; gap: 8px; line-height: 1.5; }
        .footer-bul li::before { content: '–'; color: ${O}; flex-shrink: 0; }
        .footer-links-l { display: flex; flex-direction: column; gap: 0.7rem; }
        .footer-lnk { font-size: 0.82rem; color: ${MU}; transition: color 0.2s; font-weight: 500; }
        .footer-lnk:hover { color: ${O}; }
        .footer-ci { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 0.8rem; }
        .footer-cic { width: 28px; height: 28px; border-radius: 8px; background: rgba(200,75,15,0.1); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }
        .footer-cit { font-size: 0.82rem; color: ${MU}; line-height: 1.5; }
        .footer-cit a { color: ${O}; font-weight: 600; }
        .sub-inp { width: 100%; padding: 12px 16px; border: 1.5px solid rgba(200,75,15,0.2); border-radius: 10px; font-size: 0.85rem; color: ${BR}; outline: none; box-sizing: border-box; margin-bottom: 8px; background: white; }
        .sub-inp:focus { border-color: ${O}; }
        .footer-bot { background: ${BR}; padding: 1rem 5%; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.8rem; }
        .footer-copy { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
        .footer-bot-links { display: flex; gap: 1.5rem; }
        .footer-bot-links a { font-size: 0.75rem; color: rgba(255,255,255,0.25); transition: color 0.2s; }
        .footer-bot-links a:hover { color: rgba(255,255,255,0.6); }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .footer-cols { grid-template-columns: repeat(2,1fr); }
          .why-grid { grid-template-columns: 1fr; gap: 3rem; }
          .menu-wrap { flex-direction: column; }
          .menu-left { width: 100%; min-height: 50vh; }
          .hero-pill-1, .hero-pill-2 { display: none; }
          .how-steps { flex-direction: column; align-items: center; gap: 2.5rem; }
          .how-line { display: none; }
          .how-step { padding: 0; }
        }
        @media (max-width: 768px) {
          html { font-size: 16px; }
          .nav-links { display: none; }
          .nav-ham { display: flex; }
          .hero-inner { grid-template-columns: 1fr; gap: 2.5rem; }
          .hero-h1 { font-size: 2.5rem; }
          .hero-btns { flex-direction: column; }
          .stages-head { flex-direction: column; gap: 1rem; }
          .ing-grid { grid-template-columns: repeat(2,1fr); }
          .footer-cols { grid-template-columns: 1fr; }
          .nutr { grid-template-columns: repeat(2,1fr); }
          .meal-slot-prev, .meal-slot-next { display: none; }
          .menu-right { min-height: 580px; }
          .meal-carousel { height: 260px; }
        }
        @media (max-width: 480px) {
          html { font-size: 15px; }
          .hero-h1 { font-size: 2.2rem; }
          .why-title { font-size: 2.5rem; }
          .footer-word { font-size: 3.5rem; }
          .stage-card { min-width: 85vw; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            {logo?.url ? <img src={logo.url} alt={logo.alt_text || 'Ninoz'} /> : 'Ninoz'}
          </Link>
          <div className="nav-links">
            {[['How It Works','how'],['Menu','menu'],['Plans','stages'],['FAQ','faq']].map(([l,id]) => (
              <button key={id} className="nav-link" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>{l}</button>
            ))}
          </div>
          <button className="nav-ham" onClick={() => setMenuOpen(o => !o)}>☰</button>
          <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '10px 22px' }} onClick={() => setShowPopup(true)}>
            {g(content, 'nav_cta_text', 'Start Your Plan')}
          </button>
        </div>
        <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
          {[['How It Works','how'],['Menu','menu'],['Plans','stages'],['FAQ','faq']].map(([l,id]) => (
            <button key={id} onClick={() => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }}>{l}</button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge" data-reveal>🌿 {g(content,'hero_badge','Fresh · Organic · Daily in Riyadh')}</div>
            <h1 className="hero-h1" data-reveal style={{ transitionDelay: '100ms' }}>
              {g(content,'hero_headline_1','You Care.')}<br />
              <span>{g(content,'hero_headline_2','We Prepare.')}</span>
            </h1>
            <p className="hero-desc" data-reveal style={{ transitionDelay: '150ms' }}>
              {g(content,'hero_description','Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.')}
            </p>
            <div className="hero-trust" data-reveal style={{ transitionDelay: '200ms' }}>
              {['Fresh Ingredients','No Preservatives','Cooked Daily','Pediatrician Approved'].map(t => (
                <div key={t} className="hero-ti">{t}</div>
              ))}
            </div>
            <div className="hero-btns" data-reveal style={{ transitionDelay: '250ms' }}>
              <button className="btn btn-primary" onClick={() => setShowPopup(true)}>{g(content,'hero_btn_primary','Start Your Plan')}</button>
              <button className="btn btn-outline" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>{g(content,'hero_btn_secondary','Explore Meals')}</button>
            </div>
            <div className="hero-proof" data-reveal style={{ transitionDelay: '300ms' }}>
              <div className="hero-avs">
                {['#FFB347','#E8834A','#C84B0F','#7A7068','#2C1A0E'].map((c,i) => (
                  <div key={i} className="hero-av" style={{ background: c }} />
                ))}
              </div>
              <span style={{ fontSize: '0.82rem', color: MU, fontWeight: 600 }}>{g(content,'hero_social_proof','Trusted by 200+ Riyadh mothers')}</span>
            </div>
          </div>
          <div className="hero-img" data-reveal style={{ transitionDelay: '100ms' }}>
            <div className="hero-photo">
              {heroImg ? <img src={heroImg} alt="Ninoz" /> : <div className="hero-ph">👶</div>}
            </div>
            <div className="hero-pill hero-pill-1">
              <div className="pill-label">Daily Fresh</div>
              <div className="pill-val">Cooked Every Morning</div>
            </div>
            <div className="hero-pill hero-pill-2">
              <div className="pill-label">Nutritionist</div>
              <div className="pill-val">Approved ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-track">
          {(animated ? [0,1] : [0]).map(r =>
            tItems.map((t,i) => (
              <span key={`${r}-${i}`} className="ticker-item">
                <span className="ticker-hi">{t.highlight}</span>{t.text} ·{' '}
              </span>
            ))
          )}
        </div>
      </div>

      {/* STAGES */}
      <section className="stages" id="stages">
        <div>
          <div className="stages-head" data-reveal>
            <div>
              <div className="sec-lbl">Our Plans</div>
              <h2 className="sec-title">
                {g(content,'stages_title','Fresh Meals Built for').replace(g(content,'stages_title_highlight','Their Stage'),'').trim()}{' '}
                <span>{g(content,'stages_title_highlight','Their Stage')}</span>
              </h2>
            </div>
            <button className="btn btn-primary" onClick={() => setShowPopup(true)}>{g(content,'stages_cta','Start Your Plan')}</button>
          </div>
          <div className="stages-wrap" data-reveal
            onTouchStart={e => { stTx.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (!stTx.current) return
              const dx = stTx.current - e.changedTouches[0].clientX
              if (Math.abs(dx) > 40) dx > 0 ? setStageI(i => (i+1)%stages.length) : setStageI(i => (i-1+stages.length)%stages.length)
              stTx.current = null
            }}>
            <div className="stages-track" style={{ transform: `translateX(calc(-${stageI * (clamp(280, 33, 360) + 24)}px))` }}>
              {stages.map((s, idx) => (
                <div key={s.id} className={`stage-card ${idx===stageI?'active':''}`}
                  style={{ background: s.card_bg||CR2, cursor: idx!==stageI?'pointer':'default' }}
                  onClick={() => idx!==stageI && setStageI(idx)}>
                  <div className="stage-img" style={{ background: s.card_bg||CR2 }}>
                    {s.image_url ? <img src={s.image_url} alt={s.name} /> : <span style={{ fontSize: '5rem' }}>{s.emoji}</span>}
                    {s.tag && <div style={{ position:'absolute', top:12, right:12, background:s.tag_color||O, color:'white', fontSize:'0.7rem', fontWeight:700, padding:'4px 12px', borderRadius:50 }}>{s.tag}</div>}
                  </div>
                  <div className="stage-body">
                    <div className="stage-name">{s.name}</div>
                    <div className="stage-age">{s.age_range}</div>
                    <div className="stage-desc">{s.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="stages-nav">
            <button className="nav-btn" onClick={() => setStageI(i => (i-1+stages.length)%stages.length)}>←</button>
            <div className="dots">{stages.map((_,i) => <button key={i} className={`dot ${i===stageI?'a':''}`} onClick={() => setStageI(i)} />)}</div>
            <button className="nav-btn" onClick={() => setStageI(i => (i+1)%stages.length)}>→</button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-inner">
          <div className="how-head" data-reveal>
            <div className="sec-lbl" style={{ color: MU }}>Process</div>
            <h2 className="how-title">{g(content,'how_title','How Ninoz Works')}</h2>
            <p className="how-sub">{g(content,'how_subtitle','Three steps to peace of mind — and a well-fed baby.')}</p>
          </div>
          <div className="how-steps" data-reveal>
            {howSteps.map((step, i) => (
              <>
                <div key={step.id} className="how-step">
                  <div className="how-icon" style={{ background: step.icon_bg||(i===0?CR2:i===1?'#FDE8CC':O) }}>
                    {step.icon_url ? <img src={step.icon_url} alt="" /> : <span>{i===0?'📋':i===1?'👨‍🍳':'🚚'}</span>}
                  </div>
                  <p className="how-desc">{step.description}</p>
                </div>
                {i < howSteps.length-1 && <div key={`c${i}`} className="how-line"><div className="how-line-inner"/></div>}
              </>
            ))}
          </div>
          <div className="how-cta" data-reveal>
            <button className="btn btn-primary" style={{ padding: '14px 48px', fontSize: '1rem' }} onClick={() => setShowPopup(true)}>
              {g(content,'how_cta','Get Started')}
            </button>
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu">
        <div className="menu-wrap">
          <div className="menu-left">
            <div className="menu-top">
              <Link href="/" className="menu-logo">Ninoz</Link>
              <button className="btn btn-white" style={{ fontSize: '0.8rem', padding: '9px 18px' }} onClick={() => setShowPopup(true)}>
                {g(content,'menu_cta','Start your plan')}
              </button>
            </div>
            <div className="menu-h">
              <h2>
                {[g(content,'menu_headline_1','Real Food'),g(content,'menu_headline_2','Real Ingredients'),g(content,'menu_headline_3','Every Single Day')].map((l,i) => (
                  <span key={i} style={{ display:'block' }}>{l}</span>
                ))}
              </h2>
            </div>
            <div className="menu-tabs">
              {(['breakfast','lunch','dinner'] as const).map(t => (
                <button key={t} className={`menu-tab ${tab===t?'a':''}`} onClick={() => setTab(t)}>
                  {g(content,`menu_tab_${t}`,t.charAt(0).toUpperCase()+t.slice(1))}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-right"
            onTouchStart={e => { mlTx.current = e.touches[0].clientX; mlTy.current = e.touches[0].clientY }}
            onTouchEnd={e => {
              if (!mlTx.current) return
              const dx = mlTx.current - e.changedTouches[0].clientX
              const dy = Math.abs((mlTy.current||0) - e.changedTouches[0].clientY)
              if (Math.abs(dx) > 40 && Math.abs(dx) > dy) dx > 0 ? nextM() : prevM()
              mlTx.current = null
            }}>
            <div className="menu-bg-circle"/>

            {tot === 0 ? (
              <div style={{ textAlign:'center', color:MU, position:'relative', zIndex:1, padding:'2rem' }}>
                <div style={{ fontSize:'3.5rem', marginBottom:'0.8rem' }}>🍽️</div>
                <p style={{ fontWeight:600 }}>No meals yet.</p>
                <p style={{ fontSize:'0.85rem', marginTop:'0.4rem' }}>Add meals from the admin portal.</p>
              </div>
            ) : (
              <>
                <div className="meal-counter">{mealI+1} / {tot} meals</div>

                <div className="meal-carousel">
                  {prev && tot > 1 && (
                    <div className="meal-slot meal-slot-prev" onClick={prevM}>
                      <div className="meal-photo" style={{ width:180, height:180, fontSize:'3rem' }}>
                        {prev.image_url ? <img src={prev.image_url} alt="" /> : <span>🍽️</span>}
                      </div>
                    </div>
                  )}
                  {curr && (
                    <div className="meal-slot meal-slot-curr">
                      <div className="meal-photo" style={{ width:250, height:250, fontSize:'4.5rem' }}>
                        {curr.image_url ? <img src={curr.image_url} alt={curr.name} /> : <span>🍽️</span>}
                      </div>
                    </div>
                  )}
                  {next && tot > 1 && (
                    <div className="meal-slot meal-slot-next" onClick={nextM}>
                      <div className="meal-photo" style={{ width:180, height:180, fontSize:'3rem' }}>
                        {next.image_url ? <img src={next.image_url} alt="" /> : <span>🍽️</span>}
                      </div>
                    </div>
                  )}
                </div>

                {curr && (
                  <div className="meal-info">
                    <div className="meal-name">{curr.name}</div>
                    <div className="meal-desc">{curr.description}</div>
                    {(curr.weight_g||curr.protein_g) && (
                      <div className="nutr">
                        {[{v:curr.weight_g,l:'Weight'},{v:curr.protein_g,l:'Protein'},{v:curr.carbs_g,l:'Carbs'},{v:curr.fiber_g,l:'Fiber'}].filter(n=>n.v).map(n=>(
                          <div key={n.l} className="nutr-box"><span className="nutr-val">{n.v}</span><span className="nutr-lbl">{n.l}</span></div>
                        ))}
                      </div>
                    )}
                    {curr.allergens && <div className="allergen">⚠️ {curr.allergens}</div>}
                    <div className="meal-dots">
                      {mls.slice(0,8).map((_,i) => <button key={i} className={`meal-dot ${i===mealI?'a':''}`} onClick={() => setMealI(i)} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="why" id="ingredients">
        <div className="why-grid">
          <div data-reveal>
            <h2 className="why-title">Only <span>Real</span><br/>Ingredients</h2>
            <div className="why-pts">
              {whyPoints.map(pt => (
                <div key={pt.id}>
                  <div className="why-pt-t" style={{ color:pt.title_color||O }}>{pt.title}</div>
                  <div className="why-pt-d">{pt.description}</div>
                </div>
              ))}
            </div>
            {ingredients.length > 0 && (
              <div className="ing-grid">
                {ingredients.slice(0,4).map(ing => (
                  <div key={ing.id} className="ing-card">
                    <div className="ing-img">{ing.image_url ? <img src={ing.image_url} alt={ing.name} /> : <span>🥕</span>}</div>
                    <div className="ing-name">{ing.name}</div>
                    <div className="ing-desc">{ing.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div data-reveal>
            <div className="why-photo">
              {whyImg ? <img src={whyImg} alt="Why Ninoz" /> : <span>👶</span>}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="faq" id="faq">
          <div className="faq-inner">
            <div className="faq-head" data-reveal>
              <div className="sec-lbl">FAQ</div>
              <h2 className="sec-title">{g(content,'faq_title','Common Questions')}</h2>
              <p style={{ fontSize:'1rem', color:MU, marginTop:'0.6rem', fontWeight:500 }}>{g(content,'faq_subtitle','Everything you need to know about Ninoz.')}</p>
            </div>
            <div data-reveal>
              {faqs.map(item => (
                <div key={item.id} className="faq-item">
                  <button className="faq-q" onClick={() => setFaq(faq===item.id?null:item.id)}>
                    <span>{item.question}</span>
                    <div className={`faq-icon ${faq===item.id?'open':''}`}>+</div>
                  </button>
                  <div className={`faq-a ${faq===item.id?'open':''}`}><p>{item.answer}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer>
        <div className="footer-hero">
          <div className="footer-toys">
            {[{t:'10%',l:'4%',e:'🪆'},{t:'60%',l:'2%',e:'🚲'},{t:'15%',l:'18%',e:'🧸'},{t:'10%',r:'18%',e:'🏀'},{t:'65%',r:'15%',e:'🪀'},{t:'12%',r:'4%',e:'🚂'}].map((x,i)=>(
              <span key={i} className="toy" style={{ top:x.t, left:(x as any).l, right:(x as any).r }}>{x.e}</span>
            ))}
          </div>
          <div className="footer-word">Ninoz</div>
        </div>
        <div className="footer-cols">
          <div>
            <span className="footer-col-t">{g(content,'footer_about_title','About Ninoz')}</span>
            <div className="footer-text"><strong style={{ color:BR, display:'block', marginBottom:4, fontWeight:700 }}>Hi. We're Ninoz.</strong>{g(content,'footer_about_text','We cook fresh daily meals for babies and toddlers in Riyadh.')}</div>
            <ul className="footer-bul">
              {["Cooked the morning of delivery","Designed for your baby's stage","Approved by a pediatric nutritionist","Free from salt, sugar and preservatives"].map(b=>(
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="footer-text" style={{ fontStyle:'italic' }}>{g(content,'footer_about_closing',"You handle the love. We handle the food.")}</div>
          </div>
          <div>
            <span className="footer-col-t">{g(content,'footer_links_title','Useful Links')}</span>
            <div className="footer-links-l">{footerLinks.map(l=><a key={l.id} href={l.url} className="footer-lnk">{l.label}</a>)}</div>
          </div>
          <div>
            <span className="footer-col-t">{g(content,'footer_contact_title','Get in Touch')}</span>
            <div className="footer-ci"><div className="footer-cic">☺️</div><div className="footer-cit">{g(content,'footer_contact_tagline',"We'd love to hear from you")}</div></div>
            {g(content,'footer_contact_whatsapp') && <div className="footer-ci"><div className="footer-cic">📱</div><div className="footer-cit"><a href={`https://wa.me/${g(content,'footer_contact_whatsapp')}`}>WhatsApp Us</a></div></div>}
            <div className="footer-ci"><div className="footer-cic">📧</div><div className="footer-cit"><a href={`mailto:${g(content,'footer_contact_email','hello@ninoz.sa')}`}>{g(content,'footer_contact_email','hello@ninoz.sa')}</a></div></div>
          </div>
          <div>
            <span className="footer-col-t">{g(content,'footer_subscribe_title','Subscribe Now')}</span>
            <p className="footer-text" style={{ marginBottom:'0.8rem' }}>Enter your email to start your plan.</p>
            {subDone ? (
              <div style={{ background:'rgba(200,75,15,0.1)', color:O, padding:'12px 16px', borderRadius:10, fontSize:'0.85rem', fontWeight:700 }}>✓ You're on the list!</div>
            ) : (
              <>
                <input className="sub-inp" type="email" placeholder="your@email.com" value={subEmail} onChange={e=>setSubEmail(e.target.value)} />
                <button className="btn btn-primary" style={{ width:'100%', borderRadius:10 }} onClick={() => { if(subEmail.includes('@')){ setSubDone(true); setShowPopup(true) } }}>Start Your Plan →</button>
              </>
            )}
          </div>
        </div>
        <div className="footer-bot">
          <span className="footer-copy">{g(content,'footer_copyright','© 2025 Ninoz. All rights reserved.')}</span>
          <div className="footer-bot-links">{['Terms','Privacy','Allergens'].map(l=><a key={l} href="#">{l}</a>)}</div>
        </div>
      </footer>

      {popup && <SubscriptionPopup stages={stages} paymentCycles={paymentCycles} content={content} onClose={() => setShowPopup(false)} />}
    </>
  )

  function setShowPopup(v: boolean) { setPopup(v) }
  function clamp(min: number, vw: number, max: number) { return Math.min(Math.max(min, window.innerWidth * vw / 100), max) }
}
