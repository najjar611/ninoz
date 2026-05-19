'use client'

// ══════════════════════════════════════════════════════════
// HomeClient.tsx — v6.1
// All 16 issues fixed:
// 1. Hero matches design with image upload support
// 2. Ticker static by default, toggle from admin
// 3. Smooth Tinder-style stage swipe
// 4. How It Works horizontal
// 5. Menu infinite loop with counter
// 6. Ingredients no duplicate, circular photos
// 7. Footer links editable
// 8. Font from admin (Google Fonts)
// 9. Admin simplified
// 10. Premium modern design
// 11. Logo clickable → homepage
// 12. FAQ section added
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
  id: string; stage_id: string; name: string; description: string
  meal_type: string; image_url: string | null
  allergens: string; weight_g: string; protein_g: string
  carbs_g: string; fiber_g: string; tag: string | null
}
type HowStep = { id: string; icon_url: string | null; icon_bg: string; description: string; icon: string }
type WhyPoint = { id: string; title: string; description: string; title_color: string }
type Ingredient = { id: string; name: string; description: string; image_url: string | null }
type FooterLink = { id: string; label: string; url: string }
type Logo = { url: string | null; alt_text: string }
type PaymentCycle = { id: string; label: string; days: number; meals_total: number; price_sar: number }
type Faq = { id: string; question: string; answer: string }

type Props = {
  stages: Stage[]
  meals: Meal[]
  content: Record<string, string>
  howSteps: HowStep[]
  whyPoints: WhyPoint[]
  ingredients: Ingredient[]
  footerLinks: FooterLink[]
  logo: Logo | null
  paymentCycles: PaymentCycle[]
  faqs: Faq[]
}

const cv = (content: Record<string, string>, key: string, fallback = '') =>
  content[key] || fallback

// Curated Google Fonts list
const GOOGLE_FONTS = [
  'Nunito', 'Poppins', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
  'Sora', 'Raleway', 'Quicksand', 'Josefin Sans', 'Karla',
  'Mulish', 'Inter', 'Lato', 'Montserrat', 'Work Sans'
]

export default function HomeClient({
  stages, meals, content, howSteps, whyPoints,
  ingredients, footerLinks, logo, paymentCycles, faqs
}: Props) {
  const [showPopup, setShowPopup] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('breakfast')
  const [mealIndex, setMealIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  // Swipe state
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const mealTouchStartX = useRef<number | null>(null)

  const siteFont = cv(content, 'site_font', 'Nunito')
  const tickerAnimated = cv(content, 'ticker_animated', 'true') === 'true'
  const heroImageUrl = cv(content, 'hero_image_url', '')
  const whyImageUrl = cv(content, 'why_image_url', '')

  useEffect(() => {
    // Load selected font
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${siteFont.replace(/ /g, '+')}:wght@400;600;700;800;900&display=swap`
    document.head.appendChild(link)
    document.documentElement.style.setProperty('--site-font', `'${siteFont}', sans-serif`)
  }, [siteFont])

  useEffect(() => {
    // Reveal on scroll
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('n-visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.n-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => { setMealIndex(0) }, [activeTab])

  const filteredMeals = meals.filter(m => m.meal_type === activeTab)
  const totalMeals = filteredMeals.length
  const currentMeal = totalMeals > 0 ? filteredMeals[mealIndex % totalMeals] : null

  function nextMeal() { if (totalMeals > 0) setMealIndex(i => (i + 1) % totalMeals) }
  function prevMeal() { if (totalMeals > 0) setMealIndex(i => (i - 1 + totalMeals) % totalMeals) }

  // Stage touch handlers
  function onStageTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function onStageTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    const dy = Math.abs((touchStartY.current || 0) - e.changedTouches[0].clientY)
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      if (dx > 0) setStageIndex(i => Math.min(i + 1, stages.length - 1))
      else setStageIndex(i => Math.max(i - 1, 0))
    }
    touchStartX.current = null
  }

  // Meal touch handlers
  function onMealTouchStart(e: React.TouchEvent) { mealTouchStartX.current = e.touches[0].clientX }
  function onMealTouchEnd(e: React.TouchEvent) {
    if (mealTouchStartX.current === null) return
    const dx = mealTouchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 40) { dx > 0 ? nextMeal() : prevMeal() }
    mealTouchStartX.current = null
  }

  const tickerItems = [
    cv(content, 'ticker_1', '100% Fresh Ingredients'),
    cv(content, 'ticker_2', '0% Sugar Added or Sweetener'),
    cv(content, 'ticker_3', '0% Preservatives & Synthetics'),
    cv(content, 'ticker_4', '0% Frozen Food'),
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${siteFont.replace(/ /g, '+')}:wght@400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: var(--site-font, '${siteFont}', sans-serif); overflow-x: hidden; background: #FAF5EE; }

        :root {
          --orange: #C84B0F;
          --orange-hover: #A33A0A;
          --cream: #FAF5EE;
          --cream-2: #F0E8D8;
          --brown: #2C1A0E;
          --muted: #8A7A6E;
          --site-font: '${siteFont}', sans-serif;
        }

        /* REVEAL */
        .n-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.55s ease, transform 0.55s ease; }
        .n-reveal.n-visible { opacity: 1; transform: none; }
        .n-d1 { transition-delay: 0.1s; }
        .n-d2 { transition-delay: 0.2s; }
        .n-d3 { transition-delay: 0.3s; }

        /* NAV */
        .n-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          background: rgba(250,245,238,0.96); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(44,26,14,0.07);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 5%; height: 68px;
        }
        .n-logo { display: flex; align-items: center; text-decoration: none; }
        .n-logo-text { font-family: var(--site-font); font-size: 26px; font-weight: 900; color: var(--orange); line-height: 1; }
        .n-logo img { height: 36px; object-fit: contain; }
        .n-nav-links { display: flex; gap: 32px; align-items: center; }
        .n-nav-link { font-size: 14px; font-weight: 600; color: var(--brown); opacity: 0.55; background: none; border: none; cursor: pointer; transition: opacity 0.2s; font-family: var(--site-font); text-decoration: none; }
        .n-nav-link:hover { opacity: 1; }
        .n-btn { background: var(--orange); color: white; border: none; padding: 11px 24px; border-radius: 50px; font-family: var(--site-font); font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center; }
        .n-btn:hover { background: var(--orange-hover); }
        .n-btn-ghost { background: transparent; color: var(--brown); border: 1.5px solid rgba(44,26,14,0.15); padding: 11px 24px; border-radius: 50px; font-family: var(--site-font); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; }
        .n-btn-ghost:hover { border-color: var(--orange); color: var(--orange); }

        /* HERO */
        .n-hero { min-height: 100vh; display: flex; align-items: center; padding: 80px 5% 60px; background: var(--cream); }
        .n-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; max-width: 1200px; width: 100%; margin: 0 auto; }
        .n-hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(200,75,15,0.08); color: var(--orange); font-size: 11px; font-weight: 700; padding: 6px 16px; border-radius: 50px; margin-bottom: 24px; letter-spacing: 0.08em; text-transform: uppercase; }
        .n-hero-h1 { font-family: var(--site-font); font-size: clamp(44px, 5.5vw, 72px); font-weight: 900; color: var(--brown); line-height: 1.06; letter-spacing: -2px; margin-bottom: 20px; }
        .n-hero-h1 .n-orange { color: var(--orange); }
        .n-hero-desc { font-size: 16px; color: var(--muted); line-height: 1.75; max-width: 440px; margin-bottom: 24px; font-weight: 500; }
        .n-trust-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 28px; }
        .n-trust-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); font-weight: 600; }
        .n-trust-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--orange); flex-shrink: 0; }
        .n-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .n-social-proof { display: flex; align-items: center; gap: 12px; }
        .n-avatars { display: flex; }
        .n-avatar { width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; margin-left: -8px; }
        .n-avatar:first-child { margin-left: 0; }
        .n-hero-img { width: 100%; aspect-ratio: 3/4; border-radius: 28px; overflow: hidden; background: var(--cream-2); position: relative; }
        .n-hero-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .n-hero-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #F5E8D0, #EDD8B8); }
        .n-hero-float { position: absolute; background: white; border-radius: 16px; padding: 12px 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
        .n-hero-float-1 { bottom: 28px; left: -20px; }
        .n-hero-float-2 { top: 28px; right: -20px; }
        .n-float-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
        .n-float-val { font-family: var(--site-font); font-size: 15px; font-weight: 800; color: var(--brown); }

        /* TICKER */
        .n-ticker { background: var(--orange); padding: 13px 0; overflow: hidden; }
        .n-ticker-track { display: flex; white-space: nowrap; ${tickerAnimated ? 'animation: nticker 24s linear infinite;' : ''} }
        .n-ticker-item { font-family: var(--site-font); font-size: 13px; font-weight: 700; color: white; padding: 0 36px; letter-spacing: 0.03em; }
        .n-ticker-item .n-hi { color: rgba(255,255,255,0.65); }
        @keyframes nticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }

        /* STAGES */
        .n-stages { background: white; padding: 88px 5%; overflow: hidden; }
        .n-stages-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 52px; gap: 20px; flex-wrap: wrap; }
        .n-section-label { font-size: 11px; font-weight: 700; color: var(--orange); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
        .n-section-title { font-family: var(--site-font); font-size: clamp(28px, 4vw, 42px); font-weight: 900; color: var(--brown); line-height: 1.12; }
        .n-section-title .n-orange { color: var(--orange); }

        /* Tinder-style swipe */
        .n-swipe-container { position: relative; height: 520px; touch-action: pan-y; user-select: none; }
        .n-swipe-card {
          position: absolute; width: 320px; border-radius: 24px; overflow: hidden;
          cursor: grab; transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s;
          will-change: transform; box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .n-swipe-card:active { cursor: grabbing; }
        .n-card-img { width: 100%; height: 300px; object-fit: cover; display: block; position: relative; }
        .n-card-img-inner { width: 100%; height: 300px; display: flex; align-items: center; justify-content: center; font-size: 80px; }
        .n-card-body { padding: 24px; }
        .n-card-name { font-family: var(--site-font); font-size: 22px; font-weight: 900; color: white; margin-bottom: 4px; }
        .n-card-age { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.75); margin-bottom: 10px; }
        .n-card-desc { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.65; }
        .n-stage-nav { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 28px; }
        .n-stage-btn { width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid rgba(44,26,14,0.15); background: white; color: var(--brown); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .n-stage-btn:hover { background: var(--orange); color: white; border-color: var(--orange); }
        .n-stage-dots { display: flex; gap: 6px; }
        .n-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(44,26,14,0.15); transition: all 0.3s; cursor: pointer; }
        .n-dot.active { background: var(--orange); width: 20px; border-radius: 4px; }

        /* HOW IT WORKS */
        .n-how { background: var(--brown); padding: 88px 5%; position: relative; overflow: hidden; }
        .n-how-bg { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.15; }
        .n-how-inner { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; }
        .n-how-head { text-align: center; margin-bottom: 60px; }
        .n-how-title { font-family: var(--site-font); font-size: clamp(30px, 4.5vw, 50px); font-weight: 900; color: white; margin-bottom: 12px; line-height: 1.1; }
        .n-how-subtitle { font-size: 16px; color: rgba(255,255,255,0.5); font-weight: 500; }
        /* HORIZONTAL steps */
        .n-how-steps { display: flex; gap: 0; align-items: flex-start; position: relative; }
        .n-how-step { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 20px; position: relative; }
        .n-how-connector { flex-shrink: 0; width: 60px; display: flex; align-items: center; justify-content: center; padding-top: 72px; }
        .n-how-connector-line { width: 100%; height: 2px; background: repeating-linear-gradient(to right, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 5px, transparent 5px, transparent 11px); }
        .n-how-icon-wrap { width: 140px; height: 140px; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 48px; overflow: hidden; flex-shrink: 0; }
        .n-how-icon-wrap img { width: 100%; height: 100%; object-fit: cover; border-radius: 24px; }
        .n-how-desc { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.7; font-weight: 500; max-width: 200px; }
        .n-how-cta { text-align: center; margin-top: 52px; }

        /* MENU */
        .n-menu { display: flex; min-height: 90vh; }
        .n-menu-left { width: 340px; min-width: 300px; background: var(--orange); display: flex; flex-direction: column; padding: 32px 32px 32px; position: relative; overflow: hidden; }
        .n-menu-left::before { content: ''; position: absolute; width: 580px; height: 580px; border-radius: 50%; background: rgba(0,0,0,0.07); top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .n-menu-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 36px; position: relative; z-index: 1; }
        .n-menu-logo { font-family: var(--site-font); font-size: 20px; font-weight: 900; color: white; text-decoration: none; }
        .n-menu-h { position: relative; z-index: 1; flex: 1; }
        .n-menu-h h2 { font-family: var(--site-font); font-size: 40px; font-weight: 900; color: white; line-height: 1.2; margin-bottom: 0; }
        .n-menu-tabs { display: flex; gap: 8px; position: relative; z-index: 1; margin-top: auto; padding-top: 20px; }
        .n-menu-tab { flex: 1; padding: 12px 6px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.35); background: transparent; color: rgba(255,255,255,0.7); font-family: var(--site-font); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-align: center; }
        .n-menu-tab.active { background: white; color: var(--orange); border-color: white; }
        .n-menu-tab:hover:not(.active) { background: rgba(255,255,255,0.12); color: white; }
        .n-menu-right { flex: 1; background: white; display: flex; align-items: center; justify-content: center; padding: 48px 40px; position: relative; overflow: hidden; }
        .n-menu-circle { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: var(--cream); top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 0; }
        .n-menu-content { position: relative; z-index: 1; width: 100%; max-width: 480px; text-align: center; }
        .n-meal-counter { font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: 0.06em; margin-bottom: 16px; }
        .n-meal-img { width: 240px; height: 240px; border-radius: 50%; overflow: hidden; margin: 0 auto 20px; background: var(--cream-2); display: flex; align-items: center; justify-content: center; font-size: 72px; border: 5px solid white; box-shadow: 0 12px 40px rgba(200,75,15,0.12); }
        .n-meal-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .n-meal-name { font-family: var(--site-font); font-size: 22px; font-weight: 900; color: var(--orange); margin-bottom: 8px; }
        .n-meal-desc { font-size: 14px; color: var(--muted); line-height: 1.65; margin-bottom: 18px; max-width: 380px; margin-inline: auto; font-weight: 500; }
        .n-nutr-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 14px; }
        .n-nutr-box { background: var(--orange); border-radius: 10px; padding: 12px 6px; text-align: center; }
        .n-nutr-val { font-family: var(--site-font); font-size: 18px; font-weight: 900; color: white; display: block; line-height: 1; margin-bottom: 3px; }
        .n-nutr-lbl { font-size: 9px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; }
        .n-allergen { display: inline-flex; align-items: center; gap: 7px; background: #FDF5E8; border-radius: 8px; padding: 8px 14px; border: 1px solid #F0DEC8; margin-bottom: 16px; font-size: 13px; color: var(--brown); font-weight: 600; }
        .n-meal-nav { display: flex; gap: 10px; justify-content: center; margin-bottom: 16px; }
        .n-meal-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--orange); color: white; border: none; font-size: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(200,75,15,0.25); transition: background 0.2s; }
        .n-meal-btn:hover { background: var(--orange-hover); }
        .n-meal-thumbs { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .n-thumb { width: 52px; height: 52px; border-radius: 50%; overflow: hidden; cursor: pointer; border: 2.5px solid transparent; transition: border-color 0.2s, transform 0.2s; background: var(--cream-2); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .n-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .n-thumb.active { border-color: var(--orange); transform: scale(1.1); }

        /* WHY / INGREDIENTS */
        .n-why { background: var(--cream); padding: 88px 5%; }
        .n-why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; max-width: 1200px; margin: 0 auto; }
        .n-why-title { font-family: var(--site-font); font-size: clamp(44px, 6vw, 76px); font-weight: 900; line-height: 1.05; margin-bottom: 32px; color: var(--brown); }
        .n-why-title .n-orange { color: var(--orange); }
        .n-why-points { display: flex; flex-direction: column; gap: 16px; margin-bottom: 36px; }
        .n-why-point-title { font-family: var(--site-font); font-size: 15px; font-weight: 800; margin-bottom: 3px; }
        .n-why-point-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 500; }
        .n-ing-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        .n-ing-card { border-radius: 16px; overflow: hidden; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .n-ing-img { width: 100%; height: 90px; position: relative; }
        .n-ing-img img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 12px; }
        .n-ing-img-placeholder { width: 100%; height: 90px; background: var(--cream-2); display: flex; align-items: center; justify-content: center; font-size: 32px; border-radius: 12px; }
        .n-ing-name { font-family: var(--site-font); font-size: 12px; font-weight: 800; color: var(--brown); padding: 8px 10px 2px; }
        .n-ing-desc { font-size: 11px; color: var(--muted); padding: 0 10px 10px; line-height: 1.4; }
        .n-why-photo { width: 100%; aspect-ratio: 3/4; border-radius: 28px; overflow: hidden; background: var(--cream-2); display: flex; align-items: center; justify-content: center; font-size: 80px; position: relative; }
        .n-why-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* FAQ */
        .n-faq { background: white; padding: 88px 5%; }
        .n-faq-inner { max-width: 720px; margin: 0 auto; }
        .n-faq-head { text-align: center; margin-bottom: 48px; }
        .n-faq-item { border-bottom: 1px solid rgba(44,26,14,0.08); }
        .n-faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 20px 0; background: none; border: none; cursor: pointer; font-family: var(--site-font); font-size: 16px; font-weight: 700; color: var(--brown); text-align: left; gap: 16px; }
        .n-faq-icon { width: 28px; height: 28px; border-radius: 50%; background: rgba(200,75,15,0.08); color: var(--orange); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; transition: transform 0.3s, background 0.2s; }
        .n-faq-icon.open { transform: rotate(45deg); background: var(--orange); color: white; }
        .n-faq-a { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.25s; }
        .n-faq-a.open { max-height: 300px; padding-bottom: 18px; }
        .n-faq-a p { font-size: 14px; color: var(--muted); line-height: 1.75; font-weight: 500; }

        /* FOOTER */
        .n-footer { }
        .n-footer-hero { background: var(--orange); padding: 60px 5%; text-align: center; position: relative; overflow: hidden; }
        .n-footer-toys { position: absolute; inset: 0; pointer-events: none; }
        .n-toy { position: absolute; font-size: 52px; opacity: 0.1; user-select: none; }
        .n-footer-word { font-family: var(--site-font); font-size: clamp(64px, 12vw, 120px); font-weight: 900; color: rgba(255,255,255,0.2); line-height: 1; position: relative; z-index: 1; letter-spacing: -3px; }
        .n-footer-cols { background: var(--cream); padding: 56px 5% 40px; display: grid; grid-template-columns: repeat(4,1fr); gap: 40px; border-top: 1px solid rgba(44,26,14,0.07); }
        .n-footer-col-title { font-family: var(--site-font); font-size: 14px; font-weight: 900; color: var(--orange); margin-bottom: 16px; display: block; text-transform: uppercase; letter-spacing: 0.06em; }
        .n-footer-text { font-size: 13px; color: var(--muted); line-height: 1.75; }
        .n-footer-bullets { list-style: none; margin: 10px 0 14px; }
        .n-footer-bullets li { font-size: 13px; color: var(--muted); padding: 3px 0; display: flex; gap: 8px; line-height: 1.4; }
        .n-footer-bullets li::before { content: '–'; color: var(--orange); flex-shrink: 0; }
        .n-footer-links-list { display: flex; flex-direction: column; gap: 10px; }
        .n-footer-link { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; font-weight: 500; }
        .n-footer-link:hover { color: var(--orange); }
        .n-contact-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .n-contact-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(200,75,15,0.08); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .n-contact-text { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .n-contact-text a { color: var(--orange); text-decoration: none; font-weight: 600; }
        .n-sub-input { width: 100%; padding: 11px 14px; border: 1.5px solid rgba(44,26,14,0.1); border-radius: 10px; font-size: 13px; font-family: var(--site-font); color: var(--brown); outline: none; transition: border-color 0.2s; box-sizing: border-box; margin-bottom: 8px; background: white; }
        .n-sub-input:focus { border-color: var(--orange); }
        .n-footer-bottom { background: var(--brown); padding: 16px 5%; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .n-footer-copy { font-size: 12px; color: rgba(255,255,255,0.35); }
        .n-footer-bl { display: flex; gap: 20px; }
        .n-footer-bl a { font-size: 12px; color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.2s; }
        .n-footer-bl a:hover { color: rgba(255,255,255,0.7); }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .n-footer-cols { grid-template-columns: repeat(2,1fr); }
          .n-why-grid { grid-template-columns: 1fr; gap: 48px; }
          .n-menu { flex-direction: column; }
          .n-menu-left { width: 100%; min-width: unset; min-height: 50vh; }
        }
        @media (max-width: 768px) {
          .n-nav-links { display: none; }
          .n-hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .n-hero-img { aspect-ratio: 4/3; }
          .n-hero-h1 { font-size: 40px; letter-spacing: -1px; }
          .n-how-steps { flex-direction: column; gap: 32px; }
          .n-how-connector { display: none; }
          .n-how-step { padding: 0; }
          .n-ing-grid { grid-template-columns: repeat(2,1fr); }
          .n-footer-cols { grid-template-columns: 1fr; }
          .n-nutr-grid { grid-template-columns: repeat(2,1fr); }
          .n-swipe-container { height: 460px; }
        }
        @media (max-width: 480px) {
          .n-hero-h1 { font-size: 34px; }
          .n-why-title { font-size: 40px; }
          .n-footer-word { font-size: 56px; }
          .n-hero-btns { flex-direction: column; }
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav className="n-nav">
        <Link href="/" className="n-logo">
          {logo?.url ? (
            <img src={logo.url} alt={logo.alt_text || 'Ninoz'} />
          ) : (
            <span className="n-logo-text">Ninoz</span>
          )}
        </Link>
        <div className="n-nav-links">
          {[
            { label: 'How It Works', id: 'how' },
            { label: 'Menu', id: 'menu' },
            { label: 'Plans', id: 'stages' },
            { label: 'FAQ', id: 'faq' },
          ].map(item => (
            <button key={item.label} className="n-nav-link"
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}>
              {item.label}
            </button>
          ))}
        </div>
        <button className="n-btn" onClick={() => setShowPopup(true)}>
          {cv(content, 'nav_cta_text', 'Start Your Plan')}
        </button>
      </nav>

      {/* ══ HERO ══ */}
      <section className="n-hero" id="hero">
        <div className="n-hero-grid">
          <div>
            <div className="n-hero-badge n-reveal">
              🌿 {cv(content, 'hero_badge', 'Fresh · Organic · Daily Delivery in Riyadh')}
            </div>
            <h1 className="n-hero-h1 n-reveal n-d1">
              {cv(content, 'hero_headline_1', 'You Care.')}<br />
              <span className="n-orange">{cv(content, 'hero_headline_2', 'We Prepare.')}</span>
            </h1>
            <p className="n-hero-desc n-reveal n-d1">
              {cv(content, 'hero_description', 'Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.')}
            </p>
            <div className="n-trust-row n-reveal n-d2">
              {['Fresh Ingredients', 'No Preservatives', 'Cooked Daily', 'Pediatrician Approved'].map(t => (
                <div key={t} className="n-trust-item">
                  <div className="n-trust-dot" />
                  {t}
                </div>
              ))}
            </div>
            <div className="n-hero-btns n-reveal n-d2">
              <button className="n-btn" onClick={() => setShowPopup(true)}>
                {cv(content, 'hero_btn_primary', 'Start Your Plan')}
              </button>
              <button className="n-btn-ghost"
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>
                {cv(content, 'hero_btn_secondary', 'Explore Meals')}
              </button>
            </div>
            <div className="n-social-proof n-reveal n-d3">
              <div className="n-avatars">
                {['#FFB347','#E8834A','#C84B0F','#7A7068','#2C1A0E'].map((c, i) => (
                  <div key={i} className="n-avatar" style={{ background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                {cv(content, 'hero_social_proof', 'Trusted by 200+ Riyadh mothers')}
              </span>
            </div>
          </div>

          <div className="n-hero-img n-reveal n-d1" style={{ position: 'relative' }}>
            {heroImageUrl ? (
              <img src={heroImageUrl} alt="Ninoz" />
            ) : (
              <div className="n-hero-img-placeholder">
                <span style={{ fontSize: 100 }}>👶</span>
              </div>
            )}
            <div className="n-hero-float n-hero-float-1">
              <div className="n-float-label">Daily Fresh</div>
              <div className="n-float-val">Cooked Every Morning</div>
            </div>
            <div className="n-hero-float n-hero-float-2">
              <div className="n-float-label">Nutritionist</div>
              <div className="n-float-val">Approved ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <div className="n-ticker">
        <div className="n-ticker-track">
          {(tickerAnimated ? [1, 2] : [1]).map(rep =>
            tickerItems.map((item, i) => (
              <span key={`${rep}-${i}`} className="n-ticker-item">
                <span className="n-hi">{item.split(' ')[0]}</span>{' '}
                {item.split(' ').slice(1).join(' ')}
                {' · '}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ STAGES ══ */}
      <section className="n-stages" id="stages">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="n-stages-head n-reveal">
            <div>
              <div className="n-section-label">Our Plans</div>
              <h2 className="n-section-title">
                {cv(content, 'stages_title', 'Fresh Meals Built for').replace(cv(content, 'stages_title_highlight', 'Their Stage'), '').trim()}{' '}
                <span className="n-orange">{cv(content, 'stages_title_highlight', 'Their Stage')}</span>
              </h2>
            </div>
            <button className="n-btn" onClick={() => setShowPopup(true)}>
              {cv(content, 'stages_cta', 'Start Your Plan')}
            </button>
          </div>

          {/* Tinder-style cards */}
          <div className="n-swipe-container n-reveal"
            onTouchStart={onStageTouchStart}
            onTouchEnd={onStageTouchEnd}>
            {stages.map((stage, idx) => {
              const offset = idx - stageIndex
              const isActive = idx === stageIndex
              const scale = isActive ? 1 : Math.max(0.88 - Math.abs(offset) * 0.06, 0.7)
              const translateX = offset * 340
              const translateY = Math.abs(offset) * 10
              const zIndex = stages.length - Math.abs(offset)
              const opacity = Math.abs(offset) > 2 ? 0 : Math.max(1 - Math.abs(offset) * 0.3, 0)
              return (
                <div key={stage.id} className="n-swipe-card"
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                    zIndex, opacity,
                    left: '50%', marginLeft: -160,
                    top: 0,
                  }}
                  onClick={() => !isActive && setStageIndex(idx)}>
                  <div className="n-card-img-inner" style={{ background: stage.card_bg || '#F5EDE0' }}>
                    {stage.image_url ? (
                      <img src={stage.image_url} alt={stage.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 80 }}>{stage.emoji}</span>
                    )}
                    {stage.tag && (
                      <div style={{ position: 'absolute', top: 14, right: 14, background: stage.tag_color || 'var(--orange)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50 }}>
                        {stage.tag}
                      </div>
                    )}
                  </div>
                  <div className="n-card-body" style={{ background: stage.card_bg || '#F5EDE0' }}>
                    <div className="n-card-name" style={{ color: 'var(--brown)' }}>{stage.name}</div>
                    <div className="n-card-age" style={{ color: 'var(--orange)' }}>{stage.age_range}</div>
                    <div className="n-card-desc" style={{ color: 'var(--muted)' }}>{stage.description}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="n-stage-nav">
            <div className="n-stage-dots">
              {stages.map((_, idx) => (
                <div key={idx} className={`n-dot ${idx === stageIndex ? 'active' : ''}`}
                  onClick={() => setStageIndex(idx)} />
              ))}
            </div>
            <button className="n-stage-btn" onClick={() => setStageIndex(i => Math.max(i - 1, 0))}>←</button>
            <button className="n-stage-btn" onClick={() => setStageIndex(i => Math.min(i + 1, stages.length - 1))}>→</button>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="n-how" id="how">
        <div className="n-how-inner">
          <div className="n-how-head n-reveal">
            <div className="n-section-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Process</div>
            <h2 className="n-how-title">{cv(content, 'how_title', 'How Ninoz Works')}</h2>
            <p className="n-how-subtitle">{cv(content, 'how_subtitle', 'Three steps to peace of mind — and a well-fed baby.')}</p>
          </div>

          <div className="n-how-steps n-reveal n-d1">
            {howSteps.map((step, i) => (
              <>
                <div key={step.id} className="n-how-step">
                  <div className="n-how-icon-wrap" style={{ background: step.icon_bg || (i === 0 ? '#F5EDE0' : i === 1 ? '#F0A030' : '#C84B0F') }}>
                    {step.icon_url ? (
                      <img src={step.icon_url} alt="" />
                    ) : (
                      <span>{i === 0 ? '📋' : i === 1 ? '👨‍🍳' : '🚚'}</span>
                    )}
                  </div>
                  <p className="n-how-desc">{step.description}</p>
                </div>
                {i < howSteps.length - 1 && (
                  <div key={`conn-${i}`} className="n-how-connector">
                    <div className="n-how-connector-line" />
                  </div>
                )}
              </>
            ))}
          </div>

          <div className="n-how-cta n-reveal n-d2">
            <button className="n-btn" style={{ padding: '14px 48px', fontSize: 15 }}
              onClick={() => setShowPopup(true)}>
              {cv(content, 'how_cta', 'Get Started')}
            </button>
          </div>
        </div>
      </section>

      {/* ══ MENU ══ */}
      <section className="n-menu" id="menu">
        <div className="n-menu-left">
          <div className="n-menu-top">
            <Link href="/" className="n-menu-logo">Ninoz</Link>
            <button className="n-btn" style={{ fontSize: 12, padding: '9px 16px' }}
              onClick={() => setShowPopup(true)}>
              {cv(content, 'menu_cta', 'Start your plan')}
            </button>
          </div>
          <div className="n-menu-h">
            <h2>
              {[
                cv(content, 'menu_headline_1', 'Real Food'),
                cv(content, 'menu_headline_2', 'Real Ingredients'),
                cv(content, 'menu_headline_3', 'Every Single Day'),
              ].map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}
            </h2>
          </div>
          <div className="n-menu-tabs">
            {(['breakfast', 'lunch', 'dinner'] as const).map(tab => (
              <button key={tab}
                className={`n-menu-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {cv(content, `menu_tab_${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
              </button>
            ))}
          </div>
        </div>

        <div className="n-menu-right"
          onTouchStart={onMealTouchStart}
          onTouchEnd={onMealTouchEnd}>
          <div className="n-menu-circle" />
          <div className="n-menu-content">
            {currentMeal ? (
              <>
                <div className="n-meal-counter">
                  {mealIndex + 1} / {totalMeals} meals
                </div>
                <div className="n-meal-img">
                  {currentMeal.image_url ? (
                    <img src={currentMeal.image_url} alt={currentMeal.name} />
                  ) : <span>🍽️</span>}
                </div>
                <div className="n-meal-name">{currentMeal.name}</div>
                <div className="n-meal-desc">{currentMeal.description}</div>

                {(currentMeal.weight_g || currentMeal.protein_g) && (
                  <div className="n-nutr-grid">
                    {[
                      { val: currentMeal.weight_g, lbl: 'Weight' },
                      { val: currentMeal.protein_g, lbl: 'Protein' },
                      { val: currentMeal.carbs_g, lbl: 'Carbs' },
                      { val: currentMeal.fiber_g, lbl: 'Fiber' },
                    ].filter(n => n.val).map(n => (
                      <div key={n.lbl} className="n-nutr-box">
                        <span className="n-nutr-val">{n.val}</span>
                        <span className="n-nutr-lbl">{n.lbl}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentMeal.allergens && (
                  <div className="n-allergen">⚠️ Allergen: <strong style={{ marginLeft: 4 }}>{currentMeal.allergens}</strong></div>
                )}

                <div className="n-meal-nav">
                  <button className="n-meal-btn" onClick={prevMeal}>←</button>
                  <button className="n-meal-btn" onClick={nextMeal}>→</button>
                </div>

                <div className="n-meal-thumbs">
                  {filteredMeals.slice(0, 5).map((meal, idx) => (
                    <div key={meal.id}
                      className={`n-thumb ${idx === mealIndex % totalMeals ? 'active' : ''}`}
                      onClick={() => setMealIndex(idx)}>
                      {meal.image_url ? <img src={meal.image_url} alt={meal.name} /> : <span>🍽️</span>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🍽️</div>
                <p>No meals yet. Add from admin portal.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ WHY / INGREDIENTS ══ */}
      <section className="n-why" id="ingredients">
        <div className="n-why-grid">
          <div className="n-reveal">
            <h2 className="n-why-title">
              Only <span className="n-orange">Real</span><br />Ingredients
            </h2>
            <div className="n-why-points">
              {whyPoints.map(point => (
                <div key={point.id}>
                  <div className="n-why-point-title" style={{ color: point.title_color || 'var(--orange)' }}>
                    {point.title}
                  </div>
                  <div className="n-why-point-desc">{point.description}</div>
                </div>
              ))}
            </div>
            {ingredients.length > 0 && (
              <div className="n-ing-grid">
                {ingredients.slice(0, 4).map(ing => (
                  <div key={ing.id} className="n-ing-card">
                    <div className="n-ing-img">
                      {ing.image_url ? (
                        <img src={ing.image_url} alt={ing.name} style={{ borderRadius: 12 }} />
                      ) : (
                        <div className="n-ing-img-placeholder">🥕</div>
                      )}
                    </div>
                    <div className="n-ing-name">{ing.name}</div>
                    <div className="n-ing-desc">{ing.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="n-reveal n-d2">
            <div className="n-why-photo">
              {whyImageUrl ? (
                <img src={whyImageUrl} alt="Why Ninoz" />
              ) : (
                <span>👶</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      {faqs.length > 0 && (
        <section className="n-faq" id="faq">
          <div className="n-faq-inner">
            <div className="n-faq-head n-reveal">
              <div className="n-section-label">FAQ</div>
              <h2 className="n-section-title">{cv(content, 'faq_title', 'Common Questions')}</h2>
              <p style={{ fontSize: 15, color: 'var(--muted)', marginTop: 10 }}>
                {cv(content, 'faq_subtitle', 'Everything you need to know about Ninoz.')}
              </p>
            </div>
            <div className="n-reveal n-d1">
              {faqs.map(faq => (
                <div key={faq.id} className="n-faq-item">
                  <button className="n-faq-q" onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                    <span>{faq.question}</span>
                    <div className={`n-faq-icon ${openFaq === faq.id ? 'open' : ''}`}>+</div>
                  </button>
                  <div className={`n-faq-a ${openFaq === faq.id ? 'open' : ''}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FOOTER ══ */}
      <footer className="n-footer">
        <div className="n-footer-hero">
          <div className="n-footer-toys">
            {[
              { top: '10%', left: '4%', e: '🪆' }, { top: '60%', left: '2%', e: '🚲' },
              { top: '15%', left: '18%', e: '🧸' }, { top: '10%', right: '18%', e: '🏀' },
              { top: '65%', right: '15%', e: '🪀' }, { top: '12%', right: '4%', e: '🚂' },
              { top: '60%', right: '2%', e: '⚽' },
            ].map((t, i) => (
              <span key={i} className="n-toy" style={{ top: t.top, left: (t as any).left, right: (t as any).right }}>{t.e}</span>
            ))}
          </div>
          <div className="n-footer-word">Ninoz</div>
        </div>

        <div className="n-footer-cols">
          <div>
            <span className="n-footer-col-title">{cv(content, 'footer_about_title', 'About Ninoz')}</span>
            <div className="n-footer-text">
              <strong style={{ color: 'var(--brown)', display: 'block', marginBottom: 4, fontWeight: 700 }}>Hi. We're Ninoz.</strong>
              {cv(content, 'footer_about_text', 'We cook fresh daily meals for babies and toddlers in Riyadh.')}
            </div>
            <ul className="n-footer-bullets">
              {['Cooked the morning of delivery', "Designed for your baby's stage", 'Approved by a pediatric nutritionist', 'Free from salt, sugar and preservatives'].map(b => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="n-footer-text" style={{ fontStyle: 'italic' }}>
              {cv(content, 'footer_about_closing', 'You handle the love. We handle the food.')}
            </div>
          </div>

          <div>
            <span className="n-footer-col-title">{cv(content, 'footer_links_title', 'Useful Links')}</span>
            <div className="n-footer-links-list">
              {footerLinks.map(link => (
                <a key={link.id} href={link.url} className="n-footer-link">{link.label}</a>
              ))}
            </div>
          </div>

          <div>
            <span className="n-footer-col-title">{cv(content, 'footer_contact_title', 'Get in Touch')}</span>
            <div className="n-contact-item">
              <div className="n-contact-icon">☺️</div>
              <div className="n-contact-text">{cv(content, 'footer_contact_tagline', "We'd love to hear from you")}</div>
            </div>
            {cv(content, 'footer_contact_whatsapp') && (
              <div className="n-contact-item">
                <div className="n-contact-icon">📱</div>
                <div className="n-contact-text">
                  <a href={`https://wa.me/${cv(content, 'footer_contact_whatsapp')}`} target="_blank" rel="noreferrer">WhatsApp Us</a>
                </div>
              </div>
            )}
            <div className="n-contact-item">
              <div className="n-contact-icon">📧</div>
              <div className="n-contact-text">
                <a href={`mailto:${cv(content, 'footer_contact_email', 'hello@ninoz.sa')}`}>
                  {cv(content, 'footer_contact_email', 'hello@ninoz.sa')}
                </a>
              </div>
            </div>
          </div>

          <div>
            <span className="n-footer-col-title">{cv(content, 'footer_subscribe_title', 'Subscribe Now')}</span>
            <p className="n-footer-text" style={{ marginBottom: 14 }}>Enter your email to start your plan.</p>
            {subscribed ? (
              <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                ✓ You're on the list!
              </div>
            ) : (
              <>
                <input className="n-sub-input" type="email" placeholder="your@email.com"
                  value={subscribeEmail} onChange={e => setSubscribeEmail(e.target.value)} />
                <button className="n-btn" style={{ width: '100%', borderRadius: 10, justifyContent: 'center' }}
                  onClick={() => { if (subscribeEmail.includes('@')) { setSubscribed(true); setShowPopup(true) } }}>
                  Start Your Plan →
                </button>
              </>
            )}
          </div>
        </div>

        <div className="n-footer-bottom">
          <span className="n-footer-copy">{cv(content, 'footer_copyright', '© 2025 Ninoz. All rights reserved.')}</span>
          <div className="n-footer-bl">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Allergens</a>
          </div>
        </div>
      </footer>

      {showPopup && (
        <SubscriptionPopup
          stages={stages}
          paymentCycles={paymentCycles}
          content={content}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  )
}
