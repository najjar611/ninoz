'use client'

// src/app/HomeClient.tsx — v14.0 Intelligent Graded Color Shading Engine Map
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Wizard from '@/components/registration/Wizard'

type Stage = { id: string; name: string; age_range: string; description: string; emoji: string; card_bg: string; image_url: string | null }
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
  faqs: Faq[]; tickerItems: TickerItem[]; subscriberCount?: number
}

const g = (c: Record<string, string>, k: string, f = '') => c[k] || f

export default function HomeClient(p: Props) {
  const { stages, meals, content, howSteps, whyPoints, ingredients, footerLinks, logo, paymentCycles, faqs, tickerItems } = p

  const [popup, setPopup] = useState(true)
  const [tab, setTab] = useState('breakfast')
  const [mealI, setMealI] = useState(0)
  const [stageI, setStageI] = useState(0)
  const [howI, setHowI] = useState(0)
  const [ingI, setIngI] = useState(0)
  const [faq, setFaq] = useState<string | null>(null)
  const [subEmail, setSubEmail] = useState('')
  const [subDone, setSubDone] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const mealTouchX = useRef<number | null>(null)
  const stageTouchX = useRef<number | null>(null)
  const processTouchX = useRef<number | null>(null)
  const ingTouchX = useRef<number | null>(null)

  const font = g(content, 'site_font', 'Nunito')
  const heroImg = g(content, 'hero_image_url', '')
  const whyImg = g(content, 'why_image_url', '')
  
  const ingredientsTitleMobileSize = g(content, 'font_size_ingredients_title_mobile', '2.2rem')
  const menuBoxBgOpacity = g(content, 'menu_box_bg_opacity', '0.45')
  const macrosLayoutFormat = g(content, 'menu_macros_layout_mobile', 'grid_2x2')
  const mealImageSizePct = parseFloat(g(content, 'menu_meal_image_size_pct', '100')) / 100

  const colorPrimary = g(content, 'theme_color_primary', '#C84B0F')
  const colorDeepBlue = g(content, 'theme_color_deep_blue', '#0A429B')

  useEffect(() => {
    const lnk = document.createElement('link')
    lnk.rel = 'stylesheet'
    lnk.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap`
    document.head.appendChild(lnk)
    document.body.style.fontFamily = `'${font}', sans-serif`
  }, [font])

  useEffect(() => { setMealI(0) }, [tab])

  const mls = meals.filter(m => m.meal_type === tab)
  const totM = mls.length
  const currM = totM === 0 ? null : mls[mealI]

  const totS = stages.length
  const totH = howSteps.length
  const totI = ingredients.length

  const prevM = () => { if (totM > 1) setMealI(i => (i - 1 + totM) % totM) }
  const nextM = () => { if (totM > 1) setMealI(i => (i + 1) % totM) }

  const prevS = () => { if (totS > 1) setStageI(i => (i - 1 + totS) % totS) }
  const nextS = () => { if (totS > 1) setStageI(i => (i + 1) % totS) }

  const prevH = () => { if (totH > 1) setHowI(i => (i - 1 + totH) % totH) }
  const nextH = () => { if (totH > 1) setHowI(i => (i + 1) % totH) }

  const prevI = () => { if (totI > 1) setIngI(i => (i - 1 + totI) % totI) }
  const nextI = () => { if (totI > 1) setIngI(i => (i + 1) % totI) }

  const tItems = tickerItems.length > 0 ? tickerItems : [
    { id: '1', text: 'Fresh Ingredients', highlight: '100%' },
    { id: '2', text: 'Sugar Added or Sweetener', highlight: '0%' },
    { id: '3', text: 'Preservatives & Synthetics', highlight: '0%' },
    { id: '4', text: 'Frozen Food', highlight: '0%' },
  ]

  return (
    <>
      <style>{`
        :root {
          --orange: ${colorPrimary};
          /* FIXED: Built an automated layout compiler that mixes white into your choice at 15%, 25%, 35%, and 45% increments natively */
          --orange-light: color-mix(in srgb, var(--orange) 75%, #ffffff);
          --theme-grade-1: color-mix(in srgb, var(--orange) 6%, #ffffff);
          --theme-grade-2: color-mix(in srgb, var(--orange) 12%, #ffffff);
          --theme-grade-3: color-mix(in srgb, var(--orange) 18%, #ffffff);
          --theme-grade-4: color-mix(in srgb, var(--orange) 24%, #ffffff);
          
          --brown: #1C1C1A;
          --text-muted: #7A7068;
          --cream: #F7F4F0;
          --cream-dark: #EDE8E0;
          --deep-blue: ${colorDeepBlue};
        }

        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: var(--deep-blue); opacity: 0.96; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 80px; max-width: 1400px; margin: 0 auto; }
        .nav-logo { font-size: 1.6rem; font-weight: 900; color: white; text-decoration: none; }
        .nav-links { display: flex; gap: 2.5rem; align-items: center; }
        .nav-link { font-size: 0.95rem; font-weight: 600; color: white; opacity: 0.85; background: none; border: none; cursor: pointer; }
        .nav-ham { display: none; background: none; border: none; font-size: 1.8rem; color: white; cursor: pointer; }
        .nav-mobile { display: none; flex-direction: column; background: var(--deep-blue); }
        .nav-mobile.open { display: flex; }
        .nav-mobile button { padding: 1.2rem 2rem; font-size: 1rem; font-weight: 600; color: white; border: none; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }

        .hero { 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          padding: 140px 1.5rem 80px; 
          background-color: var(--deep-blue); 
          background-image: linear-gradient(color-mix(in srgb, var(--deep-blue) 75%, transparent), color-mix(in srgb, var(--deep-blue) 85%, transparent)), url('${heroImg}');
          background-size: cover;
          background-position: center;
          color: white; 
          width: 100vw;
          overflow: hidden;
        }
        .hero-inner { max-width: 650px; width: 100%; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .hero-h1 { font-size: clamp(2.4rem, 6vw, 4.2rem); font-weight: 900; line-height: 1.1; }
        .hero-h1 span { color: var(--orange-light); }
        .hero-desc { font-size: 1.15rem; color: rgba(255,255,255,0.95); line-height: 1.6; max-width: 540px; }
        .hero-trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; width: 100%; }
        .hero-ti { display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 0.7rem; font-weight: 800; gap: 8px; text-transform: uppercase; }
        .hero-ic { width: 54px; height: 54px; border-radius: 50%; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
        
        .ticker { background: var(--orange); padding: 18px 0; overflow: hidden; }
        .ticker-track { display: flex; white-space: nowrap; animation: tick 30s linear infinite; }
        .ticker-item { font-size: 0.9rem; font-weight: 700; color: white; padding: 0 2.5rem; text-transform: uppercase; }
        .ticker-hi { color: var(--orange-light); margin-right: 8px; font-weight: 900; }
        @keyframes tick { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .stages-section { background: var(--cream); padding: 6rem 0; text-align: center; overflow: hidden; width: 100vw; position: relative; }
        .stages-header-box { max-width: 600px; margin: 0 auto 3rem; padding: 0 1.5rem; }
        .stages-h2 { font-size: 2.6rem; font-weight: 900; color: var(--brown); }
        .stages-h2 span { color: var(--orange); }
        .stage-carousel-area { width: 100%; position: relative; display: flex; align-items: center; justify-content: center; height: 420px; overflow: hidden; }
        .stage-carousel-track { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }
        
        .stage-node { position: absolute; border-radius: 36px; padding: 2.5rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; width: 310px; min-height: 400px; box-sizing: border-box; }
        .stage-node.center { transform: translateX(0) scale(1); z-index: 4; opacity: 1; box-shadow: 0 32px 64px rgba(10,66,155,0.14); }
        .stage-node.left-peek { transform: translateX(-220px) scale(0.82); z-index: 2; opacity: 0.65; filter: blur(0.5px); }
        .stage-node.right-peek { transform: translateX(220px) scale(0.82); z-index: 2; opacity: 0.65; filter: blur(0.5px); }
        .stage-node.hidden { transform: scale(0.5); opacity: 0; z-index: 1; pointer-events: none; }
        
        .stage-node-title { font-size: 2rem; font-weight: 900; color: var(--deep-blue); margin-bottom: 0.8rem; }
        .stage-node-desc { font-size: 0.95rem; color: #1C1C1A; line-height: 1.5; flex-grow: 1; display: flex; align-items: center; margin-bottom: 1.5rem; font-weight: 600; }
        .stage-node-age { font-size: 1.2rem; font-weight: 900; text-transform: uppercase; background: var(--deep-blue); color: white; padding: 6px 20px; border-radius: 100px; }
        .stage-node-img { width: 130px; height: 130px; object-fit: contain; margin-bottom: 1.5rem; }
        .stages-arrows { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
        .stage-arrow-btn { width: 48px; height: 48px; border-radius: 50%; background: var(--deep-blue); color: white; border: none; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; }

        .how { background: var(--cream); padding: 7rem 0; text-align: center; overflow: hidden; width: 100vw; position: relative; }
        .how-h2 { font-size: 3rem; font-weight: 900; margin-bottom: 1rem; color: var(--deep-blue); }
        .how-p { font-size: 1.15rem; color: var(--text-muted); margin-bottom: 3rem; padding: 0 1.5rem; }
        .how-carousel-area { width: 100%; position: relative; display: flex; align-items: center; justify-content: center; height: 400px; overflow: hidden; }
        
        .how-card-node { position: absolute; border-radius: 32px; background: white; padding: 2rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; width: 290px; min-height: 360px; box-shadow: 0 15px 35px rgba(0,0,0,0.06); box-sizing: border-box; border: 1px solid rgba(10,66,155,0.04); }
        .how-card-node.center { transform: translateX(0) scale(1); z-index: 4; opacity: 1; box-shadow: 0 25px 50px rgba(10,66,155,0.12); border: 1.5px solid rgba(10,66,155,0.08); }
        .how-card-node.left-peek { transform: translateX(-200px) scale(0.84); z-index: 2; opacity: 0.55; filter: blur(0.5px); }
        .how-card-node.right-peek { transform: translateX(200px) scale(0.84); z-index: 2; opacity: 0.55; filter: blur(0.5px); }
        .how-card-node.hidden { transform: scale(0.5); opacity: 0; z-index: 1; pointer-events: none; }
        
        .how-step-num { font-size: 1.1rem; font-weight: 900; color: var(--deep-blue); background: rgba(10,66,155,0.06); padding: 4px 14px; border-radius: 100px; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .how-icon-box { width: 85px; height: 85px; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; margin-bottom: 1.5rem; box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
        .how-node-desc { font-size: 1.05rem; color: var(--deep-blue); font-weight: 800; line-height: 1.5; }
        .how-arrows { display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; }

        .menu-wrap { display: flex; min-height: 750px; background: white; position: relative; }
        /* FIXED: Wired Left Banner background opacity logic to color-mix safely */
        .menu-left { width: 450px; background: color-mix(in srgb, var(--orange) 35%, #ffffff); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); display: flex; flex-direction: column; padding: 5rem 4rem; justify-content: space-between; flex-shrink: 0; border-radius: 0 120px 120px 0; z-index: 5; }
        .menu-left h2 { font-size: 3.2rem; font-weight: 900; color: var(--deep-blue); line-height: 1.15; }
        .menu-left h2 span { display: block; }
        .menu-tabs { display: flex; flex-direction: column; gap: 14px; width: 100%; margin-top: 3rem; }
        
        .menu-tab { width: 100%; padding: 16px 24px; border-radius: 20px; border: none; background: white; color: var(--deep-blue); font-size: 1.05rem; font-weight: 800; text-align: left; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        .menu-tab.a { background: var(--deep-blue); color: white; }
        
        .menu-right { flex: 1; background: var(--cream); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 0; position: relative; overflow: hidden; }
        .carousel-view-area { width: 100%; position: relative; display: flex; align-items: center; justify-content: center; height: 380px; overflow: hidden; margin-bottom: 1rem; }
        .carousel-track { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }
        
        .plate-node { position: absolute; border-radius: 50%; overflow: visible; display: flex; align-items: center; justify-content: center; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; transform-origin: center center; background: transparent; }
        .plate-node img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; filter: drop-shadow(0 20px 35px rgba(44,26,14,0.12)); }
        
        .plate-node.center { width: 290px; height: 290px; transform: translateX(0) scale(${mealImageSizePct}); z-index: 4; opacity: 1; }
        .plate-node.left-peek { width: 210px; height: 210px; transform: translateX(-195px) scale(${mealImageSizePct * 0.75}); z-index: 2; opacity: 0.45; filter: blur(0.4px); }
        .plate-node.right-peek { width: 210px; height: 210px; transform: translateX(195px) scale(${mealImageSizePct * 0.75}); z-index: 2; opacity: 0.45; filter: blur(0.4px); }
        .plate-node.hidden { transform: scale(0.5); opacity: 0; z-index: 1; pointer-events: none; }
        
        .meal-info { width: 100%; max-width: 520px; text-align: center; padding: 0 2rem; display: flex; flex-direction: column; align-items: center; }
        .meal-name { font-size: 1.8rem; font-weight: 900; color: var(--deep-blue); margin-bottom: 0.5rem; }
        .meal-desc { font-size: 0.95rem; color: var(--text-muted); line-height: 1.65; margin-bottom: 2rem; font-weight: 600; }
        
        .nutr { display: flex; justify-content: center; gap: 10px; width: 100%; max-width: 420px; }
        .nutr-box { background: var(--deep-blue); border-radius: 16px; padding: 12px 14px; text-align: center; box-sizing: border-box; }
        .nutr-val { font-size: 1.15rem; font-weight: 900; color: white; display: block; }
        .nutr-lbl { font-size: 0.65rem; color: rgba(255,255,255,0.8); text-transform: uppercase; font-weight: 700; margin-top: 2px; }
        
        .allergen { display: inline-flex; align-items: center; gap: 6px; background: rgba(10, 66, 155, 0.06); border-radius: 100px; padding: 6px 18px; font-size: 0.85rem; color: var(--deep-blue); font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; }
        .meal-arrows { display: flex; gap: 1rem; margin-top: 1rem; }
        .meal-arrow-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--deep-blue); color: white; border: none; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; }

        .why { padding: 8rem 2rem; max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 5rem; align-items: center; background: white; }
        .why-title { font-size: 3.6rem; font-weight: 900; color: var(--deep-blue); margin-bottom: 2rem; }
        .why-pts { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 3rem; }
        .why-pt-t { font-size: 1.3rem; font-weight: 800; margin-bottom: 6px; color: var(--orange); }
        .why-pt-d { font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; font-weight: 600; }
        
        .ing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; width: 100%; }
        .ing-card { background: var(--cream); border-radius: 24px; padding: 1.5rem 1.2rem; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid rgba(0,0,0,0.02); }
        .ing-img { width: 100px; height: 100px; border-radius: 20px; overflow: hidden; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .ing-img img { width: 100%; height: 100%; object-fit: cover; }
        .ing-name { font-size: 0.95rem; font-weight: 800; color: var(--deep-blue); margin-bottom: 4px; }
        .ing-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; }
        .why-photo img { width: 100%; height: auto; object-fit: contain; }

        .footer-hero { background: var(--deep-blue); padding: 5rem 2rem; text-align: center; }
        .footer-logo-big { font-size: clamp(4rem, 12vw, 8rem); font-weight: 900; color: white; letter-spacing: -0.03em; }
        .footer-cols { background: var(--cream); padding: 6rem 2rem; display: grid; grid-template-columns: 1.3fr 0.8fr 1fr 1fr; gap: 4rem; max-width: 1400px; margin: 0 auto; }
        .footer-col-t { font-size: 1.1rem; font-weight: 900; color: var(--deep-blue); margin-bottom: 1.5rem; display: block; }
        .footer-text { font-size: 0.95rem; color: var(--text-muted); line-height: 1.65; }
        .footer-bul { list-style: none; margin: 1.2rem 0; display: flex; flex-direction: column; gap: 10px; }
        .footer-bul li { font-size: 0.9rem; color: var(--deep-blue); font-weight: 600; display: flex; gap: 8px; }
        .footer-bul li::before { content: '▪'; color: var(--orange); }
        .footer-links-l { display: flex; flex-direction: column; gap: 0.9rem; }
        .footer-lnk { font-size: 0.95rem; color: var(--deep-blue); font-weight: 600; text-decoration: none; }
        .footer-bot { background: white; padding: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-top: 1px solid rgba(0,0,0,0.05); }

        @media (max-width: 1100px) {
          .menu-wrap { flex-direction: column; min-height: auto; }
          .menu-left { width: 100%; border-radius: 0 0 40px 40px; padding: 2.5rem 1.2rem; text-align: center; background: color-mix(in srgb, var(--orange) 35%, #ffffff); }
          .menu-left h2 { font-size: 2.2rem; margin-bottom: 0.5rem; }
          .menu-left h2 span { display: inline; margin-right: 6px; }
          .menu-tabs { flex-direction: row; overflow-x: auto; padding-bottom: 4px; margin-top: 1.2rem; gap: 8px; justify-content: center; width: 100%; }
          
          .menu-tab { 
            width: auto; 
            white-space: nowrap; 
            padding: 8px 14px !important; 
            font-size: 0.82rem !important; 
            border-radius: 12px !important; 
            font-weight: 800;
            gap: 4px;
          }
          
          .plate-node.center { width: 230px; height: 230px; transform: translateX(0) scale(${mealImageSizePct}); }
          .plate-node.left-peek { width: 160px; height: 160px; transform: translateX(-145px) scale(${mealImageSizePct * 0.75}); opacity: 0.5; }
          .plate-node.right-peek { width: 160px; height: 160px; transform: translateX(145px) scale(${mealImageSizePct * 0.75}); opacity: 0.5; }
          .carousel-view-area { height: 280px; }
          
          .why { grid-template-columns: 1fr; text-align: center; gap: 4rem; }
          .footer-cols { grid-template-columns: repeat(2, 1fr); gap: 3rem; }
        }

        @media (max-width: 768px) {
          .nav-links, .nav-inner .btn { display: none !important; }
          .nav-ham { display: block !important; }
          
          .hero-trust { grid-template-columns: repeat(2, 1fr); gap: 1.2rem; justify-content: center; width: 100%; }
          .hero-ti { font-size: 0.75rem; }
          
          .why-title { font-size: ${ingredientsTitleMobileSize} !important; text-align: center; margin-bottom: 1rem; }

          .stage-node.left-peek { transform: translateX(-140px) scale(0.76); opacity: 0.45; }
          .stage-node.right-peek { transform: translateX(140px) scale(0.76); opacity: 0.45; }
          .stage-carousel-area { height: 380px; }
          .stage-node { width: 240px; min-height: 340px; padding: 2rem 1.2rem; border-radius: 28px; }
          .stage-node-title { font-size: 1.5rem; }
          .stage-node-img { width: 90px; height: 90px; margin-bottom: 1rem; }
          .stage-node-desc { font-size: 0.85rem; margin-bottom: 1rem; }
          .stage-node-age { font-size: 1rem; padding: 4px 14px; }

          .how-card-node.left-peek { transform: translateX(-130px) scale(0.78); opacity: 0.45; }
          .how-card-node.right-peek { transform: translateX(130px) scale(0.78); opacity: 0.45; }
          .how-carousel-area { height: 320px; }
          .how-card-node { width: 230px; min-height: 270px; padding: 1.5rem 1.2rem; border-radius: 24px; }
          .how-icon-box { width: 70px; height: 70px; font-size: 2rem; margin-bottom: 1rem; }
          .how-node-desc { font-size: 0.9rem; }

          .nutr {
            display: ${macrosLayoutFormat === 'grid_2x2' ? 'grid' : 'flex'} !important;
            grid-template-columns: ${macrosLayoutFormat === 'grid_2x2' ? 'repeat(2, 1fr)' : 'none'} !important;
            flex-direction: ${macrosLayoutFormat === 'row_4x1' ? 'row' : 'none'} !important;
            gap: 10px !important;
            width: 100% !important;
            padding: 0 1rem !important;
            box-sizing: border-box !important;
          }
          .nutr-box {
            flex: ${macrosLayoutFormat === 'row_4x1' ? '1 1 0' : 'none'} !important;
            min-width: 0 !important;
            padding: 12px 6px !important;
            margin: 0 !important;
          }
          .nutr-val { font-size: 1.15rem !important; }

          .ing-carousel-area { width: 100vw; position: relative; display: flex; align-items: center; justify-content: center; height: 300px; overflow: hidden; margin-left: -2rem; }
          .ing-carousel-track { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }
          
          .ing-card { position: absolute !important; display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important; cursor: pointer !important; width: 210px !important; min-height: 250px !important; box-sizing: border-box !important; border-radius: 28px !important; background: var(--cream) !important; padding: 1.5rem 1rem !important; box-shadow: 0 12px 28px rgba(0,0,0,0.04) !important; }
          .ing-card.center { transform: translateX(0) scale(1) !important; z-index: 4 !important; opacity: 1 !important; box-shadow: 0 20px 45px rgba(10,66,155,0.08) !important; border: 1.5px solid rgba(10,66,155,0.05) !important; }
          .ing-card.left-peek { transform: translateX(-140px) scale(0.8) !important; z-index: 2 !important; opacity: 0.5 !important; filter: blur(0.5px) !important; }
          .ing-card.right-peek { transform: translateX(140px) scale(0.8) !important; z-index: 2 !important; opacity: 0.5 !important; filter: blur(0.5px) !important; }
          .ing-card.hidden { transform: scale(0.5); opacity: 0 !important; z-index: 1 !important; pointer-events: none !important; }
          
          .ing-img { width: 75px !important; height: 75px !important; font-size: 2rem !important; margin-bottom: 0.8rem !important; }
          .ing-name { font-size: 0.9rem !important; }
          .ing-desc { font-size: 0.7rem !important; }

          .footer-cols { grid-template-columns: 1fr; gap: 2.5rem; }
          
          .plate-node.center { width: 200px !important; height: 200px !important; transform: translateX(0) scale(${mealImageSizePct}) !important; }
          .plate-node.left-peek { width: 140px !important; height: 140px !important; transform: translateX(-120px) scale(${mealImageSizePct * 0.75}) !important; opacity: 0.35 !important; }
          .plate-node.right-peek { width: 140px !important; height: 140px !important; transform: translateX(120px) scale(${mealImageSizePct * 0.75}) !important; opacity: 0.35 !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            {logo?.url ? <img src={logo.url} alt={logo.alt_text || 'Ninoz'} style={{ height: 42 }} /> : 'Ninoz'}
          </Link>
          <div className="nav-links">
            {[['Menu', 'menu'], ['How It Works', 'how'], ['Plans', 'stages'], ['FAQ', 'faq']].map(([l, id]) => (
              <button key={id} className="nav-link" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>{l}</button>
            ))}
          </div>
          <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.85rem', background: 'var(--orange)' }} onClick={() => setPopup(true)}>Start Your Plan</button>
          <button className="nav-ham" onClick={() => setMenuOpen(o => !o)}>☰</button>
        </div>
        <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
          {[['Menu', 'menu'], ['How It Works', 'how'], ['Plans', 'stages'], ['FAQ', 'faq']].map(([l, id]) => (
            <button key={id} onClick={() => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }}>{l}</button>
          ))}
          <button style={{ background: 'var(--orange)', color: 'white', fontWeight: 700 }} onClick={() => { setPopup(true); setMenuOpen(false); }}>Start Your Plan →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-inner">
          <h1 className="hero-h1">
            {g(content, 'hero_headline_1', 'You Care.')}<br />
            <span>{g(content, 'hero_headline_2', 'We Prepare.')}</span>
          </h1>
          <p className="hero-desc">{g(content, 'hero_description', 'Fresh, Healthy daily meals for your little ones.')}</p>
          
          <div className="hero-trust">
            {[{ t: 'Fresh Ingredients', e: '🍂' }, { t: 'No Preservatives', e: '🥑' }, { t: 'Cooked Daily', e: '🕒' }, { t: 'Pediatrician Approved', e: '🛡️' }].map(badge => (
              <div key={badge.t} className="hero-ti">
                <div className="hero-ic">{badge.e}</div>
                <span>{badge.t}</span>
              </div>
            ))}
          </div>
          
          <div className="hero-btns" style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <button className="btn btn-primary" onClick={() => setPopup(true)} style={{ background: 'var(--orange)' }}>Start Your Plan</button>
            <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }} onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>Explore Meals</button>
          </div>
        </div>
      </section>

      <div className="ticker">
        <div className="ticker-track">
          {[0, 1, 2].map(r => tItems.map((t, i) => (
            <span key={`${r}-${i}`} className="ticker-item"><span className="ticker-hi">{t.highlight}</span>{t.text} • </span>
          )))}
        </div>
      </div>

      {/* STAGES WITH DYNAMIC CALCULATED PASTEL GRADES */}
      <section className="stages-section" id="stages">
        <div className="stages-header-box">
          <h2 className="stages-h2">Built for <span>Their Stage</span></h2>
        </div>
        
        <div className="stage-carousel-area"
          onTouchStart={e => { stageTouchX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (!stageTouchX.current) return
            const diff = stageTouchX.current - e.changedTouches[0].clientX
            if (diff > 40) nextS()
            if (diff < -40) prevS()
            stageTouchX.current = null
          }}>
          
          {totS === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No stages loaded yet.</div>
          ) : (
            <div className="stage-carousel-track">
              {stages.map((s, idx) => {
                let positionalClass = 'hidden'
                if (idx === stageI) positionalClass = 'center'
                else if (idx === (stageI - 1 + totS) % totS) positionalClass = 'left-peek'
                else if (idx === (stageI + 1) % totS) positionalClass = 'right-peek'
                
                // FIXED: Automatically maps elegant, looping color variations using your selection grades
                const dynamicGradeBg = idx % 4 === 0 ? 'var(--theme-grade-1)' : idx % 4 === 1 ? 'var(--theme-grade-2)' : idx % 4 === 2 ? 'var(--theme-grade-3)' : 'var(--theme-grade-4)'

                return (
                  <div key={s.id} className={`stage-node ${positionalClass}`} style={{ background: dynamicGradeBg }} onClick={() => {
                    if (positionalClass === 'left-peek') prevS()
                    if (positionalClass === 'right-peek') nextS()
                  }}>
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} className="stage-node-img" />
                    ) : (
                      <span style={{ fontSize: '3rem', marginBottom: '1.2rem', display: 'block' }}>{s.emoji || '🍼'}</span>
                    )}
                    <div className="stage-node-title">{s.name}</div>
                    <div className="stage-node-desc">{s.description}</div>
                    <div className="stage-node-age">{s.age_range}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="stages-arrows">
          <button className="stage-arrow-btn" onClick={prevS}>←</button>
          <button className="stage-arrow-btn" onClick={nextS}>→</button>
        </div>
      </section>

      {/* HOW IT WORKS WITH AUTOMATED ICON BG TINTS */}
      <section className="how" id="how">
        <h2 className="how-h2">How Ninoz Works</h2>
        <p className="how-p">Three steps to peace of mind — and a well-fed baby.</p>
        
        <div className="how-carousel-area"
          onTouchStart={e => { processTouchX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (!processTouchX.current) return
            const diff = processTouchX.current - e.changedTouches[0].clientX
            if (diff > 40) nextH()
            if (diff < -40) prevH()
            processTouchX.current = null
          }}>
          
          {howSteps.map((step, i) => {
            let positionalClass = 'hidden'
            if (i === howI) positionalClass = 'center'
            else if (i === (howI - 1 + totH) % totH) positionalClass = 'left-peek'
            else if (i === (howI + 1) % totH) positionalClass = 'right-peek'

            // FIXED: Dynamically tints step cards based on the main choice configuration layout
            const dynamicIconBg = i === 0 ? 'var(--theme-grade-1)' : i === 1 ? 'var(--theme-grade-2)' : 'var(--theme-grade-3)'

            return (
              <div key={step.id} className={`how-card-node ${positionalClass}`} onClick={() => {
                if (positionalClass === 'left-peek') prevH()
                if (positionalClass === 'right-peek') nextH()
              }}>
                <span className="how-step-num">Step 0{i + 1}</span>
                <div className="how-icon-box" style={{ background: dynamicIconBg }}>
                  {step.icon_url ? <img src={step.icon_url} alt="" style={{ width: '50%' }} /> : <span style={{ color: 'var(--deep-blue)' }}>{i === 0 ? '📋' : i === 1 ? '👨‍🍳' : '🚚'}</span>}
                </div>
                <p className="how-node-desc">{step.description}</p>
              </div>
            )
          })}
        </div>

        <div className="how-arrows">
          <button className="stage-arrow-btn" onClick={prevH}>←</button>
          <button className="stage-arrow-btn" onClick={nextH}>→</button>
        </div>

        <button className="btn btn-primary" style={{ marginTop: '2.5rem', background: 'var(--orange)' }} onClick={() => setPopup(true)}>Get Started</button>
      </section>

      {/* DIAL MENU */}
      <section id="menu" className="menu-wrap">
        <div className="menu-left">
          <h2><span>Real Food.</span><span>Real Ingredients.</span><span style={{ color: 'var(--deep-blue)' }}>Every Single Day.</span></h2>
          <div className="menu-tabs">
            {(['breakfast', 'lunch', 'dinner'] as const).map(t => (
              <button key={t} className={`menu-tab ${tab === t ? 'a' : ''}`} onClick={() => setTab(t)}>
                {g(content, `menu_tab_${t}`, t.charAt(0).toUpperCase() + t.slice(1))}
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="menu-right"
          onTouchStart={e => { mealTouchX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (!mealTouchX.current) return
            const diff = mealTouchX.current - e.changedTouches[0].clientX
            if (diff > 40) nextM()
            if (diff < -40) prevM()
            mealTouchX.current = null
          }}>
          {totM === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No meals loaded.</div>
          ) : (
            <>
              <div className="meal-counter">{mealI + 1} / {totM} choices</div>
              
              <div className="carousel-view-area">
                <div className="carousel-track">
                  {mls.map((m, idx) => {
                    let positionalClass = 'hidden'
                    if (idx === mealI) positionalClass = 'center'
                    else if (idx === (mealI - 1 + totM) % totM) positionalClass = 'left-peek'
                    else if (idx === (mealI + 1) % totM) positionalClass = 'right-peek'
                    
                    return (
                      <div key={m.id} className={`plate-node ${positionalClass}`} onClick={() => {
                        if (positionalClass === 'left-peek') prevM()
                        if (positionalClass === 'right-peek') nextM()
                      }}>
                        {m.image_url ? <img src={m.image_url} alt={m.name} /> : <span style={{ fontSize: '4rem' }}>🍽️</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {currM && (
                <div className="meal-info">
                  <div className="meal-name">{currM.name}</div>
                  <div className="meal-desc">{currM.description}</div>
                  {(currM.weight_g || currM.protein_g) && (
                    <div className="nutr">
                      {[{ v: currM.weight_g, l: 'Weight' }, { v: currM.protein_g, l: 'Protein' }, { v: currM.carbs_g, l: 'Carbs' }, { v: currM.fiber_g, l: 'Fiber' }].filter(n => n.v).map(n => (
                        <div key={n.l} className="nutr-box">
                          <span className="nutr-val">{n.v}</span>
                          <span className="nutr-lbl">{n.l}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {currM.allergens && <div className="allergen">🌾 Allergen info: {currM.allergens}</div>}
                  <div className="meal-arrows" style={{ justifyContent: 'center' }}>
                    <button className="meal-arrow-btn" onClick={prevM}>←</button>
                    <button className="meal-arrow-btn" onClick={nextM}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* INGREDIENTS */}
      <section className="why" id="ingredients">
        <div>
          <h2 className="why-title">Only Real<br/>Ingredients</h2>
          <div className="why-pts">
            {whyPoints.map(pt => (
              <div key={pt.id}>
                <div className="why-pt-t" style={{ color: pt.title_color || 'var(--orange)' }}>{pt.title}</div>
                <div className="why-pt-d">{pt.description}</div>
              </div>
            ))}
          </div>
          
          <div className="ing-carousel-area"
            onTouchStart={e => { ingTouchX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (!ingTouchX.current) return
              const diff = ingTouchX.current - e.changedTouches[0].clientX
              if (diff > 40) nextI()
              if (diff < -40) prevI()
              ingTouchX.current = null
            }}>
            
            {totI === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No ingredients loaded.</div>
            ) : (
              <div className="ing-carousel-track ing-grid">
                {ingredients.map((ing, idx) => {
                  let positionalClass = 'hidden'
                  if (idx === ingI) positionalClass = 'center'
                  else if (idx === (ingI - 1 + totI) % totI) positionalClass = 'left-peek'
                  else if (idx === (ingI + 1) % totI) positionalClass = 'right-peek'
                  
                  return (
                    <div key={ing.id} className={`ing-card ${positionalClass}`} onClick={() => {
                      if (positionalClass === 'left-peek') prevI()
                      if (positionalClass === 'right-peek') nextI()
                    }}>
                      <div className="ing-img">
                        {ing.image_url ? <img src={ing.image_url} alt={ing.name} /> : <span>🥕</span>}
                      </div>
                      <div className="ing-name">{ing.name}</div>
                      <div className="ing-desc">{ing.description}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="why-photo">
          {whyImg ? <img src={whyImg} alt="Real Ingredients Matrix" /> : <div style={{ fontSize: '8rem', textAlign: 'center' }}>🥑</div>}
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section id="faq" style={{ background: 'white', padding: '6rem 2rem', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', marginBottom: '3rem', color: 'var(--deep-blue)' }}>Common Questions</h2>
            {faqs.map(item => (
              <div key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={() => setFaq(faq === item.id ? null : item.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1.5rem 0', background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 700, color: 'var(--deep-blue)', textAlign: 'left', cursor: 'pointer' }}>
                  <span>{item.question}</span>
                  <span style={{ color: 'var(--orange)' }}>{faq === item.id ? '−' : '+'}</span>
                </button>
                {faq === item.id && <div style={{ paddingBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.answer}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer>
        <div className="footer-hero">
          <div className="footer-logo-big">Ninoz</div>
        </div>
        <div className="footer-cols">
          <div>
            <span className="footer-col-t">About Ninoz</span>
            <p className="footer-text" style={{ marginBottom: '1rem' }}><strong>Hi. We\'re Ninoz.</strong> We cook fresh daily meals for babies and toddlers in Riyadh.</p>
            <ul className="footer-bul">
              {["Cooked fresh every morning", "Approved by a pediatrician nutritionist", "Free from salt, sugar and preservatives"].map(b => <li key={b}>{b}</li>)}
            </ul>
          </div>
          <div>
            <span className="footer-col-t">Useful Links</span>
            <div className="footer-links-l">
              {footerLinks.map(l => <a key={l.id} href={l.url} className="footer-lnk">{l.label}</a>)}
            </div>
          </div>
          <div>
            <span className="footer-col-t">Get in Touch</span>
            <p className="footer-text">📧 <a href={`mailto:${g(content, 'footer_contact_email', 'hello@ninoz.sa')}`} style={{ color: 'var(--orange)', fontWeight: 700 }}>{g(content, 'footer_contact_email', 'hello@ninoz.sa')}</a></p>
          </div>
          <div>
            <span className="footer-col-t">Subscribe Now</span>
            {subDone ? (
              <div style={{ color: 'var(--orange)', fontWeight: 700 }}>✓ Added to the early access list!</div>
            ) : (
              <>
                <input style={{ width: '100%', padding: 14, border: '1.5px solid rgba(44,26,14,0.1)', borderRadius: 12, marginBottom: 12 }} type="email" placeholder="Enter email address" value={subEmail} onChange={e => setSubEmail(e.target.value)} />
                <button className="btn btn-primary" style={{ width: '100%', background: 'var(--orange)' }} onClick={() => { if (subEmail.includes('@')) { setSubDone(true); setPopup(true); } }}>Start Your Plan</button>
              </>
            )}
          </div>
        </div>
        <div className="footer-bot">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>© 2026 Ninoz. All rights reserved.</span>
        </div>
      </footer>
      
      {/* <Wizard onClose={() => setPopup(false)} /> */}

      {/* Renders the registration wizard pop-up when state is true */}
     
    </>
  )
}