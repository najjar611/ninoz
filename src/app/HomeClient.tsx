'use client'

// ══════════════════════════════════════════════════════════
// HomeClient.tsx — v8
// Option B: White hero, cream/white alternating, smooth
// Peeking meal carousel (prev/next visible on sides)
// Smooth looping stage carousel
// Horizontal How It Works
// Static ticker (toggle from admin)
// FAQ section
// Premium typography, easy on the eyes
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SubscriptionPopup from '@/components/SubscriptionPopup'

type Stage = {
  id: string; name: string; age_range: string; description: string
  emoji: string; card_bg: string; image_url: string | null
  tag: string | null; tag_color: string; is_clickable: boolean
}
type Meal = {
  id: string; name: string; description: string; meal_type: string
  image_url: string | null; allergens: string
  weight_g: string; protein_g: string; carbs_g: string; fiber_g: string
}
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

const cv = (content: Record<string, string>, key: string, fallback = '') =>
  content[key] || fallback

export default function HomeClient({
  stages, meals, content, howSteps, whyPoints,
  ingredients, footerLinks, logo, paymentCycles, faqs, tickerItems
}: Props) {
  const [showPopup, setShowPopup] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('breakfast')
  const [mealIndex, setMealIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [mealTransition, setMealTransition] = useState(false)

  const stageTouchStart = useRef<number | null>(null)
  const mealTouchStart = useRef<number | null>(null)
  const mealTouchStartY = useRef<number | null>(null)

  const siteFont = cv(content, 'site_font', 'Nunito')
  const tickerAnimated = cv(content, 'ticker_animated', 'false') === 'true'
  const heroImageUrl = cv(content, 'hero_image_url', '')
  const whyImageUrl = cv(content, 'why_image_url', '')

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${siteFont.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap`
    document.head.appendChild(link)
    document.documentElement.style.setProperty('--nfont', `'${siteFont}', sans-serif`)
  }, [siteFont])

  useEffect(() => {
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('nv') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.nr').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => { setMealIndex(0) }, [activeTab])

  const filteredMeals = meals.filter(m => m.meal_type === activeTab)
  const totalMeals = filteredMeals.length

  function getMeal(offset: number) {
    if (totalMeals === 0) return null
    return filteredMeals[((mealIndex + offset) % totalMeals + totalMeals) % totalMeals]
  }

  function changeMeal(dir: number) {
    if (totalMeals <= 1) return
    setMealTransition(true)
    setTimeout(() => {
      setMealIndex(i => ((i + dir) % totalMeals + totalMeals) % totalMeals)
      setMealTransition(false)
    }, 150)
  }

  // Stage swipe
  function onStageTouchStart(e: React.TouchEvent) { stageTouchStart.current = e.touches[0].clientX }
  function onStageTouchEnd(e: React.TouchEvent) {
    if (stageTouchStart.current === null) return
    const dx = stageTouchStart.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 40) {
      if (dx > 0) setStageIndex(i => (i + 1) % stages.length)
      else setStageIndex(i => (i - 1 + stages.length) % stages.length)
    }
    stageTouchStart.current = null
  }

  // Meal swipe
  function onMealTouchStart(e: React.TouchEvent) {
    mealTouchStart.current = e.touches[0].clientX
    mealTouchStartY.current = e.touches[0].clientY
  }
  function onMealTouchEnd(e: React.TouchEvent) {
    if (mealTouchStart.current === null) return
    const dx = mealTouchStart.current - e.changedTouches[0].clientX
    const dy = Math.abs((mealTouchStartY.current || 0) - e.changedTouches[0].clientY)
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) changeMeal(dx > 0 ? 1 : -1)
    mealTouchStart.current = null
  }

  const prevMeal = getMeal(-1)
  const currMeal = getMeal(0)
  const nextMeal = getMeal(1)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${siteFont.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: var(--nfont, '${siteFont}', sans-serif); overflow-x: hidden; background: white; }
        :root {
          --orange: #C84B0F; --orange-h: #A33A0A; --orange-pale: #FDF0E8;
          --cream: #FAF5EE; --cream2: #F0E8D8;
          --brown: #2C1A0E; --muted: #8A7A6E; --border: rgba(44,26,14,0.08);
          --nfont: '${siteFont}', sans-serif;
        }
        .nr { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .nr.nv { opacity: 1; transform: none; }
        .nd1 { transition-delay: 0.1s; } .nd2 { transition-delay: 0.2s; } .nd3 { transition-delay: 0.3s; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          background: rgba(255,255,255,0.97); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 5%; height: 66px;
        }
        .nav-logo { display: flex; align-items: center; text-decoration: none; }
        .nav-logo-text { font-size: 26px; font-weight: 900; color: var(--orange); line-height: 1; }
        .nav-logo img { height: 34px; object-fit: contain; }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-link { font-size: 14px; font-weight: 600; color: var(--brown); opacity: 0.5; background: none; border: none; cursor: pointer; transition: opacity 0.2s; font-family: var(--nfont); }
        .nav-link:hover { opacity: 1; }
        .btn { background: var(--orange); color: white; border: none; padding: 11px 24px; border-radius: 50px; font-family: var(--nfont); font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s; display: inline-flex; align-items: center; text-decoration: none; }
        .btn:hover { background: var(--orange-h); transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--brown); border: 1.5px solid rgba(44,26,14,0.15); padding: 11px 24px; border-radius: 50px; font-family: var(--nfont); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; }
        .btn-ghost:hover { border-color: var(--orange); color: var(--orange); }

        /* HERO — white bg */
        .hero { min-height: 100vh; display: flex; align-items: center; padding: 80px 5% 60px; background: white; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; max-width: 1200px; width: 100%; margin: 0 auto; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--orange-pale); color: var(--orange); font-size: 11px; font-weight: 700; padding: 6px 16px; border-radius: 50px; margin-bottom: 24px; letter-spacing: 0.08em; text-transform: uppercase; }
        .hero-h1 { font-size: clamp(46px, 5.5vw, 72px); font-weight: 900; color: var(--brown); line-height: 1.06; letter-spacing: -2px; margin-bottom: 20px; }
        .hero-h1 .or { color: var(--orange); }
        .hero-desc { font-size: 17px; color: var(--muted); line-height: 1.75; max-width: 440px; margin-bottom: 24px; font-weight: 500; }
        .trust-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 28px; }
        .trust-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); font-weight: 600; }
        .trust-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--orange); flex-shrink: 0; }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .social-proof { display: flex; align-items: center; gap: 12px; }
        .avatars { display: flex; }
        .avatar { width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; margin-left: -8px; }
        .avatar:first-child { margin-left: 0; }
        .hero-img { width: 100%; aspect-ratio: 3/4; border-radius: 28px; overflow: hidden; background: var(--cream); position: relative; }
        .hero-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg, #F5EAD8, #EDD8B8); font-size: 100px; }
        .float-card { position: absolute; background: white; border-radius: 14px; padding: 11px 16px; box-shadow: 0 8px 28px rgba(0,0,0,0.09); border: 1px solid rgba(0,0,0,0.05); }
        .float-1 { bottom: 28px; left: -24px; }
        .float-2 { top: 28px; right: -24px; }
        .float-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
        .float-val { font-size: 14px; font-weight: 800; color: var(--brown); }

        /* TICKER */
        .ticker { background: var(--orange); padding: 13px 0; overflow: hidden; }
        .ticker-track { display: flex; white-space: nowrap; ${tickerAnimated ? 'animation: ntick 28s linear infinite;' : ''} }
        .ticker-item { font-size: 13px; font-weight: 700; color: white; padding: 0 40px; }
        .ticker-hi { color: rgba(255,255,255,0.6); margin-right: 4px; }
        @keyframes ntick { from { transform: translateX(0) } to { transform: translateX(-50%) } }

        /* STAGES — cream bg */
        .stages { background: var(--cream); padding: 88px 5% 72px; overflow: hidden; }
        .stages-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 48px; gap: 20px; flex-wrap: wrap; }
        .section-label { font-size: 11px; font-weight: 700; color: var(--orange); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
        .section-title { font-size: clamp(26px, 3.5vw, 40px); font-weight: 900; color: var(--brown); line-height: 1.15; }
        .section-title .or { color: var(--orange); }

        /* Stage carousel - looping, smooth */
        .stage-wrap { position: relative; overflow: hidden; touch-action: pan-y; }
        .stage-track { display: flex; transition: transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94); will-change: transform; }
        .stage-card { min-width: 320px; margin-right: 24px; border-radius: 24px; overflow: hidden; flex-shrink: 0; transition: box-shadow 0.3s; }
        .stage-card.s-active { box-shadow: 0 20px 60px rgba(200,75,15,0.18); }
        .stage-img { width: 100%; height: 260px; display: flex; align-items: center; justify-content: center; font-size: 72px; position: relative; overflow: hidden; }
        .stage-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .stage-body { padding: 24px; }
        .stage-name { font-size: 22px; font-weight: 900; color: var(--brown); margin-bottom: 4px; }
        .stage-age { font-size: 13px; font-weight: 700; color: var(--orange); margin-bottom: 10px; }
        .stage-desc { font-size: 13px; color: var(--muted); line-height: 1.65; font-weight: 500; }
        .stage-nav { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 32px; }
        .stage-btn { width: 42px; height: 42px; border-radius: 50%; border: 1.5px solid rgba(44,26,14,0.12); background: white; color: var(--brown); font-size: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .stage-btn:hover { background: var(--orange); color: white; border-color: var(--orange); }
        .dots { display: flex; gap: 6px; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(44,26,14,0.15); transition: all 0.3s; cursor: pointer; border: none; padding: 0; }
        .dot.a { background: var(--orange); width: 20px; border-radius: 4px; }

        /* HOW IT WORKS — white bg, horizontal */
        .how { background: white; padding: 88px 5%; }
        .how-inner { max-width: 1100px; margin: 0 auto; }
        .how-head { text-align: center; margin-bottom: 60px; }
        .how-title { font-size: clamp(28px, 4vw, 46px); font-weight: 900; color: var(--brown); margin-bottom: 10px; }
        .how-sub { font-size: 16px; color: var(--muted); font-weight: 500; }
        .how-steps { display: flex; align-items: flex-start; gap: 0; }
        .how-step { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 16px; }
        .how-conn { flex-shrink: 0; width: 48px; padding-top: 68px; display: flex; align-items: center; }
        .how-conn-line { width: 100%; height: 1.5px; background: repeating-linear-gradient(to right, rgba(200,75,15,0.25) 0, rgba(200,75,15,0.25) 5px, transparent 5px, transparent 11px); }
        .how-icon { width: 136px; height: 136px; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 44px; overflow: hidden; flex-shrink: 0; }
        .how-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 24px; }
        .how-desc { font-size: 14px; color: var(--muted); line-height: 1.7; font-weight: 500; max-width: 190px; }
        .how-cta { text-align: center; margin-top: 52px; }

        /* MENU — cream bg */
        .menu { display: flex; min-height: 90vh; background: var(--cream); }
        .menu-left { width: 340px; min-width: 300px; background: var(--orange); display: flex; flex-direction: column; padding: 32px; position: relative; overflow: hidden; }
        .menu-left::before { content: ''; position: absolute; width: 560px; height: 560px; border-radius: 50%; background: rgba(0,0,0,0.07); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
        .menu-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 36px; position: relative; z-index: 1; }
        .menu-logo { font-size: 20px; font-weight: 900; color: white; text-decoration: none; }
        .menu-h { position: relative; z-index: 1; flex: 1; }
        .menu-h h2 { font-size: 38px; font-weight: 900; color: white; line-height: 1.2; }
        .menu-tabs { display: flex; gap: 8px; position: relative; z-index: 1; margin-top: auto; padding-top: 20px; }
        .menu-tab { flex: 1; padding: 12px 6px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.3); background: transparent; color: rgba(255,255,255,0.65); font-family: var(--nfont); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-align: center; }
        .menu-tab.a { background: white; color: var(--orange); border-color: white; }
        .menu-tab:hover:not(.a) { background: rgba(255,255,255,0.1); color: white; }

        /* Meal peeking carousel */
        .menu-right { flex: 1; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; overflow: hidden; position: relative; }
        .meal-circle-bg { position: absolute; width: 480px; height: 480px; border-radius: 50%; background: var(--cream); top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 0; }
        .meal-carousel { position: relative; z-index: 1; width: 100%; display: flex; align-items: center; justify-content: center; touch-action: pan-y; user-select: none; }
        .meal-track { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; height: 520px; }

        /* Each meal slot */
        .meal-slot { position: absolute; transition: all 0.35s cubic-bezier(0.25,0.46,0.45,0.94); display: flex; flex-direction: column; align-items: center; }
        .meal-slot.curr { left: 50%; transform: translateX(-50%) scale(1); opacity: 1; z-index: 3; }
        .meal-slot.prev { left: 0; transform: translateX(-20%) scale(0.82); opacity: 0.5; z-index: 2; cursor: pointer; }
        .meal-slot.next { right: 0; left: auto; transform: translateX(20%) scale(0.82); opacity: 0.5; z-index: 2; cursor: pointer; }

        .meal-img-wrap { width: 220px; height: 220px; border-radius: 50%; overflow: hidden; background: var(--cream2); display: flex; align-items: center; justify-content: center; font-size: 64px; border: 5px solid white; box-shadow: 0 10px 36px rgba(200,75,15,0.1); }
        .meal-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .meal-counter { font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: 0.06em; margin-bottom: 12px; text-align: center; }
        .meal-name { font-size: 20px; font-weight: 900; color: var(--orange); margin: 16px 0 6px; text-align: center; }
        .meal-desc { font-size: 13px; color: var(--muted); line-height: 1.65; text-align: center; max-width: 360px; font-weight: 500; margin-bottom: 16px; }
        .nutr-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 12px; width: 340px; }
        .nutr-box { background: var(--orange); border-radius: 10px; padding: 12px 6px; text-align: center; }
        .nutr-val { font-size: 17px; font-weight: 900; color: white; display: block; line-height: 1; margin-bottom: 3px; }
        .nutr-lbl { font-size: 9px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
        .allergen { display: inline-flex; align-items: center; gap: 7px; background: #FDF5E8; border-radius: 8px; padding: 8px 14px; border: 1px solid #F0DEC8; font-size: 12px; color: var(--brown); font-weight: 600; margin-bottom: 12px; }
        .meal-dots { display: flex; gap: 5px; justify-content: center; margin-top: 12px; }
        .meal-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(44,26,14,0.12); transition: all 0.3s; border: none; padding: 0; cursor: pointer; }
        .meal-dot.a { background: var(--orange); width: 18px; border-radius: 3px; }

        /* WHY — cream bg */
        .why { background: var(--cream); padding: 88px 5%; }
        .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; max-width: 1200px; margin: 0 auto; }
        .why-title { font-size: clamp(44px, 6vw, 76px); font-weight: 900; line-height: 1.05; margin-bottom: 28px; color: var(--brown); }
        .why-title .or { color: var(--orange); }
        .why-pts { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
        .why-pt-title { font-size: 15px; font-weight: 800; margin-bottom: 3px; }
        .why-pt-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 500; }
        .ing-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .ing-card { border-radius: 14px; overflow: hidden; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
        .ing-img { width: 100%; height: 80px; background: var(--cream2); display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .ing-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ing-name { font-size: 12px; font-weight: 800; color: var(--brown); padding: 7px 10px 2px; }
        .ing-desc { font-size: 10px; color: var(--muted); padding: 0 10px 8px; line-height: 1.4; }
        .why-photo { width: 100%; aspect-ratio: 3/4; border-radius: 28px; overflow: hidden; background: var(--cream2); display: flex; align-items: center; justify-content: center; font-size: 80px; }
        .why-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* FAQ — white bg */
        .faq { background: white; padding: 88px 5%; }
        .faq-inner { max-width: 700px; margin: 0 auto; }
        .faq-head { text-align: center; margin-bottom: 48px; }
        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 20px 0; background: none; border: none; cursor: pointer; font-family: var(--nfont); font-size: 15px; font-weight: 700; color: var(--brown); text-align: left; gap: 16px; }
        .faq-icon { width: 26px; height: 26px; border-radius: 50%; background: var(--orange-pale); color: var(--orange); display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; transition: transform 0.3s, background 0.2s; font-weight: 300; line-height: 1; }
        .faq-icon.o { transform: rotate(45deg); background: var(--orange); color: white; }
        .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.25s; }
        .faq-a.o { max-height: 300px; padding-bottom: 18px; }
        .faq-a p { font-size: 14px; color: var(--muted); line-height: 1.75; font-weight: 500; }

        /* FOOTER */
        .footer-hero { background: var(--orange); padding: 60px 5%; text-align: center; position: relative; overflow: hidden; }
        .footer-toys { position: absolute; inset: 0; pointer-events: none; }
        .toy { position: absolute; font-size: 52px; opacity: 0.1; user-select: none; }
        .footer-word { font-size: clamp(64px, 12vw, 120px); font-weight: 900; color: rgba(255,255,255,0.18); line-height: 1; position: relative; z-index: 1; letter-spacing: -3px; }
        .footer-cols { background: var(--cream); padding: 56px 5% 40px; display: grid; grid-template-columns: repeat(4,1fr); gap: 40px; border-top: 1px solid rgba(44,26,14,0.07); }
        .footer-col-title { font-size: 11px; font-weight: 800; color: var(--orange); margin-bottom: 16px; display: block; text-transform: uppercase; letter-spacing: 0.08em; }
        .footer-text { font-size: 13px; color: var(--muted); line-height: 1.75; }
        .footer-bullets { list-style: none; margin: 10px 0 14px; }
        .footer-bullets li { font-size: 13px; color: var(--muted); padding: 3px 0; display: flex; gap: 8px; line-height: 1.4; }
        .footer-bullets li::before { content: '–'; color: var(--orange); flex-shrink: 0; }
        .footer-links-list { display: flex; flex-direction: column; gap: 10px; }
        .footer-link { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; font-weight: 500; }
        .footer-link:hover { color: var(--orange); }
        .contact-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .contact-icon { width: 28px; height: 28px; border-radius: 7px; background: rgba(200,75,15,0.08); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .contact-text { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .contact-text a { color: var(--orange); text-decoration: none; font-weight: 600; }
        .sub-input { width: 100%; padding: 11px 14px; border: 1.5px solid rgba(44,26,14,0.1); border-radius: 10px; font-size: 13px; font-family: var(--nfont); color: var(--brown); outline: none; transition: border-color 0.2s; box-sizing: border-box; margin-bottom: 8px; background: white; }
        .sub-input:focus { border-color: var(--orange); }
        .footer-bottom { background: var(--brown); padding: 16px 5%; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); }
        .footer-bl { display: flex; gap: 20px; }
        .footer-bl a { font-size: 12px; color: rgba(255,255,255,0.25); text-decoration: none; transition: color 0.2s; }
        .footer-bl a:hover { color: rgba(255,255,255,0.6); }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .footer-cols { grid-template-columns: repeat(2,1fr); }
          .why-grid { grid-template-columns: 1fr; gap: 48px; }
          .menu { flex-direction: column; }
          .menu-left { width: 100%; min-width: unset; min-height: 48vh; }
          .hero-img .float-1, .hero-img .float-2 { display: none; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .hero-grid { grid-template-columns: 1fr; gap: 36px; }
          .hero-img { aspect-ratio: 4/3; }
          .hero-h1 { font-size: 38px; letter-spacing: -1px; }
          .hero-btns { flex-direction: column; }
          .how-steps { flex-direction: column; align-items: center; gap: 32px; }
          .how-conn { display: none; }
          .how-step { padding: 0; }
          .ing-grid { grid-template-columns: repeat(2,1fr); }
          .footer-cols { grid-template-columns: 1fr; }
          .nutr-grid { grid-template-columns: repeat(2,1fr); width: 280px; }
          .meal-slot.prev { display: none; }
          .meal-slot.next { display: none; }
          .meal-img-wrap { width: 200px; height: 200px; }
          .stage-card { min-width: 280px; }
        }
        @media (max-width: 480px) {
          .hero-h1 { font-size: 32px; }
          .why-title { font-size: 40px; }
          .footer-word { font-size: 56px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          {logo?.url ? <img src={logo.url} alt={logo.alt_text || 'Ninoz'} /> : <span className="nav-logo-text">Ninoz</span>}
        </Link>
        <div className="nav-links">
          {[['How It Works','how'],['Menu','menu'],['Plans','stages'],['FAQ','faq']].map(([l,id]) => (
            <button key={id} className="nav-link" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>{l}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setShowPopup(true)}>{cv(content,'nav_cta_text','Start Your Plan')}</button>
      </nav>

      {/* HERO — white */}
      <section className="hero" id="hero">
        <div className="hero-grid">
          <div>
            <div className="hero-badge nr">🌿 {cv(content,'hero_badge','Fresh · Organic · Daily Delivery in Riyadh')}</div>
            <h1 className="hero-h1 nr nd1">
              {cv(content,'hero_headline_1','You Care.')}<br />
              <span className="or">{cv(content,'hero_headline_2','We Prepare.')}</span>
            </h1>
            <p className="hero-desc nr nd1">{cv(content,'hero_description','Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.')}</p>
            <div className="trust-row nr nd2">
              {['Fresh Ingredients','No Preservatives','Cooked Daily','Pediatrician Approved'].map(t => (
                <div key={t} className="trust-item"><div className="trust-dot"/>{t}</div>
              ))}
            </div>
            <div className="hero-btns nr nd2">
              <button className="btn" onClick={() => setShowPopup(true)}>{cv(content,'hero_btn_primary','Start Your Plan')}</button>
              <button className="btn-ghost" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>{cv(content,'hero_btn_secondary','Explore Meals')}</button>
            </div>
            <div className="social-proof nr nd3">
              <div className="avatars">
                {['#FFB347','#E8834A','#C84B0F','#7A7068','#2C1A0E'].map((c,i) => (
                  <div key={i} className="avatar" style={{ background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{cv(content,'hero_social_proof','Trusted by 200+ Riyadh mothers')}</span>
            </div>
          </div>

          <div className="hero-img nr nd1" style={{ position: 'relative' }}>
            {heroImageUrl ? <img src={heroImageUrl} alt="Ninoz" /> : <div className="hero-placeholder">👶</div>}
            <div className="float-card float-1">
              <div className="float-label">Daily Fresh</div>
              <div className="float-val">Cooked Every Morning</div>
            </div>
            <div className="float-card float-2">
              <div className="float-label">Nutritionist</div>
              <div className="float-val">Approved ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-track">
          {(tickerAnimated ? [0,1] : [0]).map(r =>
            (tickerItems.length > 0 ? tickerItems : [
              { id:'1', text:'Fresh Ingredients', highlight:'100%' },
              { id:'2', text:'Sugar Added or Sweetener', highlight:'0%' },
              { id:'3', text:'Preservatives & Synthetics', highlight:'0%' },
              { id:'4', text:'Frozen Food', highlight:'0%' },
            ]).map((item,i) => (
              <span key={`${r}-${i}`} className="ticker-item">
                <span className="ticker-hi">{item.highlight}</span>{item.text} ·{' '}
              </span>
            ))
          )}
        </div>
      </div>

      {/* STAGES — cream */}
      <section className="stages" id="stages">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="stages-head nr">
            <div>
              <div className="section-label">Our Plans</div>
              <h2 className="section-title">
                {cv(content,'stages_title','Fresh Meals Built for').replace(cv(content,'stages_title_highlight','Their Stage'),'').trim()}{' '}
                <span className="or">{cv(content,'stages_title_highlight','Their Stage')}</span>
              </h2>
            </div>
            <button className="btn" onClick={() => setShowPopup(true)}>{cv(content,'stages_cta','Start Your Plan')}</button>
          </div>

          <div className="stage-wrap nr" onTouchStart={onStageTouchStart} onTouchEnd={onStageTouchEnd}>
            <div className="stage-track" style={{ transform: `translateX(calc(-${stageIndex * 344}px))` }}>
              {stages.map((stage, idx) => (
                <div key={stage.id} className={`stage-card ${idx === stageIndex ? 's-active' : ''}`}
                  style={{ background: stage.card_bg || '#F5EDE0', cursor: idx !== stageIndex ? 'pointer' : 'default' }}
                  onClick={() => idx !== stageIndex && setStageIndex(idx)}>
                  <div className="stage-img" style={{ background: stage.card_bg || '#F5EDE0' }}>
                    {stage.image_url ? <img src={stage.image_url} alt={stage.name} /> : <span style={{ fontSize: 80 }}>{stage.emoji}</span>}
                    {stage.tag && (
                      <div style={{ position: 'absolute', top: 14, right: 14, background: stage.tag_color || 'var(--orange)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50 }}>
                        {stage.tag}
                      </div>
                    )}
                  </div>
                  <div className="stage-body">
                    <div className="stage-name">{stage.name}</div>
                    <div className="stage-age">{stage.age_range}</div>
                    <div className="stage-desc">{stage.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stage-nav">
            <button className="stage-btn" onClick={() => setStageIndex(i => (i - 1 + stages.length) % stages.length)}>←</button>
            <div className="dots">
              {stages.map((_,idx) => (
                <button key={idx} className={`dot ${idx === stageIndex ? 'a' : ''}`} onClick={() => setStageIndex(idx)} />
              ))}
            </div>
            <button className="stage-btn" onClick={() => setStageIndex(i => (i + 1) % stages.length)}>→</button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — white, horizontal */}
      <section className="how" id="how">
        <div className="how-inner">
          <div className="how-head nr">
            <div className="section-label" style={{ color: 'var(--muted)' }}>Process</div>
            <h2 className="how-title">{cv(content,'how_title','How Ninoz Works')}</h2>
            <p className="how-sub">{cv(content,'how_subtitle','Three steps to peace of mind — and a well-fed baby.')}</p>
          </div>
          <div className="how-steps nr nd1">
            {howSteps.map((step, i) => (
              <>
                <div key={step.id} className="how-step">
                  <div className="how-icon" style={{ background: step.icon_bg || (i === 0 ? '#FAF5EE' : i === 1 ? '#FDF0E8' : '#C84B0F') }}>
                    {step.icon_url ? <img src={step.icon_url} alt="" /> : <span>{i === 0 ? '📋' : i === 1 ? '👨‍🍳' : '🚚'}</span>}
                  </div>
                  <p className="how-desc">{step.description}</p>
                </div>
                {i < howSteps.length - 1 && (
                  <div key={`c${i}`} className="how-conn"><div className="how-conn-line"/></div>
                )}
              </>
            ))}
          </div>
          <div className="how-cta nr nd2">
            <button className="btn" style={{ padding: '14px 48px', fontSize: 15 }} onClick={() => setShowPopup(true)}>
              {cv(content,'how_cta','Get Started')}
            </button>
          </div>
        </div>
      </section>

      {/* MENU — cream left + white right with peeking carousel */}
      <section id="menu">
        <div className="menu">
          <div className="menu-left">
            <div className="menu-top">
              <Link href="/" className="menu-logo">Ninoz</Link>
              <button className="btn" style={{ fontSize: 12, padding: '9px 16px' }} onClick={() => setShowPopup(true)}>
                {cv(content,'menu_cta','Start your plan')}
              </button>
            </div>
            <div className="menu-h">
              <h2>
                {[cv(content,'menu_headline_1','Real Food'), cv(content,'menu_headline_2','Real Ingredients'), cv(content,'menu_headline_3','Every Single Day')].map((l,i) => (
                  <span key={i} style={{ display: 'block' }}>{l}</span>
                ))}
              </h2>
            </div>
            <div className="menu-tabs">
              {(['breakfast','lunch','dinner'] as const).map(tab => (
                <button key={tab} className={`menu-tab ${activeTab === tab ? 'a' : ''}`} onClick={() => setActiveTab(tab)}>
                  {cv(content,`menu_tab_${tab}`,tab.charAt(0).toUpperCase()+tab.slice(1))}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-right" onTouchStart={onMealTouchStart} onTouchEnd={onMealTouchEnd}>
            <div className="meal-circle-bg"/>
            {totalMeals === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🍽️</div>
                <p style={{ fontWeight: 600 }}>No meals yet.</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Add meals from the admin portal.</p>
              </div>
            ) : (
              <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="meal-counter">{mealIndex + 1} / {totalMeals} meals</div>

                {/* Peeking carousel */}
                <div className="meal-carousel" style={{ marginBottom: 16 }}>
                  <div className="meal-track">
                    {/* PREV peeking */}
                    {prevMeal && totalMeals > 1 && (
                      <div className="meal-slot prev" onClick={() => changeMeal(-1)}>
                        <div className="meal-img-wrap" style={{ width: 160, height: 160, fontSize: 50 }}>
                          {prevMeal.image_url ? <img src={prevMeal.image_url} alt={prevMeal.name} /> : <span>🍽️</span>}
                        </div>
                      </div>
                    )}
                    {/* CURRENT */}
                    {currMeal && (
                      <div className="meal-slot curr" style={{ opacity: mealTransition ? 0.3 : 1, transition: 'opacity 0.15s' }}>
                        <div className="meal-img-wrap">
                          {currMeal.image_url ? <img src={currMeal.image_url} alt={currMeal.name} /> : <span>🍽️</span>}
                        </div>
                      </div>
                    )}
                    {/* NEXT peeking */}
                    {nextMeal && totalMeals > 1 && (
                      <div className="meal-slot next" onClick={() => changeMeal(1)}>
                        <div className="meal-img-wrap" style={{ width: 160, height: 160, fontSize: 50 }}>
                          {nextMeal.image_url ? <img src={nextMeal.image_url} alt={nextMeal.name} /> : <span>🍽️</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {currMeal && (
                  <>
                    <div className="meal-name">{currMeal.name}</div>
                    <div className="meal-desc">{currMeal.description}</div>
                    {(currMeal.weight_g || currMeal.protein_g) && (
                      <div className="nutr-grid">
                        {[{v:currMeal.weight_g,l:'Weight'},{v:currMeal.protein_g,l:'Protein'},{v:currMeal.carbs_g,l:'Carbs'},{v:currMeal.fiber_g,l:'Fiber'}]
                          .filter(n => n.v).map(n => (
                          <div key={n.l} className="nutr-box">
                            <span className="nutr-val">{n.v}</span>
                            <span className="nutr-lbl">{n.l}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {currMeal.allergens && (
                      <div className="allergen">⚠️ Allergen: <strong style={{ marginLeft: 4 }}>{currMeal.allergens}</strong></div>
                    )}
                  </>
                )}

                <div className="meal-dots">
                  {filteredMeals.slice(0, 8).map((_,idx) => (
                    <button key={idx} className={`meal-dot ${idx === mealIndex ? 'a' : ''}`} onClick={() => setMealIndex(idx)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* WHY / INGREDIENTS — cream */}
      <section className="why" id="ingredients">
        <div className="why-grid">
          <div className="nr">
            <h2 className="why-title">Only <span className="or">Real</span><br/>Ingredients</h2>
            <div className="why-pts">
              {whyPoints.map(p => (
                <div key={p.id}>
                  <div className="why-pt-title" style={{ color: p.title_color || 'var(--orange)' }}>{p.title}</div>
                  <div className="why-pt-desc">{p.description}</div>
                </div>
              ))}
            </div>
            {ingredients.length > 0 && (
              <div className="ing-grid">
                {ingredients.slice(0,4).map(ing => (
                  <div key={ing.id} className="ing-card">
                    <div className="ing-img">
                      {ing.image_url ? <img src={ing.image_url} alt={ing.name} /> : <span>🥕</span>}
                    </div>
                    <div className="ing-name">{ing.name}</div>
                    <div className="ing-desc">{ing.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="nr nd2">
            <div className="why-photo">
              {whyImageUrl ? <img src={whyImageUrl} alt="Why Ninoz" /> : <span>👶</span>}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — white */}
      {faqs.length > 0 && (
        <section className="faq" id="faq">
          <div className="faq-inner">
            <div className="faq-head nr">
              <div className="section-label">FAQ</div>
              <h2 className="section-title">{cv(content,'faq_title','Common Questions')}</h2>
              <p style={{ fontSize: 15, color: 'var(--muted)', marginTop: 10, fontWeight: 500 }}>{cv(content,'faq_subtitle','Everything you need to know about Ninoz.')}</p>
            </div>
            <div className="nr nd1">
              {faqs.map(faq => (
                <div key={faq.id} className="faq-item">
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                    <span>{faq.question}</span>
                    <div className={`faq-icon ${openFaq === faq.id ? 'o' : ''}`}>+</div>
                  </button>
                  <div className={`faq-a ${openFaq === faq.id ? 'o' : ''}`}>
                    <p>{faq.answer}</p>
                  </div>
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
            {[{t:'10%',l:'4%',e:'🪆'},{t:'60%',l:'2%',e:'🚲'},{t:'15%',l:'18%',e:'🧸'},{t:'10%',r:'18%',e:'🏀'},{t:'65%',r:'15%',e:'🪀'},{t:'12%',r:'4%',e:'🚂'}].map((x,i) => (
              <span key={i} className="toy" style={{ top:x.t, left:(x as any).l, right:(x as any).r }}>{x.e}</span>
            ))}
          </div>
          <div className="footer-word">Ninoz</div>
        </div>

        <div className="footer-cols">
          <div>
            <span className="footer-col-title">{cv(content,'footer_about_title','About Ninoz')}</span>
            <div className="footer-text">
              <strong style={{ color:'var(--brown)', display:'block', marginBottom:4, fontWeight:700 }}>Hi. We're Ninoz.</strong>
              {cv(content,'footer_about_text','We cook fresh daily meals for babies and toddlers in Riyadh.')}
            </div>
            <ul className="footer-bullets">
              {["Cooked the morning of delivery","Designed for your baby's stage","Approved by a pediatric nutritionist","Free from salt, sugar and preservatives"].map(b => <li key={b}>{b}</li>)}
            </ul>
            <div className="footer-text" style={{ fontStyle:'italic' }}>{cv(content,'footer_about_closing',"You handle the love. We handle the food.")}</div>
          </div>

          <div>
            <span className="footer-col-title">{cv(content,'footer_links_title','Useful Links')}</span>
            <div className="footer-links-list">
              {footerLinks.map(l => <a key={l.id} href={l.url} className="footer-link">{l.label}</a>)}
            </div>
          </div>

          <div>
            <span className="footer-col-title">{cv(content,'footer_contact_title','Get in Touch')}</span>
            <div className="contact-item"><div className="contact-icon">☺️</div><div className="contact-text">{cv(content,'footer_contact_tagline',"We'd love to hear from you")}</div></div>
            {cv(content,'footer_contact_whatsapp') && (
              <div className="contact-item"><div className="contact-icon">📱</div><div className="contact-text"><a href={`https://wa.me/${cv(content,'footer_contact_whatsapp')}`} target="_blank" rel="noreferrer">WhatsApp Us</a></div></div>
            )}
            <div className="contact-item"><div className="contact-icon">📧</div><div className="contact-text"><a href={`mailto:${cv(content,'footer_contact_email','hello@ninoz.sa')}`}>{cv(content,'footer_contact_email','hello@ninoz.sa')}</a></div></div>
          </div>

          <div>
            <span className="footer-col-title">{cv(content,'footer_subscribe_title','Subscribe Now')}</span>
            <p className="footer-text" style={{ marginBottom:14 }}>Enter your email to start your plan.</p>
            {subscribed ? (
              <div style={{ background:'#E8F5EE', color:'#2D6A4F', padding:'12px 16px', borderRadius:10, fontSize:13, fontWeight:600 }}>✓ You're on the list!</div>
            ) : (
              <>
                <input className="sub-input" type="email" placeholder="your@email.com" value={subscribeEmail} onChange={e => setSubscribeEmail(e.target.value)} />
                <button className="btn" style={{ width:'100%', borderRadius:10, justifyContent:'center' }}
                  onClick={() => { if(subscribeEmail.includes('@')) { setSubscribed(true); setShowPopup(true) } }}>
                  Start Your Plan →
                </button>
              </>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">{cv(content,'footer_copyright','© 2025 Ninoz. All rights reserved.')}</span>
          <div className="footer-bl">
            <a href="#">Terms</a><a href="#">Privacy</a><a href="#">Allergens</a>
          </div>
        </div>
      </footer>

      {showPopup && (
        <SubscriptionPopup stages={stages} paymentCycles={paymentCycles} content={content} onClose={() => setShowPopup(false)} />
      )}
    </>
  )
}
