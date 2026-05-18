'use client'

// ══════════════════════════════════════════════════════════
// HomeClient.tsx — v6
// Complete homepage: Hero, Stages carousel, How It Works,
// Menu section, Ingredients, Footer, Subscription popup
// 100% responsive, touch/swipe enabled, Arabic ready
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import SubscriptionPopup from '@/components/SubscriptionPopup'

// ── TYPES ──────────────────────────────────────────────────
type Stage = {
  id: string; name: string; age_range: string; description: string
  emoji: string; card_bg: string; image_url: string | null
  tag: string | null; tag_color: string; is_clickable: boolean; position: number
}
type Meal = {
  id: string; stage_id: string; name: string; description: string
  meal_type: 'breakfast' | 'lunch' | 'dinner'; image_url: string | null
  allergens: string; weight_g: string; protein_g: string
  carbs_g: string; fiber_g: string; tag: string | null
}
type HowStep = { id: string; icon_url: string | null; icon_bg: string; description: string; position: number }
type WhyPoint = { id: string; title: string; description: string; title_color: string }
type Ingredient = { id: string; name: string; description: string; image_url: string | null }
type FooterLink = { id: string; label: string; url: string }
type Logo = { url: string | null; alt_text: string }
type PaymentCycle = { id: string; label: string; days: number; meals_total: number; price_sar: number }

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
}

const c = (content: Record<string, string>, key: string, fallback = '') =>
  content[key] || fallback

export default function HomeClient({
  stages, meals, content, howSteps, whyPoints,
  ingredients, footerLinks, logo, paymentCycles
}: Props) {

  const [showPopup, setShowPopup] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast')
  const [mealIndex, setMealIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [heroLoaded, setHeroLoaded] = useState(false)

  // Swipe state for stages
  const stagesDragStart = useRef<number | null>(null)
  const mealsDragStart = useRef<number | null>(null)

  useEffect(() => {
    setHeroLoaded(true)
    // Reveal on scroll
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('v6-visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.v6-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Reset meal index when tab changes
  useEffect(() => { setMealIndex(0) }, [activeTab])

  const filteredMeals = meals.filter(m => m.meal_type === activeTab)
  const currentMeal = filteredMeals[mealIndex] || null
  const currentStage = stages[stageIndex] || null

  // Swipe handlers for stages
  function onStagesTouchStart(e: React.TouchEvent) { stagesDragStart.current = e.touches[0].clientX }
  function onStagesTouchEnd(e: React.TouchEvent) {
    if (stagesDragStart.current === null) return
    const diff = stagesDragStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setStageIndex(i => Math.min(i + 1, stages.length - 1))
      else setStageIndex(i => Math.max(i - 1, 0))
    }
    stagesDragStart.current = null
  }

  // Swipe handlers for meals
  function onMealsTouchStart(e: React.TouchEvent) { mealsDragStart.current = e.touches[0].clientX }
  function onMealsTouchEnd(e: React.TouchEvent) {
    if (mealsDragStart.current === null) return
    const diff = mealsDragStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setMealIndex(i => Math.min(i + 1, filteredMeals.length - 1))
      else setMealIndex(i => Math.max(i - 1, 0))
    }
    mealsDragStart.current = null
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&family=Nunito+Sans:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Nunito Sans', sans-serif; overflow-x: hidden; }

        :root {
          --orange: #C84B0F;
          --orange-light: #E8834A;
          --cream: #FAF5EE;
          --cream-dark: #F0E8D8;
          --brown: #2C1A0E;
          --brown-light: #7A7068;
          --gold: #FFD580;
        }

        /* ── REVEAL ── */
        .v6-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .v6-reveal.v6-visible { opacity: 1; transform: none; }
        .v6-d1 { transition-delay: 0.1s; }
        .v6-d2 { transition-delay: 0.2s; }
        .v6-d3 { transition-delay: 0.3s; }
        .v6-d4 { transition-delay: 0.4s; }

        /* ── NAVBAR ── */
        .v6-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          background: rgba(250,245,238,0.95); backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(44,26,14,0.08);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 5%; height: 68px;
        }
        .v6-logo {
          font-family: 'Nunito', sans-serif; font-size: 28px; font-weight: 900;
          color: var(--orange); text-decoration: none; line-height: 1;
        }
        .v6-nav-links { display: flex; gap: 28px; align-items: center; }
        .v6-nav-link {
          font-size: 14px; font-weight: 600; color: var(--brown); opacity: 0.6;
          background: none; border: none; cursor: pointer; transition: opacity 0.2s;
          text-decoration: none; font-family: 'Nunito Sans', sans-serif;
        }
        .v6-nav-link:hover { opacity: 1; }
        .v6-btn-primary {
          background: var(--orange); color: white; border: none;
          padding: 12px 26px; border-radius: 50px;
          font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          white-space: nowrap; text-decoration: none; display: inline-block;
        }
        .v6-btn-primary:hover { background: #A33A0A; transform: translateY(-1px); }
        .v6-btn-secondary {
          background: rgba(44,26,14,0.07); color: var(--brown); border: none;
          padding: 12px 26px; border-radius: 50px;
          font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.2s; text-decoration: none; display: inline-block;
        }
        .v6-btn-secondary:hover { background: rgba(44,26,14,0.12); }

        /* ── HERO ── */
        .v6-hero {
          min-height: 100vh; background: var(--cream);
          display: flex; align-items: center; padding: 80px 5% 60px;
        }
        .v6-hero-inner {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center; max-width: 1200px; width: 100%; margin: 0 auto;
        }
        .v6-hero-headline {
          font-family: 'Nunito', sans-serif;
          font-size: clamp(42px, 5.5vw, 70px);
          font-weight: 900; color: var(--brown); line-height: 1.08;
          letter-spacing: -1.5px; margin-bottom: 20px;
        }
        .v6-hero-headline .orange { color: var(--orange); }
        .v6-hero-img {
          width: 100%; aspect-ratio: 4/5; border-radius: 32px;
          overflow: hidden; position: relative;
          background: linear-gradient(135deg, #F0E0C8, #E8D0B8);
        }
        .v6-hero-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .v6-hero-img-placeholder {
          width: 100%; height: 100%; display: flex; align-items: center;
          justify-content: center; font-size: 100px;
        }
        .v6-trust-badges { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
        .v6-trust-badge {
          display: flex; align-items: center; gap: 7px;
          font-size: 13px; color: var(--brown-light); font-weight: 600;
        }
        .v6-trust-icon {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(200,75,15,0.1); display: flex;
          align-items: center; justify-content: center; font-size: 15px;
        }
        .v6-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
        .v6-social-proof { display: flex; align-items: center; gap: 10px; margin-top: 20px; }

        /* ── TICKER ── */
        .v6-ticker { background: var(--orange); padding: 14px 0; overflow: hidden; }
        .v6-ticker-track {
          display: flex; gap: 0; white-space: nowrap;
          animation: v6ticker 20s linear infinite;
        }
        .v6-ticker-item {
          font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800;
          color: white; padding: 0 40px; letter-spacing: 0.02em;
        }
        .v6-ticker-item .highlight { color: var(--gold); }
        @keyframes v6ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }

        /* ── STAGES ── */
        .v6-stages { background: white; padding: 80px 5%; overflow: hidden; }
        .v6-stages-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 48px; flex-wrap: wrap; gap: 16px;
        }
        .v6-stages-title {
          font-family: 'Nunito', sans-serif; font-size: clamp(28px, 4vw, 44px);
          font-weight: 900; color: var(--brown); line-height: 1.1;
        }
        .v6-stages-title .orange { color: var(--orange); }
        .v6-stages-carousel { position: relative; }
        .v6-stage-track {
          display: flex; transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform; touch-action: pan-y;
        }
        .v6-stage-card {
          min-width: calc(33.333% - 16px); margin-right: 24px;
          border-radius: 28px; overflow: hidden; flex-shrink: 0;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .v6-stage-card.active { transform: scale(1.02); box-shadow: 0 24px 60px rgba(200,75,15,0.2); }
        .v6-stage-img {
          width: 100%; height: 280px; object-fit: cover; display: block;
          background: var(--cream-dark); display: flex; align-items: center;
          justify-content: center; font-size: 80px; position: relative; overflow: hidden;
        }
        .v6-stage-img img { width: 100%; height: 100%; object-fit: cover; }
        .v6-stage-tag {
          position: absolute; top: 14px; right: 14px;
          padding: 4px 14px; border-radius: 50px; font-size: 11px;
          font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .v6-stage-body { padding: 28px; }
        .v6-stage-name {
          font-family: 'Nunito', sans-serif; font-size: 26px; font-weight: 900;
          color: white; margin-bottom: 6px;
        }
        .v6-stage-age {
          font-family: 'Nunito', sans-serif; font-size: 22px; font-weight: 800;
          color: rgba(255,255,255,0.85); margin-bottom: 12px;
        }
        .v6-stage-desc { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.6; }
        .v6-stage-nav {
          display: flex; justify-content: center; align-items: center;
          gap: 16px; margin-top: 32px;
        }
        .v6-stage-nav-btn {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--cream); border: 2px solid rgba(200,75,15,0.2);
          color: var(--orange); font-size: 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .v6-stage-nav-btn:hover { background: var(--orange); color: white; border-color: var(--orange); }
        .v6-stage-dots { display: flex; gap: 8px; }
        .v6-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(200,75,15,0.2); transition: all 0.3s; cursor: pointer;
        }
        .v6-dot.active { background: var(--orange); width: 24px; border-radius: 4px; }

        /* ── HOW IT WORKS ── */
        .v6-how {
          position: relative; overflow: hidden;
          background: var(--brown); padding: 100px 5%;
        }
        .v6-how-bg {
          position: absolute; inset: 0; background-size: cover;
          background-position: center; opacity: 0.25;
        }
        .v6-how-content { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; }
        .v6-how-title {
          font-family: 'Nunito', sans-serif; font-size: clamp(32px, 5vw, 56px);
          font-weight: 900; color: white; text-align: center;
          margin-bottom: 12px; line-height: 1.1;
        }
        .v6-how-title .orange { color: var(--orange-light); }
        .v6-how-subtitle {
          text-align: center; font-size: 18px; color: rgba(255,255,255,0.65);
          margin-bottom: 64px; font-weight: 600;
        }
        .v6-how-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; position: relative; }
        .v6-how-step { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 24px; position: relative; }
        .v6-how-step:not(:last-child)::after {
          content: ''; position: absolute; top: 72px; right: -24px;
          width: 48px; height: 2px;
          background: repeating-linear-gradient(to right, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 6px, transparent 6px, transparent 12px);
        }
        .v6-how-icon {
          width: 144px; height: 144px; border-radius: 28px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px; font-size: 52px; position: relative;
          overflow: hidden;
        }
        .v6-how-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 28px; }
        .v6-how-desc {
          font-size: 15px; color: rgba(255,255,255,0.8);
          line-height: 1.7; font-weight: 600; max-width: 220px;
        }
        .v6-how-cta { text-align: center; margin-top: 56px; }

        /* ── MENU SECTION ── */
        .v6-menu { display: flex; min-height: 100vh; }
        .v6-menu-left {
          width: 360px; min-width: 320px; background: var(--orange);
          position: relative; display: flex; flex-direction: column;
          padding: 32px 36px 36px; overflow: hidden;
        }
        .v6-menu-left::before {
          content: ''; position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: rgba(0,0,0,0.08);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .v6-menu-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; position: relative; z-index: 1; }
        .v6-menu-logo { font-family: 'Nunito', sans-serif; font-size: 22px; font-weight: 900; color: white; }
        .v6-menu-headline { position: relative; z-index: 1; flex: 1; }
        .v6-menu-headline h2 {
          font-family: 'Nunito', sans-serif; font-size: 44px; font-weight: 900;
          color: white; line-height: 1.15; margin-bottom: 32px;
        }
        .v6-menu-tabs { display: flex; gap: 10px; position: relative; z-index: 1; margin-top: auto; }
        .v6-menu-tab {
          flex: 1; padding: 14px 8px; border-radius: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          background: transparent; color: rgba(255,255,255,0.75);
          font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 800;
          cursor: pointer; transition: all 0.2s; text-align: center;
        }
        .v6-menu-tab.active { background: white; color: var(--orange); border-color: white; }
        .v6-menu-tab:hover:not(.active) { background: rgba(255,255,255,0.15); color: white; }

        .v6-menu-right {
          flex: 1; background: white; display: flex; flex-direction: column;
          align-items: center; padding: 48px 40px; position: relative;
          overflow: hidden;
        }
        .v6-menu-circle {
          position: absolute; width: 520px; height: 520px; border-radius: 50%;
          background: var(--cream); top: 50%; left: 50%;
          transform: translate(-50%, -50%); z-index: 0;
        }
        .v6-menu-content { position: relative; z-index: 1; width: 100%; max-width: 500px; text-align: center; }
        .v6-meal-img-wrap {
          width: 260px; height: 260px; border-radius: 50%; overflow: hidden;
          margin: 0 auto 24px; background: var(--cream-dark);
          display: flex; align-items: center; justify-content: center;
          font-size: 80px; border: 6px solid white;
          box-shadow: 0 16px 48px rgba(200,75,15,0.15);
        }
        .v6-meal-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .v6-meal-name {
          font-family: 'Nunito', sans-serif; font-size: 22px; font-weight: 900;
          color: var(--orange); margin-bottom: 10px;
        }
        .v6-meal-desc {
          font-size: 14px; color: var(--brown); font-weight: 600;
          line-height: 1.65; margin-bottom: 20px; max-width: 400px; margin-inline: auto;
        }
        .v6-nutrition-boxes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .v6-nutr-box {
          background: var(--orange); border-radius: 12px;
          padding: 14px 8px; text-align: center;
        }
        .v6-nutr-val {
          font-family: 'Nunito', sans-serif; font-size: 20px; font-weight: 900;
          color: white; display: block; line-height: 1; margin-bottom: 4px;
        }
        .v6-nutr-lbl { font-size: 10px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
        .v6-allergen {
          display: flex; align-items: center; gap: 8px;
          background: #FDF5E8; border-radius: 10px; padding: 10px 14px;
          border: 1px solid #F0DEC8; margin-bottom: 20px; justify-content: center;
          font-size: 13px; color: var(--brown); font-weight: 600;
        }
        .v6-meal-arrows { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
        .v6-arrow-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--orange); color: white; border: none;
          font-size: 18px; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: background 0.2s; box-shadow: 0 4px 12px rgba(200,75,15,0.3);
        }
        .v6-arrow-btn:hover { background: #A33A0A; }
        .v6-meal-thumbs { display: flex; gap: 12px; justify-content: center; }
        .v6-thumb {
          width: 64px; height: 64px; border-radius: 50%;
          overflow: hidden; cursor: pointer; border: 3px solid transparent;
          transition: border-color 0.2s, transform 0.2s;
          background: var(--cream-dark); display: flex;
          align-items: center; justify-content: center; font-size: 24px;
        }
        .v6-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .v6-thumb.active { border-color: var(--orange); transform: scale(1.1); }
        .v6-no-meals { text-align: center; padding: 60px 20px; color: var(--brown-light); }

        /* ── INGREDIENTS ── */
        .v6-ingredients { background: var(--cream); padding: 100px 5%; }
        .v6-ingredients-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; max-width: 1200px; margin: 0 auto; }
        .v6-ing-title {
          font-family: 'Nunito', sans-serif; font-size: clamp(48px, 6vw, 80px);
          font-weight: 900; line-height: 1.05; margin-bottom: 36px;
          color: var(--brown);
        }
        .v6-ing-title .orange { color: var(--orange); }
        .v6-why-points { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }
        .v6-why-point { }
        .v6-why-point-title { font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 4px; }
        .v6-why-point-desc { font-size: 14px; color: var(--brown); font-weight: 600; line-height: 1.5; }
        .v6-ing-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .v6-ing-card { border-radius: 16px; overflow: hidden; background: white; }
        .v6-ing-card-img {
          width: 100%; height: 100px; object-fit: cover; display: block;
          background: var(--cream-dark); display: flex;
          align-items: center; justify-content: center; font-size: 36px;
        }
        .v6-ing-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .v6-ing-card-body { padding: 10px 12px 12px; }
        .v6-ing-card-name { font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 800; color: var(--brown); margin-bottom: 2px; }
        .v6-ing-card-desc { font-size: 11px; color: var(--brown-light); line-height: 1.4; }
        .v6-ing-right { position: relative; }
        .v6-ing-photo {
          width: 100%; aspect-ratio: 3/4; border-radius: 32px;
          overflow: hidden; background: var(--cream-dark);
          display: flex; align-items: center; justify-content: center; font-size: 80px;
        }
        .v6-ing-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* ── FOOTER ── */
        .v6-footer { }
        .v6-footer-hero {
          background: var(--orange); padding: 64px 5%; text-align: center;
          position: relative; overflow: hidden;
        }
        .v6-footer-toys {
          position: absolute; inset: 0; pointer-events: none;
        }
        .v6-toy {
          position: absolute; font-size: 56px; opacity: 0.12; user-select: none;
        }
        .v6-footer-wordmark {
          font-family: 'Nunito', sans-serif; font-size: clamp(72px, 12vw, 120px);
          font-weight: 900; color: var(--gold); line-height: 1;
          position: relative; z-index: 1; letter-spacing: -2px;
        }
        .v6-footer-cols {
          background: var(--cream); padding: 56px 5% 40px;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px;
          border-top: 1px solid rgba(44,26,14,0.07);
        }
        .v6-footer-col-title {
          font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 900;
          color: var(--orange); margin-bottom: 16px; display: block;
        }
        .v6-footer-about-text { font-size: 13px; color: var(--brown-light); line-height: 1.75; }
        .v6-footer-about-text strong { color: var(--brown); display: block; margin-bottom: 4px; }
        .v6-footer-bullets { list-style: none; margin: 12px 0 16px; }
        .v6-footer-bullets li {
          font-size: 13px; color: var(--brown-light); padding: 3px 0;
          display: flex; align-items: flex-start; gap: 8px; line-height: 1.4;
        }
        .v6-footer-bullets li::before { content: '▪'; color: var(--orange); font-size: 10px; margin-top: 3px; flex-shrink: 0; }
        .v6-footer-link-list { display: flex; flex-direction: column; gap: 10px; }
        .v6-footer-link { font-size: 13px; color: var(--brown-light); text-decoration: none; transition: color 0.2s; }
        .v6-footer-link:hover { color: var(--orange); }
        .v6-contact-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .v6-contact-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(200,75,15,0.1); display: flex;
          align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
        }
        .v6-contact-info { font-size: 13px; color: var(--brown-light); line-height: 1.5; }
        .v6-contact-info a { color: var(--orange); text-decoration: none; font-weight: 600; }
        .v6-subscribe-input {
          width: 100%; padding: 11px 14px; border: 2px solid rgba(44,26,14,0.1);
          border-radius: 10px; font-size: 13px; font-family: 'Nunito Sans', sans-serif;
          color: var(--brown); outline: none; transition: border-color 0.2s;
          box-sizing: border-box; margin-bottom: 8px;
        }
        .v6-subscribe-input:focus { border-color: var(--orange); }
        .v6-footer-bottom {
          background: var(--brown); padding: 18px 5%;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .v6-footer-copy { font-size: 12px; color: rgba(255,255,255,0.4); }
        .v6-footer-bottom-links { display: flex; gap: 20px; }
        .v6-footer-bottom-link { font-size: 12px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; }
        .v6-footer-bottom-link:hover { color: rgba(255,255,255,0.7); }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .v6-stage-card { min-width: calc(50% - 12px); }
          .v6-menu { flex-direction: column; }
          .v6-menu-left { width: 100%; min-width: unset; min-height: 60vh; }
          .v6-menu-right { min-height: 80vh; }
          .v6-footer-cols { grid-template-columns: repeat(2, 1fr); }
          .v6-how-steps { grid-template-columns: 1fr; gap: 40px; }
          .v6-how-step:not(:last-child)::after { display: none; }
        }
        @media (max-width: 768px) {
          .v6-nav-links { display: none; }
          .v6-hero-inner { grid-template-columns: 1fr; gap: 40px; padding-top: 20px; }
          .v6-hero-img { aspect-ratio: 16/9; }
          .v6-hero-headline { font-size: 40px; }
          .v6-hero-btns { flex-direction: column; }
          .v6-stage-card { min-width: calc(85% - 12px); }
          .v6-ingredients-inner { grid-template-columns: 1fr; gap: 40px; }
          .v6-ing-cards { grid-template-columns: repeat(2, 1fr); }
          .v6-footer-cols { grid-template-columns: 1fr; }
          .v6-nutrition-boxes { grid-template-columns: repeat(2, 1fr); }
          .v6-menu-circle { width: 300px; height: 300px; }
          .v6-meal-img-wrap { width: 200px; height: 200px; }
        }
        @media (max-width: 480px) {
          .v6-hero-headline { font-size: 34px; }
          .v6-ing-title { font-size: 44px; }
          .v6-footer-wordmark { font-size: 64px; }
          .v6-stages-title { font-size: 26px; }
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav className="v6-nav">
        {logo?.url ? (
          <img src={logo.url} alt={logo.alt_text} style={{ height: 36, objectFit: 'contain' }} />
        ) : (
          <span className="v6-logo">Ninoz</span>
        )}
        <div className="v6-nav-links">
          {['How It Works', 'Menu', 'Plans', 'FAQ'].map(label => (
            <button key={label} className="v6-nav-link"
              onClick={() => document.getElementById(label.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })}>
              {label}
            </button>
          ))}
        </div>
        <button className="v6-btn-primary" onClick={() => setShowPopup(true)}>
          {c(content, 'nav_cta_text', 'Start Your Plan')}
        </button>
      </nav>

      {/* ══ HERO ══ */}
      <section className="v6-hero" id="hero">
        <div className="v6-hero-inner">
          <div style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'none' : 'translateY(24px)', transition: 'all 0.7s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,75,15,0.08)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: '50px', marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              🌿 {c(content, 'hero_badge', 'Fresh · Organic · Daily Delivery in Riyadh')}
            </div>
            <h1 className="v6-hero-headline">
              {c(content, 'hero_headline_1', 'You Care.')}<br />
              <span className="orange">{c(content, 'hero_headline_2', 'We Prepare.')}</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--brown-light)', lineHeight: 1.7, maxWidth: 460, marginBottom: 8 }}>
              {c(content, 'hero_description', 'Fresh daily meals for babies 3 months to 3 years — cooked today, delivered to your door.')}
            </p>
            <div className="v6-trust-badges">
              {[
                { icon: '🌿', label: 'Fresh Ingredients' },
                { icon: '🚫', label: 'No Preservatives' },
                { icon: '⏰', label: 'Cooked Daily' },
                { icon: '👶', label: 'Pediatrician Approved' },
              ].map(b => (
                <div key={b.label} className="v6-trust-badge">
                  <div className="v6-trust-icon">{b.icon}</div>
                  {b.label}
                </div>
              ))}
            </div>
            <div className="v6-hero-btns">
              <button className="v6-btn-primary" onClick={() => setShowPopup(true)}>
                {c(content, 'hero_btn_primary', 'Start Your Plan')}
              </button>
              <button className="v6-btn-secondary"
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>
                {c(content, 'hero_btn_secondary', 'Explore Meals')}
              </button>
            </div>
            <div className="v6-social-proof">
              <div style={{ display: 'flex' }}>
                {['#FFB347','#E8834A','#C84B0F','#7A7068','#2C1A0E'].map((col, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: col, border: '2px solid white', marginLeft: i > 0 ? -8 : 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--brown-light)', fontWeight: 600 }}>
                {c(content, 'hero_social_proof', 'Trusted by 200+ Riyadh mothers')}
              </span>
            </div>
          </div>

          <div className="v6-hero-img" style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'none' : 'translateX(24px)', transition: 'all 0.8s ease 0.1s' }}>
            <div className="v6-hero-img-placeholder">👶</div>
          </div>
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <div className="v6-ticker">
        <div className="v6-ticker-track">
          {[1,2].map(rep => (
            ['ticker_1','ticker_2','ticker_3','ticker_4'].map((key, i) => (
              <span key={`${rep}-${i}`} className="v6-ticker-item">
                {key === 'ticker_1' ? (
                  <><span className="highlight">100%</span> {c(content, key, '100% Fresh Ingredients').replace('100% ','')}</>
                ) : (
                  <><span className="highlight">0%</span> {c(content, key, '0% Sugar').replace('0% ','')}</>
                )}
                {' '}·{' '}
              </span>
            ))
          )).flat()}
        </div>
      </div>

      {/* ══ STAGES ══ */}
      <section className="v6-stages" id="plans">
        <div className="v6-stages-header v6-reveal">
          <h2 className="v6-stages-title">
            {c(content, 'stages_title', 'Fresh Meals Built for').replace(c(content, 'stages_title_highlight', 'Their Stage'), '').trim()}{' '}
            <span className="orange">{c(content, 'stages_title_highlight', 'Their Stage')}</span>
          </h2>
          <button className="v6-btn-primary" onClick={() => setShowPopup(true)}>
            {c(content, 'stages_cta', 'Start Your Plan')}
          </button>
        </div>

        <div className="v6-stages-carousel"
          onTouchStart={onStagesTouchStart}
          onTouchEnd={onStagesTouchEnd}>
          <div className="v6-stage-track"
            style={{ transform: `translateX(calc(-${stageIndex * (100 / 3)}% - ${stageIndex * 8}px))` }}>
            {stages.map((stage, idx) => (
              <div key={stage.id}
                className={`v6-stage-card ${idx === stageIndex ? 'active' : ''}`}
                style={{ background: stage.card_bg || '#F5EDE0' }}
                onClick={() => stage.is_clickable ? null : setStageIndex(idx)}>
                <div className="v6-stage-img">
                  {stage.image_url ? (
                    <img src={stage.image_url} alt={stage.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 80 }}>{stage.emoji}</span>
                  )}
                  {stage.tag && (
                    <div className="v6-stage-tag" style={{ background: stage.tag_color }}>{stage.tag}</div>
                  )}
                </div>
                <div className="v6-stage-body">
                  <div className="v6-stage-name">{stage.name}</div>
                  <div className="v6-stage-age">{stage.age_range}</div>
                  <div className="v6-stage-desc">{stage.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="v6-stage-nav">
          <button className="v6-stage-nav-btn" onClick={() => setStageIndex(i => Math.max(i - 1, 0))}>←</button>
          <div className="v6-stage-dots">
            {stages.map((_, idx) => (
              <div key={idx} className={`v6-dot ${idx === stageIndex ? 'active' : ''}`}
                onClick={() => setStageIndex(idx)} />
            ))}
          </div>
          <button className="v6-stage-nav-btn" onClick={() => setStageIndex(i => Math.min(i + 1, stages.length - 1))}>→</button>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="v6-how" id="how-it-works">
        <div className="v6-how-bg" />
        <div className="v6-how-content">
          <h2 className="v6-how-title v6-reveal">
            <span className="orange">How</span> Ninoz <span className="orange">Works</span>
          </h2>
          <p className="v6-how-subtitle v6-reveal v6-d1">{c(content, 'how_subtitle', 'Three steps to peace of mind — and a well-fed baby.')}</p>

          <div className="v6-how-steps">
            {howSteps.map((step, i) => (
              <div key={step.id} className={`v6-how-step v6-reveal v6-d${i + 1}`}>
                <div className="v6-how-icon" style={{ background: step.icon_bg || '#F5EDE0' }}>
                  {step.icon_url ? (
                    <img src={step.icon_url} alt="" />
                  ) : (
                    <span>{i === 0 ? '📋' : i === 1 ? '👨‍🍳' : '🚚'}</span>
                  )}
                </div>
                <p className="v6-how-desc">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="v6-how-cta v6-reveal">
            <button className="v6-btn-primary" style={{ padding: '16px 48px', fontSize: 16 }}
              onClick={() => setShowPopup(true)}>
              {c(content, 'how_cta', 'Get Started')}
            </button>
          </div>
        </div>
      </section>

      {/* ══ MENU ══ */}
      <section className="v6-menu" id="menu">
        {/* Left orange panel */}
        <div className="v6-menu-left">
          <div className="v6-menu-nav">
            <span className="v6-menu-logo">Ninoz</span>
            <button className="v6-btn-primary" style={{ fontSize: 13, padding: '10px 18px' }}
              onClick={() => setShowPopup(true)}>
              {c(content, 'menu_cta', 'Start your plan')}
            </button>
          </div>

          <div className="v6-menu-headline">
            <h2>
              {[
                c(content, 'menu_headline_1', 'Real Food'),
                c(content, 'menu_headline_2', 'Real Ingredients'),
                c(content, 'menu_headline_3', 'Every Single Day'),
              ].map((line, i) => (
                <span key={i} style={{ display: 'block' }}>{line}</span>
              ))}
            </h2>
          </div>

          <div className="v6-menu-tabs"
            onTouchStart={onMealsTouchStart}
            onTouchEnd={onMealsTouchEnd}>
            {(['breakfast', 'lunch', 'dinner'] as const).map((tab, i) => (
              <button key={tab}
                className={`v6-menu-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {c(content, `menu_tab_${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
              </button>
            ))}
          </div>
        </div>

        {/* Right meal viewer */}
        <div className="v6-menu-right"
          onTouchStart={onMealsTouchStart}
          onTouchEnd={onMealsTouchEnd}>
          <div className="v6-menu-circle" />
          <div className="v6-menu-content">
            {currentMeal ? (
              <>
                <div className="v6-meal-img-wrap">
                  {currentMeal.image_url ? (
                    <img src={currentMeal.image_url} alt={currentMeal.name} />
                  ) : <span>🍽️</span>}
                </div>
                <div className="v6-meal-name">{currentMeal.name}</div>
                <div className="v6-meal-desc">{currentMeal.description}</div>

                {(currentMeal.weight_g || currentMeal.protein_g) && (
                  <div className="v6-nutrition-boxes">
                    {[
                      { val: currentMeal.weight_g, lbl: 'Weight' },
                      { val: currentMeal.protein_g, lbl: 'Protein' },
                      { val: currentMeal.carbs_g, lbl: 'Carbs' },
                      { val: currentMeal.fiber_g, lbl: 'Fiber' },
                    ].filter(n => n.val).map(n => (
                      <div key={n.lbl} className="v6-nutr-box">
                        <span className="v6-nutr-val">{n.val}</span>
                        <span className="v6-nutr-lbl">{n.lbl}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentMeal.allergens && (
                  <div className="v6-allergen">
                    <span>⚠️</span>
                    <span>Allergen info: <strong>{currentMeal.allergens}</strong></span>
                  </div>
                )}

                {filteredMeals.length > 1 && (
                  <div className="v6-meal-arrows">
                    <button className="v6-arrow-btn"
                      onClick={() => setMealIndex(i => (i - 1 + filteredMeals.length) % filteredMeals.length)}>←</button>
                    <button className="v6-arrow-btn"
                      onClick={() => setMealIndex(i => (i + 1) % filteredMeals.length)}>→</button>
                  </div>
                )}

                <div className="v6-meal-thumbs">
                  {filteredMeals.slice(0, 4).map((meal, idx) => (
                    <div key={meal.id}
                      className={`v6-thumb ${idx === mealIndex ? 'active' : ''}`}
                      onClick={() => setMealIndex(idx)}>
                      {meal.image_url ? <img src={meal.image_url} alt={meal.name} /> : <span>🍽️</span>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="v6-no-meals">
                <div style={{ fontSize: 56, marginBottom: 12 }}>🍽️</div>
                <p style={{ fontSize: 15 }}>No meals added yet.<br />Add them from the admin portal.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ INGREDIENTS ══ */}
      <section className="v6-ingredients" id="ingredients">
        <div className="v6-ingredients-inner">
          <div className="v6-reveal">
            <h2 className="v6-ing-title">
              Only <span className="orange">Real</span><br />Ingredients
            </h2>

            <div className="v6-why-points">
              {whyPoints.map(point => (
                <div key={point.id} className="v6-why-point">
                  <div className="v6-why-point-title" style={{ color: point.title_color || 'var(--orange)' }}>
                    {point.title}
                  </div>
                  <div className="v6-why-point-desc">{point.description}</div>
                </div>
              ))}
            </div>

            {ingredients.length > 0 && (
              <div className="v6-ing-cards">
                {ingredients.slice(0, 4).map(ing => (
                  <div key={ing.id} className="v6-ing-card">
                    <div className="v6-ing-card-img">
                      {ing.image_url ? (
                        <img src={ing.image_url} alt={ing.name} />
                      ) : <span>🥕</span>}
                    </div>
                    <div className="v6-ing-card-body">
                      <div className="v6-ing-card-name">{ing.name}</div>
                      <div className="v6-ing-card-desc">{ing.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="v6-ing-right v6-reveal v6-d2">
            <div className="v6-ing-photo">
              <span>👶</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="v6-footer">
        {/* Big orange hero */}
        <div className="v6-footer-hero">
          <div className="v6-footer-toys">
            {[
              { top: '8%', left: '4%', emoji: '🪆' },
              { top: '60%', left: '2%', emoji: '🚲' },
              { top: '15%', left: '15%', emoji: '🧸' },
              { top: '70%', left: '20%', emoji: '🎠' },
              { top: '5%', right: '20%', emoji: '🏀' },
              { top: '70%', right: '18%', emoji: '🪀' },
              { top: '15%', right: '10%', emoji: '🎨' },
              { top: '8%', right: '3%', emoji: '🚂' },
              { top: '60%', right: '2%', emoji: '⚽' },
            ].map((toy, i) => (
              <span key={i} className="v6-toy" style={{ top: toy.top, left: (toy as any).left, right: (toy as any).right }}>
                {toy.emoji}
              </span>
            ))}
          </div>
          <div className="v6-footer-wordmark">Ninoz</div>
        </div>

        {/* 4 columns */}
        <div className="v6-footer-cols">
          {/* About */}
          <div>
            <span className="v6-footer-col-title">{c(content, 'footer_about_title', 'About Ninoz')}</span>
            <div className="v6-footer-about-text">
              <strong>Hi. We're Ninoz.</strong>
              {c(content, 'footer_about_text', 'We cook fresh daily meals for babies and toddlers in Riyadh.')}
            </div>
            <ul className="v6-footer-bullets">
              {['Cooked the morning of delivery', 'Designed for your baby\'s stage', 'Approved by a pediatric nutritionist', 'Free from salt, sugar and preservatives'].map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="v6-footer-about-text">
              {c(content, 'footer_about_closing', 'You handle the love. We handle the food.')}
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <span className="v6-footer-col-title">{c(content, 'footer_links_title', 'Useful Links')}</span>
            <div className="v6-footer-link-list">
              {footerLinks.map(link => (
                <a key={link.id} href={link.url} className="v6-footer-link">{link.label}</a>
              ))}
            </div>
          </div>

          {/* Get in Touch */}
          <div>
            <span className="v6-footer-col-title">{c(content, 'footer_contact_title', 'Get in Touch')}</span>
            <div className="v6-contact-item">
              <div className="v6-contact-icon">☺️</div>
              <div className="v6-contact-info">{c(content, 'footer_contact_tagline', 'We\'d love to hear from you')}</div>
            </div>
            {c(content, 'footer_contact_whatsapp') && (
              <div className="v6-contact-item">
                <div className="v6-contact-icon">📱</div>
                <div className="v6-contact-info">
                  <a href={`https://wa.me/${c(content, 'footer_contact_whatsapp')}`} target="_blank" rel="noreferrer">WhatsApp Us</a>
                </div>
              </div>
            )}
            <div className="v6-contact-item">
              <div className="v6-contact-icon">📧</div>
              <div className="v6-contact-info">
                <a href={`mailto:${c(content, 'footer_contact_email', 'hello@ninoz.sa')}`}>
                  {c(content, 'footer_contact_email', 'hello@ninoz.sa')}
                </a>
              </div>
            </div>
          </div>

          {/* Subscribe Now */}
          <div>
            <span className="v6-footer-col-title">{c(content, 'footer_subscribe_title', 'Subscribe Now')}</span>
            <p style={{ fontSize: 13, color: 'var(--brown-light)', marginBottom: 16, lineHeight: 1.5 }}>
              Enter your email to start your plan. No payment now.
            </p>
            <input className="v6-subscribe-input" type="email" placeholder="your@email.com" />
            <button className="v6-btn-primary" style={{ width: '100%', borderRadius: 10 }}
              onClick={() => setShowPopup(true)}>
              Start Your Plan →
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="v6-footer-bottom">
          <span className="v6-footer-copy">{c(content, 'footer_copyright', '© 2025 Ninoz. All rights reserved.')}</span>
          <div className="v6-footer-bottom-links">
            <a href="#" className="v6-footer-bottom-link">Terms</a>
            <a href="#" className="v6-footer-bottom-link">Privacy</a>
            <a href="#" className="v6-footer-bottom-link">Allergens</a>
          </div>
        </div>
      </footer>

      {/* ══ SUBSCRIPTION POPUP ══ */}
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
