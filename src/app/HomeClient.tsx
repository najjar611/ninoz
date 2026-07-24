'use client'

// src/app/HomeClient.tsx — v14.0 Intelligent Graded Color Shading Engine Map
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Wizard from '@/components/registration/Wizard'
import AccountModal from './AccountModal'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'

type Stage = { id: string; name: string; name_ar?: string | null; age_range: string; age_range_ar?: string | null; description: string; description_ar?: string | null; emoji: string; card_bg: string; image_url: string | null }
type Meal = { id: string; name: string; name_ar?: string | null; description: string; description_ar?: string | null; meal_type: string; stage_id: string | null; image_url: string | null; allergens: string; allergens_ar?: string | null; weight_g: string; protein_g: string; carbs_g: string; fiber_g: string }
type HowStep = { id: string; icon_url: string | null; icon_bg: string; description: string; description_ar?: string | null }
type WhyPoint = { id: string; title: string; description: string; title_color: string; title_ar?: string | null; description_ar?: string | null }
type Ingredient = { id: string; name: string; description: string; image_url: string | null; name_ar?: string | null; description_ar?: string | null }
type FooterLink = { id: string; label: string; url: string }
type Logo = { url: string | null; alt_text: string }
type PaymentCycle = { id: string; label: string; days: number; meals_total: number; price_sar: number }
type Faq = { id: string; question: string; answer: string; question_ar?: string | null; answer_ar?: string | null }
type TickerItem = { id: string; text: string; highlight: string; text_ar?: string | null; highlight_ar?: string | null }
type Category = { id: string; name: string; name_ar?: string | null; slug: string }

type Props = {
  stages: Stage[]; meals: Meal[]; content: Record<string, string>
  howSteps: HowStep[]; whyPoints: WhyPoint[]; ingredients: Ingredient[]
  footerLinks: FooterLink[]; logo: Logo | null; paymentCycles: PaymentCycle[]
  faqs: Faq[]; tickerItems: TickerItem[]; subscriberCount?: number
  categories: Category[]
}

const g = (c: Record<string, string>, k: string, f = '') => c[k] || f

export default function HomeClient(p: Props) {
  const { stages, meals, content, howSteps, whyPoints, ingredients, logo, paymentCycles, faqs, tickerItems, categories } = p

  const router = useRouter()
  const [lang, setLang] = useState<'en' | 'ar'>('ar')
  const isAR = lang === 'ar'
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  // Subscription awareness for the sticky bar: null = not subscribed,
  // otherwise days until the plan starts (0 or less = already started).
  const [subDaysToStart, setSubDaysToStart] = useState<number | null>(null)

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) return
    const supabase = createClient()
    supabase.from('subscriptions').select('start_date, status').eq('subscriber_id', id).in('status', ['active', 'frozen']).order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (!data?.start_date) return
        const start = new Date((data as any).start_date + 'T00:00:00')
        const today = new Date(); today.setHours(0, 0, 0, 0)
        setSubDaysToStart(Math.round((start.getTime() - today.getTime()) / 86400000))
      })
  }, [])

  // Profile icon = "manage my account" only — never forces a subscription.
  // The dashboard itself redirects to /account/signin if not authenticated yet,
  // and shows a "not subscribed" prompt instead of forcing payment.
  function goToAccount() {
    router.push('/account/dashboard')
  }

  // Orange CTA = the actual subscribe funnel (auth -> profile -> plan -> pay).
  function startPlan() {
    setAccountModalOpen(true)
  }
  const gg = (key: string, fallback = '') => isAR ? (content[`${key}_ar`] || content[key] || fallback) : (content[key] || fallback)
  const sName = (s: Stage) => (isAR && s.name_ar) || s.name
  const sAge = (s: Stage) => (isAR && s.age_range_ar) || s.age_range
  const sDesc = (s: Stage) => (isAR && s.description_ar) || s.description
  const mName = (m: Meal) => (isAR && m.name_ar) || m.name
  const mDesc = (m: Meal) => (isAR && m.description_ar) || m.description
  const mAllergens = (m: Meal) => (isAR && m.allergens_ar) || m.allergens
  const cName = (c: Category) => (isAR && c.name_ar) || c.name
  const fQuestion = (f: Faq) => (isAR && f.question_ar) || f.question
  const fAnswer = (f: Faq) => (isAR && f.answer_ar) || f.answer
  const hDesc = (h: HowStep) => (isAR && h.description_ar) || h.description
  const tText = (t: TickerItem) => (isAR && t.text_ar) || t.text
  const tHi = (t: TickerItem) => (isAR && t.highlight_ar) || t.highlight
  const wTitle = (w: WhyPoint) => (isAR && w.title_ar) || w.title
  const wDesc = (w: WhyPoint) => (isAR && w.description_ar) || w.description
  const iName = (i: Ingredient) => (isAR && i.name_ar) || i.name
  const iDesc = (i: Ingredient) => (isAR && i.description_ar) || i.description

  const [popup, setPopup] = useState(true)
  const [tab, setTab] = useState(categories[0]?.slug || 'breakfast')
  const [stageFilter, setStageFilter] = useState('')
  const [stageMenuOpen, setStageMenuOpen] = useState(false)
  const [mealI, setMealI] = useState(0)
  const [stageI, setStageI] = useState(0)
  const [howI, setHowI] = useState(0)
  const [ingI, setIngI] = useState(0)
  const [faq, setFaq] = useState<string | null>(null)
  const [subEmail, setSubEmail] = useState('')
  const [subDone, setSubDone] = useState(false)

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
  const menuBgColor = g(content, 'menu_bg_color', '')
  const menuHeadingSizeDesktop = g(content, 'menu_heading_size_desktop', '3.2rem')
  const menuHeadingSizeMobile = g(content, 'menu_heading_size_mobile', '2.2rem')

  const colorPrimary = g(content, 'theme_color_primary', '#C84B0F')
  const colorDeepBlue = g(content, 'theme_color_deep_blue', '#0A429B')

  useEffect(() => {
    const lnk = document.createElement('link')
    lnk.rel = 'stylesheet'
    lnk.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap`
    document.head.appendChild(lnk)
    document.body.style.fontFamily = `'${font}', sans-serif`
  }, [font])

  useEffect(() => {
    if (!isAR) return
    const lnk = document.createElement('link')
    lnk.rel = 'stylesheet'
    lnk.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap'
    document.head.appendChild(lnk)
    return () => { document.head.removeChild(lnk) }
  }, [isAR])

  useEffect(() => { setMealI(0) }, [tab])

  useEffect(() => {
    const targets = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add('in-view')
      }
    }, { threshold: 0.15 })
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Reset the carousel to the first meal whenever the category or stage filter changes.
  useEffect(() => { setMealI(0) }, [tab, stageFilter])

  const mls = meals.filter(m => m.meal_type === tab && (!stageFilter || m.stage_id === stageFilter))
  const totM = mls.length
  const safeMealI = mealI < totM ? mealI : 0
  const currM = totM === 0 ? null : mls[safeMealI]

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

  const tItems = tickerItems.length > 0 ? tickerItems : (isAR ? [
    { id: '1', text: 'مكونات طازجة', highlight: '100%' },
    { id: '2', text: 'سكر مضاف أو محليات', highlight: '0%' },
    { id: '3', text: 'مواد حافظة وصناعية', highlight: '0%' },
    { id: '4', text: 'طعام مجمد', highlight: '0%' },
  ] : [
    { id: '1', text: 'Fresh Ingredients', highlight: '100%' },
    { id: '2', text: 'Sugar Added or Sweetener', highlight: '0%' },
    { id: '3', text: 'Preservatives & Synthetics', highlight: '0%' },
    { id: '4', text: 'Frozen Food', highlight: '0%' },
  ])

  return (
    <div dir={isAR ? 'rtl' : 'ltr'} style={{ fontFamily: isAR ? `'Tajawal', '${font}', sans-serif` : undefined }}>
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

        html, body { background: var(--cream); }

        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
        .reveal.in-view { opacity: 1; transform: translateY(0); }

        /* --- shared polish: motion + focus across the landing page --- */
        button, .btn, a.btn { transition: transform .16s ease, box-shadow .2s ease, filter .16s ease, background .2s ease; }
        .btn:hover { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 12px 26px rgba(28,28,26,0.16); }
        .btn:active { transform: translateY(0) scale(0.98); }
        .menu-tab:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(0,0,0,0.06); }
        .nav-account:hover { background: rgba(255,255,255,0.22); transform: scale(1.06); }
        .stage-arrow-btn { transition: transform .16s ease, filter .16s ease; }
        .stage-arrow-btn:hover { transform: scale(1.08); filter: brightness(1.08); }
        .plate-node.center img { transition: transform .3s cubic-bezier(.16,1,.3,1), filter .3s ease; }
        .plate-node.center:hover img { transform: scale(1.04); filter: drop-shadow(0 26px 42px rgba(44,26,14,0.18)); }
        input:focus-visible, textarea:focus-visible, select:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--orange) 28%, transparent); }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }

        #hero, #menu, #stages, #how, #ingredients, #faq { scroll-margin-top: 80px; }

        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: color-mix(in srgb, var(--deep-blue) 96%, transparent); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 80px; max-width: 1400px; margin: 0 auto; }
        .nav-logo { font-size: 2.1rem; font-weight: 900; color: var(--orange); text-decoration: none; display: flex; align-items: center; }
        .nav-links { display: flex; gap: 2.5rem; align-items: center; }
        .nav-link { font-size: 1.05rem; font-weight: 700; color: white; opacity: 0.9; background: none; border: none; cursor: pointer; }
        .nav-account { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.3); color: white; text-decoration: none; flex-shrink: 0; cursor: pointer; }
        .nav-lang-mobile { display: none; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 16px; border: 1.5px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.08); color: white; font-size: 0.8rem; font-weight: 700; cursor: pointer; flex-shrink: 0; }
        .nav-ham { display: none; background: none; border: none; font-size: 1.8rem; color: white; cursor: pointer; }
        .nav-mobile { display: none; flex-direction: column; background: var(--deep-blue); opacity: 1; position: relative; z-index: 1001; }
        .nav-mobile.open { display: flex; }
        .nav-mobile button, .nav-mobile a { padding: 1.2rem 2rem; font-size: 1rem; font-weight: 600; color: white; border: none; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); text-decoration: none; display: block; background: var(--deep-blue); }

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

        .stages-section { background: var(--cream); padding: 3.5rem 0 4rem; text-align: center; overflow: hidden; width: 100vw; position: relative; }
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

        .how { background: var(--cream); padding: 3.5rem 0 4rem; text-align: center; overflow: hidden; width: 100vw; position: relative; }
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

        .menu-wrap { display: flex; min-height: 580px; background: var(--cream); position: relative; }
        /* FIXED: Wired Left Banner background opacity logic to color-mix safely */
        .menu-left { width: 450px; background: ${menuBgColor || 'color-mix(in srgb, var(--orange) 35%, #ffffff)'}; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); display: flex; flex-direction: column; padding: 5rem 4rem; justify-content: space-between; flex-shrink: 0; border-radius: 0 120px 120px 0; z-index: 5; }
        .menu-left h2 { font-size: ${menuHeadingSizeDesktop}; font-weight: 900; color: var(--deep-blue); line-height: 1.15; }
        .menu-left h2 span { display: block; }
        .menu-tabs { display: flex; flex-direction: column; gap: 14px; width: 100%; margin-top: 3rem; }
        
        .menu-tab { width: 100%; padding: 16px 24px; border-radius: 20px; border: none; background: white; color: var(--deep-blue); font-size: 1.05rem; font-weight: 800; text-align: left; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        .menu-tab.a { background: var(--deep-blue); color: white; }
        
        .menu-right { flex: 1; background: var(--cream); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 0; position: relative; overflow: hidden; }
        .carousel-view-area { width: 100%; position: relative; display: flex; align-items: center; justify-content: center; height: 320px; overflow: hidden; margin-bottom: 1rem; }
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
        .meal-arrows { display: flex; gap: 1rem; margin-top: 1rem; width: 100%; max-width: 420px; justify-content: space-between; }
        .meal-arrow-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--deep-blue); color: white; border: none; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; }

        .why { padding: 5rem 2rem; max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 4rem; align-items: center; background: var(--cream); }
        .why-title { font-size: 3.6rem; font-weight: 900; color: var(--deep-blue); margin-bottom: 2rem; }
        .why-pts { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 3rem; }
        .why-pt-t { font-size: 1.3rem; font-weight: 800; margin-bottom: 6px; color: var(--orange); }
        .why-pt-d { font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; font-weight: 600; }
        
        .ing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; width: 100%; }
        .ing-card { background: white; border-radius: 24px; padding: 1.5rem 1.2rem; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid rgba(0,0,0,0.02); box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
        .ing-grid { align-items: stretch; }
        .ing-grid .ing-card { height: 100%; }
        .ing-img { width: 100px; height: 100px; border-radius: 20px; overflow: hidden; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .ing-img img { width: 100%; height: 100%; object-fit: cover; }
        .ing-name { font-size: 0.95rem; font-weight: 800; color: var(--deep-blue); margin-bottom: 4px; }
        .ing-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; }
        .why-photo img { width: 100%; height: auto; object-fit: contain; }

        .footer-hero { background: var(--deep-blue); padding: 5rem 2rem; text-align: center; }
        .footer-logo-big { font-size: clamp(4rem, 12vw, 8rem); font-weight: 900; color: white; letter-spacing: -0.03em; }
        .footer-cols { background: var(--cream); padding: 6rem 2rem; display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 4rem; max-width: 1400px; margin: 0 auto; }
        .contact-chip { display: inline-flex; align-items: center; gap: 9px; padding: 11px 18px; border-radius: 100px; font-size: 0.95rem; font-weight: 800; text-decoration: none; transition: transform .16s ease, box-shadow .2s ease, filter .16s ease; }
        .contact-chip:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,0.12); filter: brightness(1.03); }
        .contact-email { background: var(--orange); color: #fff; }
        .contact-wa { background: #25D366; color: #fff; }
        .contact-ig { display: inline-flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 0.95rem; font-weight: 800; color: var(--deep-blue); text-decoration: none; transition: color .16s ease; }
        .contact-ig:hover { color: var(--orange); }

        /* Floating WhatsApp bubble (shows only when a number is configured) */
        .wa-float { position: fixed; bottom: 22px; inset-inline-end: 20px; z-index: 950; width: 56px; height: 56px; border-radius: 50%; background: #25D366; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26px; text-decoration: none; box-shadow: 0 10px 26px rgba(37,211,102,0.45); transition: transform .18s ease; }
        .wa-float:hover { transform: scale(1.08); }

        /* Sticky mobile "Start your plan" bar */
        .mobile-cta { display: none; }
        @media (max-width: 768px) {
          .mobile-cta { display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 940; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--cream) 88%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid rgba(0,0,0,0.06); }
          .mobile-cta button { width: 100%; padding: 15px; border: none; border-radius: 14px; background: var(--orange); color: #fff; font-size: 1rem; font-weight: 900; font-family: inherit; cursor: pointer; box-shadow: 0 8px 20px rgba(200,75,15,0.3); }
          .mobile-cta button:active { transform: scale(0.98); }
          .wa-float { bottom: 78px; }
          footer { padding-bottom: 76px; }
        }
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
          .menu-left { width: 100%; border-radius: 0 0 40px 40px; padding: 2.5rem 1.2rem; text-align: center; background: ${menuBgColor || 'color-mix(in srgb, var(--orange) 35%, #ffffff)'}; }
          .menu-left h2 { font-size: ${menuHeadingSizeMobile}; margin-bottom: 0.5rem; }
          .menu-left h2 span { display: inline; margin-right: 6px; }
          .menu-tabs {
            flex-direction: row; flex-wrap: nowrap; overflow-x: auto; padding: 4px 20px 8px; margin-top: 1.2rem;
            gap: 8px; justify-content: safe center; width: 100%;
            scroll-snap-type: x proximity; scrollbar-width: none;
            -webkit-mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
            mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
          }
          .menu-tabs::-webkit-scrollbar { display: none; }

          .menu-tab {
            width: auto;
            white-space: nowrap;
            padding: 8px 14px !important;
            font-size: 0.82rem !important;
            border-radius: 12px !important;
            font-weight: 800;
            gap: 4px;
            scroll-snap-align: center;
            flex-shrink: 0;
          }
          
          .plate-node.center { width: 230px; height: 230px; transform: translateX(0) scale(${mealImageSizePct}); }
          .plate-node.left-peek { width: 160px; height: 160px; transform: translateX(-145px) scale(${mealImageSizePct * 0.75}); opacity: 0.5; }
          .plate-node.right-peek { width: 160px; height: 160px; transform: translateX(145px) scale(${mealImageSizePct * 0.75}); opacity: 0.5; }
          .carousel-view-area { height: 280px; }
          
          .why { grid-template-columns: 1fr; text-align: center; gap: 4rem; padding: 3.5rem 1.25rem; }
          .why-pt-d { max-width: 320px; margin: 0 auto; }
          .footer-cols { grid-template-columns: repeat(2, 1fr); gap: 3rem; }
        }

        @media (max-width: 768px) {
          .nav-links, .nav-inner .btn { display: none !important; }
          .nav-ham { display: block !important; }
          .nav-inner { position: relative; justify-content: flex-start; gap: 10px; }
          .nav-logo { position: absolute; left: 50%; transform: translateX(-50%); }
          .nav-lang-mobile { display: flex !important; margin-inline-start: auto; }

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

          /* Compact the menu section so it fits in one view without scrolling */
          .menu-left { padding: 1.5rem 1.2rem !important; }
          .menu-left h2 { margin-bottom: 0 !important; }
          .menu-tabs { margin-top: 0.8rem !important; padding: 4px 20px 4px !important; }
          .menu-right { padding: 1rem 0 !important; }
          .meal-counter { font-size: 0.8rem !important; margin-bottom: 0.2rem !important; }
          .carousel-view-area { height: 190px !important; margin-bottom: 0.2rem !important; }
          .meal-info { padding: 0 1rem !important; }
          .meal-name { font-size: 1.3rem !important; margin-bottom: 0.2rem !important; }
          .meal-desc { font-size: 0.82rem !important; margin-bottom: 0.8rem !important; line-height: 1.4 !important; }
          .nutr-box { padding: 8px 6px !important; }
          .nutr-val { font-size: 1rem !important; }
          .allergen { margin-top: 0.6rem !important; margin-bottom: 0.4rem !important; padding: 4px 14px !important; font-size: 0.78rem !important; }
          .meal-arrows { margin-top: 0.5rem !important; }
          .meal-arrow-btn { width: 36px !important; height: 36px !important; font-size: 1rem !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            {logo?.url
              ? <img src={logo.url} alt={logo.alt_text || 'Ninoz'} style={{ height: parseInt(g(content, 'logo_height', '72')), maxHeight: 96, width: 'auto', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.insertAdjacentText('afterend', 'Ninoz') }} />
              : 'Ninoz'}
          </Link>
          <div className="nav-links">
            {[[gg('nav_menu', 'Menu'), 'menu'], [gg('nav_how', 'How It Works'), 'how'], [gg('nav_plans', 'Plans'), 'stages'], [gg('nav_faq', 'FAQ'), 'faq']].map(([l, id]) => (
              <button key={id} className="nav-link" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>{l}</button>
            ))}
            <button className="nav-link" onClick={() => setLang(isAR ? 'en' : 'ar')} style={{ opacity: 1, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: '0.9rem', minWidth: 96, textAlign: 'center' }}>
              {isAR ? 'English' : 'عربي'}
            </button>
          </div>
          <button className="nav-account" aria-label="My Account" onClick={goToAccount}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12Zm0 2.4c-3.5 0-9 1.7-9 5.2v2.2h18v-2.2c0-3.5-5.5-5.2-9-5.2Z" fill="currentColor"/></svg>
          </button>
          <button className="nav-lang-mobile" onClick={() => setLang(isAR ? 'en' : 'ar')}>{isAR ? 'EN' : 'AR'}</button>
        </div>
      </nav>

      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} isAR={isAR} />

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-inner">
          <h1 className="hero-h1">
            {gg('hero_headline_1', 'You Care.')}<br />
            <span>{gg('hero_headline_2', 'We Prepare.')}</span>
          </h1>
          <p className="hero-desc">{gg('hero_description', 'Fresh, Healthy daily meals for your little ones.')}</p>

          <div className="hero-trust">
            {[{ t: gg('badge_fresh_ingredients', 'Fresh Ingredients'), e: '🍂' }, { t: gg('badge_no_preservatives', 'No Preservatives'), e: '🥑' }, { t: gg('badge_cooked_daily', 'Cooked Daily'), e: '🕒' }, { t: gg('badge_pediatrician_approved', 'Pediatrician Approved'), e: '🛡️' }].map(badge => (
              <div key={badge.t} className="hero-ti">
                <div className="hero-ic">{badge.e}</div>
                <span>{badge.t}</span>
              </div>
            ))}
          </div>

          <div className="hero-btns" style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <button className="btn btn-primary" onClick={startPlan} style={{ background: 'var(--orange)' }}>{gg('btn_start_plan', 'Start Your Plan')}</button>
            <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }} onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>{gg('btn_explore_meals', 'Explore Meals')}</button>
          </div>
        </div>
      </section>

      <div className="ticker">
        <div className="ticker-track">
          {[0, 1, 2].map(r => tItems.map((t, i) => (
            <span key={`${r}-${i}`} className="ticker-item"><span className="ticker-hi">{tHi(t)}</span>{tText(t)} • </span>
          )))}
        </div>
      </div>

      {/* STAGES WITH DYNAMIC CALCULATED PASTEL GRADES */}
      <section className="stages-section reveal" id="stages">
        <div className="stages-header-box">
          <h2 className="stages-h2">{gg('stages_built_for', 'Built for ')}<span>{gg('stages_their_stage', 'Their Stage')}</span></h2>
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
                      <img src={s.image_url} alt={sName(s)} className="stage-node-img" />
                    ) : (
                      <span style={{ fontSize: '3rem', marginBottom: '1.2rem', display: 'block' }}>{s.emoji || '🍼'}</span>
                    )}
                    <div className="stage-node-title">{sName(s)}</div>
                    <div className="stage-node-desc">{sDesc(s)}</div>
                    <div className="stage-node-age">{sAge(s)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="stages-arrows">
          <button className="stage-arrow-btn" onClick={prevS}>{isAR ? '→' : '←'}</button>
          <button className="stage-arrow-btn" onClick={nextS}>{isAR ? '←' : '→'}</button>
        </div>
      </section>

      {/* HOW IT WORKS WITH AUTOMATED ICON BG TINTS */}
      <section className="how reveal" id="how">
        <h2 className="how-h2">{gg('how_title', 'How Ninoz Works')}</h2>
        <p className="how-p">{gg('how_sub', 'Three steps to peace of mind — and a well-fed baby.')}</p>
        
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
                <span className="how-step-num">{gg('how_step_label', 'Step 0')}{i + 1}</span>
                <div className="how-icon-box" style={{ background: dynamicIconBg }}>
                  {step.icon_url ? <img src={step.icon_url} alt="" style={{ width: '50%' }} /> : <span style={{ color: 'var(--deep-blue)' }}>{i === 0 ? '📋' : i === 1 ? '👨‍🍳' : '🚚'}</span>}
                </div>
                <p className="how-node-desc">{hDesc(step)}</p>
              </div>
            )
          })}
        </div>

        <div className="how-arrows">
          <button className="stage-arrow-btn" onClick={prevH}>{isAR ? '→' : '←'}</button>
          <button className="stage-arrow-btn" onClick={nextH}>{isAR ? '←' : '→'}</button>
        </div>

        <a href="/foundingmamas" className="btn btn-primary" style={{ marginTop: '2.5rem', background: 'var(--orange)', textDecoration: 'none', display: 'inline-block' }}>{gg('how_join_now', 'Join Now')}</a>
      </section>

      {/* DIAL MENU */}
      <section id="menu" className="menu-wrap">
        <div className="menu-left">
          <h2><span>{gg('menu_real_food', 'Real Food.')}</span><span>{gg('menu_real_ingredients', 'Real Ingredients.')}</span><span style={{ color: 'var(--deep-blue)' }}>{gg('menu_every_day', 'Every Single Day.')}</span></h2>
          {stages.length > 0 && (
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem', position: 'relative', maxWidth: 320, marginInline: 'auto', width: '100%' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--brown)', marginBottom: 6, textAlign: 'center' }}>
                {gg('menu_filter_stage', isAR ? 'حسب المرحلة' : 'Filter by stage')}
              </label>
              <button
                type="button"
                onClick={() => setStageMenuOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', padding: '13px 18px', borderRadius: 16, border: 'none', background: 'white', fontSize: '1rem', fontWeight: 800, color: 'var(--deep-blue)', fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 6px 16px rgba(10,66,155,0.10)' }}
              >
                <span>{stageFilter ? sName(stages.find(s => s.id === stageFilter)!) : (isAR ? 'كل المراحل' : 'All stages')}</span>
                <span style={{ transition: 'transform 0.2s', transform: stageMenuOpen ? 'rotate(180deg)' : 'none', fontSize: '0.8rem', color: 'var(--orange)' }}>▼</span>
              </button>
              {stageMenuOpen && (
                <>
                  <div onClick={() => setStageMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'white', borderRadius: 16, boxShadow: '0 18px 40px rgba(10,66,155,0.18)', overflow: 'hidden', zIndex: 21, padding: 6 }}>
                    {[{ id: '', label: isAR ? 'كل المراحل' : 'All stages' }, ...stages.map(s => ({ id: s.id, label: sName(s) }))].map(opt => {
                      const active = stageFilter === opt.id
                      return (
                        <button
                          key={opt.id || 'all'}
                          type="button"
                          onClick={() => { setStageFilter(opt.id); setStageMenuOpen(false) }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '12px 14px', borderRadius: 11, border: 'none', background: active ? 'color-mix(in srgb, var(--orange) 18%, white)' : 'transparent', color: active ? 'var(--orange)' : 'var(--deep-blue)', fontSize: '0.95rem', fontWeight: active ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer', textAlign: isAR ? 'right' : 'left' }}
                        >
                          <span>{opt.label}</span>
                          {active && <span style={{ fontSize: '0.85rem' }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="menu-tabs">
            {categories.map(c => (
              <button key={c.id} className={`menu-tab ${tab === c.slug ? 'a' : ''}`} onClick={() => setTab(c.slug)}>
                {cName(c)}
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
              <div className="meal-counter">{mealI + 1} / {totM} {gg('menu_choices_label', 'choices')}</div>
              
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
                        {m.image_url ? <img src={m.image_url} alt={mName(m)} /> : <span style={{ fontSize: '4rem' }}>🍽️</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {currM && (
                <div className="meal-info">
                  <div className="meal-name">{mName(currM)}</div>
                  <div className="meal-desc">{mDesc(currM)}</div>
                  {(currM.weight_g || currM.protein_g) && (
                    <div className="nutr">
                      {[{ v: currM.weight_g, l: gg('nutr_weight', 'Weight') }, { v: currM.protein_g, l: gg('nutr_protein', 'Protein') }, { v: currM.carbs_g, l: gg('nutr_carbs', 'Carbs') }, { v: currM.fiber_g, l: gg('nutr_fiber', 'Fiber') }].filter(n => n.v).map(n => (
                        <div key={n.l} className="nutr-box">
                          <span className="nutr-val">{n.v}</span>
                          <span className="nutr-lbl">{n.l}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {currM.allergens && <div className="allergen">{gg('allergen_info_label', '🌾 Allergen info: ')}{mAllergens(currM)}</div>}
                  <div className="meal-arrows" style={{ justifyContent: 'center' }}>
                    <button className="meal-arrow-btn" onClick={prevM}>{isAR ? '→' : '←'}</button>
                    <button className="meal-arrow-btn" onClick={nextM}>{isAR ? '←' : '→'}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* INGREDIENTS */}
      {(totI > 0 || whyPoints.length > 0) && (
      <section className="why reveal" id="ingredients">
        <div>
          <h2 className="why-title">{gg('why_only_real', 'Only Real')}<br/>{gg('why_ingredients_word', 'Ingredients')}</h2>
          <div className="why-pts">
            {whyPoints.map(pt => (
              <div key={pt.id}>
                <div className="why-pt-t" style={{ color: pt.title_color || 'var(--orange)' }}>{wTitle(pt)}</div>
                <div className="why-pt-d">{wDesc(pt)}</div>
              </div>
            ))}
          </div>

          {totI > 0 && (
          <div className="ing-carousel-area"
            onTouchStart={e => { ingTouchX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (!ingTouchX.current) return
              const diff = ingTouchX.current - e.changedTouches[0].clientX
              if (diff > 40) nextI()
              if (diff < -40) prevI()
              ingTouchX.current = null
            }}>
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
                        {ing.image_url ? <img src={ing.image_url} alt={iName(ing)} /> : <span>🥕</span>}
                      </div>
                      <div className="ing-name">{iName(ing)}</div>
                      <div className="ing-desc">{iDesc(ing)}</div>
                    </div>
                  )
                })}
              </div>
          </div>
          )}
        </div>
        {whyImg && (
          <div className="why-photo">
            <img src={whyImg} alt="Real Ingredients Matrix" />
          </div>
        )}
      </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section id="faq" className="reveal" style={{ background: 'var(--cream)', padding: '6rem 2rem', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', marginBottom: '3rem', color: 'var(--deep-blue)' }}>{gg('faq_common_questions', 'Common Questions')}</h2>
            {faqs.map(item => (
              <div key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={() => setFaq(faq === item.id ? null : item.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1.5rem 0', background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 700, color: 'var(--deep-blue)', textAlign: isAR ? 'right' : 'left', cursor: 'pointer' }}>
                  <span>{fQuestion(item)}</span>
                  <span style={{ color: 'var(--orange)' }}>{faq === item.id ? '−' : '+'}</span>
                </button>
                {faq === item.id && <div style={{ paddingBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{fAnswer(item)}</div>}
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
        <div className="footer-cols reveal">
          <div>
            <span className="footer-col-t">{gg('footer_about_title', 'About Ninoz')}</span>
            <p className="footer-text" style={{ marginBottom: '1rem' }}>{gg('footer_about_blurb', "Hi. We're Ninoz. We cook fresh daily meals for babies and toddlers in Riyadh.")}</p>
            <ul className="footer-bul">
              {[
                gg('footer_about_bullet_1', 'Cooked fresh every morning'),
                gg('footer_about_bullet_2', 'Approved by a pediatrician nutritionist'),
                gg('footer_about_bullet_3', 'Free from salt, sugar and preservatives'),
              ].map(b => <li key={b}>{b}</li>)}
            </ul>
          </div>
          <div>
            <span className="footer-col-t">{gg('footer_get_in_touch', 'Get in Touch')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              {(() => {
                const cEmail = g(content, 'footer_contact_email', 'hello@ninoz.app')
                const cInsta = (g(content, 'contact_instagram', 'ninoz.app') || '').replace(/^@|^https?:\/\/(www\.)?instagram\.com\//i, '')
                const cWhats = (g(content, 'contact_whatsapp', '') || '').replace(/\D/g, '')
                return (
                  <>
                    <a href={`mailto:${cEmail}`} className="contact-chip contact-email">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm.4 2 8.6 6 8.6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>{isAR ? 'راسلنا' : 'Email us'}</span>
                    </a>
                    {cWhats && (
                      <a href={`https://wa.me/${cWhats}`} target="_blank" rel="noreferrer" className="contact-chip contact-wa">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2s-.7.9-.9 1.1c-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.7-3.3-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>
                        <span>{isAR ? 'واتساب' : 'WhatsApp'}</span>
                      </a>
                    )}
                    <a href={`https://instagram.com/${cInsta}`} target="_blank" rel="noreferrer" className="contact-ig">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></svg>
                      <span>@{cInsta}</span>
                    </a>
                  </>
                )
              })()}
            </div>
          </div>
          <div>
            <span className="footer-col-t">{gg('footer_subscribe_now', 'Subscribe Now')}</span>
            {subDone ? (
              <div style={{ color: 'var(--orange)', fontWeight: 700 }}>{gg('footer_subscribed_msg', '✓ Added to the early access list!')}</div>
            ) : (
              <>
                <input style={{ width: '100%', padding: 14, border: '1.5px solid rgba(44,26,14,0.1)', borderRadius: 12, marginBottom: 12 }} type="email" placeholder={gg('footer_email_placeholder', 'Enter email address')} value={subEmail} onChange={e => setSubEmail(e.target.value)} />
                <button className="btn btn-primary" style={{ width: '100%', background: 'var(--orange)' }} onClick={() => { if (subEmail.includes('@')) { setSubDone(true); setPopup(true); } }}>{gg('btn_start_plan', 'Start Your Plan')}</button>
              </>
            )}
          </div>
        </div>
        <div className="footer-bot">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{gg('footer_rights', '© 2026 Ninoz. All rights reserved.')}</span>
        </div>
      </footer>
      
      {/* Floating WhatsApp bubble — only when a number is configured in settings */}
      {(() => {
        const cWhats = (g(content, 'contact_whatsapp', '') || '').replace(/\D/g, '')
        return cWhats ? (
          <a href={`https://wa.me/${cWhats}`} target="_blank" rel="noreferrer" className="wa-float" aria-label="WhatsApp">💬</a>
        ) : null
      })()}

      {/* Sticky mobile CTA — a countdown for existing subscribers, otherwise the funnel */}
      <div className="mobile-cta">
        {subDaysToStart === null ? (
          <button onClick={startPlan}>{gg('btn_start_plan', 'Start Your Plan')}</button>
        ) : subDaysToStart > 0 ? (
          <button onClick={goToAccount} style={{ background: 'var(--deep-blue)' }}>
            ⏳ {isAR ? `${subDaysToStart} ${subDaysToStart === 1 ? 'يوم' : 'أيام'} حتى بداية اشتراكك` : `${subDaysToStart} ${subDaysToStart === 1 ? 'day' : 'days'} until your meals start`}
          </button>
        ) : (
          <button onClick={goToAccount} style={{ background: 'var(--deep-blue)' }}>
            {isAR ? 'اشتراكك نشط — لوحة التحكم' : 'Your plan is active — Dashboard'}
          </button>
        )}
      </div>

    </div>
  )
}