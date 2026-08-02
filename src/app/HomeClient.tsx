'use client'

// Ninoz — HomeClient VARIANTS D–G shared logic (UI only; same data/props/flows)
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMockSubscriberId } from '@/lib/mockSession'
import { getAccountLang, setAccountLang } from '@/lib/accountLang'

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
type NewsItem = { id: string; title: string; title_en?: string | null; body: string; body_en?: string | null }

type Props = {
  stages: Stage[]; meals: Meal[]; content: Record<string, string>
  howSteps: HowStep[]; whyPoints: WhyPoint[]; ingredients: Ingredient[]
  footerLinks: FooterLink[]; logo: Logo | null; paymentCycles: PaymentCycle[]
  faqs: Faq[]; tickerItems: TickerItem[]; subscriberCount?: number
  categories: Category[]; newsItems?: NewsItem[]
}

const g = (c: Record<string, string>, k: string, f = '') => c[k] || f

export default function HomeClient(p: Props) {
  const { stages, meals, content, howSteps, ingredients, logo, faqs, categories } = p
  const newsItems = p.newsItems || []

  const router = useRouter()
  const [lang, setLang] = useState<'en' | 'ar'>('ar')
  const isAR = lang === 'ar'
  const [customerName, setCustomerName] = useState('')
  const [hasPlan, setHasPlan] = useState(false)
  const [gate, setGate] = useState(false)
  function goToAccount() { router.push('/account') }
  // The single entry point to subscribing: Start Plan -> plan page (which sends
  // guests to sign-up first, and blocks anyone who already has a plan).
  function startPlan() { router.push('/account/profile') }
  function chooseEntry(guest: boolean) {
    if (typeof window !== 'undefined') localStorage.setItem('ninoz_entry', guest ? 'guest' : 'signin')
    setGate(false)
    // Cover with the logo FIRST, then navigate, so the sign-in page never
    // flashes into view before the logo does.
    if (!guest) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('ninoz:flash'))
      setTimeout(() => router.push('/account/signin'), 120)
    }
  }

  // Keep the language in sync with the rest of the app (account pages).
  useEffect(() => { setLang(getAccountLang()) }, [])

  useEffect(() => {
    const id = getMockSubscriberId()
    if (!id) {
      // First-time visitor with no session: show the entry gate once.
      if (typeof window !== 'undefined' && !localStorage.getItem('ninoz_entry')) setGate(true)
      return
    }
    const sb = createClient()
    sb.from('subscribers').select('parent_name').eq('id', id).maybeSingle()
      .then(({ data }) => { const n = (data as any)?.parent_name; if (n) setCustomerName(n) })
    sb.from('subscriptions').select('id').eq('subscriber_id', id).in('status', ['active', 'frozen', 'pending_payment']).limit(1).maybeSingle()
      .then(({ data }) => { if (data) setHasPlan(true) })
  }, [])

  // Language toggle plays the full-screen logo, then switches under the cover.
  function switchLang() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('ninoz:flash'))
    setTimeout(() => setLang(l => { const nl = l === 'ar' ? 'en' : 'ar'; setAccountLang(nl); return nl }), 430)
  }

  const gg = (key: string, fb = '') => isAR ? (content[`${key}_ar`] || content[key] || fb) : (content[key] || fb)
  const sName = (s: Stage) => (isAR && s.name_ar) || s.name
  const sAge = (s: Stage) => (isAR && s.age_range_ar) || s.age_range
  const sDesc = (s: Stage) => (isAR && s.description_ar) || s.description
  const mName = (m: Meal) => (isAR && m.name_ar) || m.name
  const mDesc = (m: Meal) => (isAR && m.description_ar) || m.description
  const mAllergens = (m: Meal) => (isAR && m.allergens_ar) || m.allergens
  const cName = (c: Category) => (isAR && c.name_ar) || c.name
  const hDesc = (h: HowStep) => (isAR && h.description_ar) || h.description
  const iName = (i: Ingredient) => (isAR && i.name_ar) || i.name
  const iDesc = (i: Ingredient) => (isAR && i.description_ar) || i.description
  const fQuestion = (f: Faq) => (isAR && f.question_ar) || f.question
  const fAnswer = (f: Faq) => (isAR && f.answer_ar) || f.answer

  const [tab, setTab] = useState(categories[0]?.slug || 'breakfast')
  const [stageFilter, setStageFilter] = useState('')
  const [mealI, setMealI] = useState(0)
  const [faq, setFaq] = useState<string | null>(null)
  const mealTouchX = useRef<number | null>(null)
  const [newsI, setNewsI] = useState(0)
  const [newsOpen, setNewsOpen] = useState(false)
  const newsTouchX = useRef<number | null>(null)
  const totN = newsItems.length
  const curN = totN ? newsItems[newsI % totN] : null
  const nName = (n: NewsItem) => (isAR ? n.title : (n.title_en || n.title))
  const nBody = (n: NewsItem) => (isAR ? n.body : (n.body_en || n.body))
  const prevN = () => { if (totN > 1) { setNewsOpen(false); setNewsI(i => (i - 1 + totN) % totN) } }
  const nextN = () => { if (totN > 1) { setNewsOpen(false); setNewsI(i => (i + 1) % totN) } }

  // Auto-advance the news cards every 6 seconds when there's more than one.
  useEffect(() => {
    if (totN <= 1) return
    const t = setInterval(() => { setNewsOpen(false); setNewsI(i => (i + 1) % totN) }, 6000)
    return () => clearInterval(t)
  }, [totN])

  useEffect(() => {
    const targets = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) e.target.classList.add('in-view') }, { threshold: 0.15 })
    targets.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  useEffect(() => { setMealI(0) }, [tab, stageFilter])

  const mls = meals.filter(m => m.meal_type === tab && (!stageFilter || m.stage_id === stageFilter))
  const totM = mls.length
  const currM = totM === 0 ? null : mls[mealI < totM ? mealI : 0]
  const totS = stages.length
  const totH = howSteps.length
  const totI = ingredients.length
  const prevM = () => { if (totM > 1) setMealI(i => (i - 1 + totM) % totM) }
  const nextM = () => { if (totM > 1) setMealI(i => (i + 1) % totM) }
  const [stageI, setStageI] = useState(0)
  const stageTouchX = useRef<number | null>(null)
  const prevS = () => { if (totS > 1) setStageI(i => (i - 1 + totS) % totS) }
  const nextS = () => { if (totS > 1) setStageI(i => (i + 1) % totS) }

  const arrow = (dir: 'prev' | 'next') => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d={(dir === 'prev') === !isAR ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
  const waPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.943c0 2.096.549 4.14 1.595 5.945L0 24l6.304-1.654a11.881 11.881 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.821 11.821 0 00-3.449-8.416z'
  const curS = totS ? stages[stageI % totS] : null
  const w = g(content, 'contact_whatsapp', '966591976737').replace(/\D/g, '')

  return (
    <div className="vD" dir={isAR ? 'rtl' : 'ltr'}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" />
      <style>{`
        .vD{ --bg:#0C1A15; --bg2:#122A22; --glass:rgba(255,255,255,.06); --line:rgba(255,255,255,.12); --lime:#8FE39A; --orange:#FF7A33; --gold:#F5C77E; --tx:#EAF3EE; --mut:#9DB4A8;
             font-family:'Baloo Bhaijaan 2','Tajawal',sans-serif; color:var(--tx); background:radial-gradient(120% 90% at 50% -10%, var(--bg2), var(--bg)); min-height:100vh; overflow-x:clip; padding-bottom:86px; }
        .vD *{ box-sizing:border-box; }
        .vD .wrap{ max-width:560px; margin:0 auto; padding:0 18px; }
        .vD button{ font-family:inherit; cursor:pointer; }
        .vD .reveal{ opacity:0; transform:translateY(22px); transition:.8s cubic-bezier(.16,1,.3,1); } .vD .reveal.in-view{ opacity:1; transform:none; }
        .vD .glass{ background:var(--glass); border:1px solid var(--line); backdrop-filter:blur(16px); border-radius:24px; }
        .vD .svcbar{ background:linear-gradient(90deg,var(--orange),var(--gold)); color:#1a120a; text-align:center; padding:9px 16px; font-size:.86rem; font-weight:800; display:flex; align-items:center; justify-content:center; gap:7px; }
        .vD .greet{ margin-top:12px; font-size:1.25rem; font-weight:800; color:var(--gold); } .vD .greet b{ color:var(--tx); }
        .vD .newsstack{ position:relative; margin-top:16px; }
        .vD .newsstack .peek{ position:absolute; left:10px; right:10px; top:8px; height:60px; border-radius:20px; background:linear-gradient(120deg,rgba(255,122,51,.10),rgba(245,199,126,.06)); border:1px solid var(--line); z-index:0; }
        .vD .newsstack .peek.two{ left:20px; right:20px; top:16px; opacity:.6; }
        .vD .news{ position:relative; z-index:1; padding:18px 18px 16px; border-radius:20px; cursor:pointer; text-align:center; background:linear-gradient(120deg,rgba(255,122,51,.16),rgba(245,199,126,.10)); border:1px solid var(--line); }
        .vD .news .ntag{ color:var(--gold); font-weight:800; letter-spacing:.2em; text-transform:uppercase; font-size:.9rem; }
        .vD .news h4{ font-size:1.55rem; font-weight:800; margin:6px 0 0; color:var(--tx); line-height:1.2; }
        .vD .news .nbody{ color:var(--mut); line-height:1.6; font-size:.92rem; margin-top:10px; }
        .vD .news .nnav{ display:flex; align-items:center; justify-content:center; gap:12px; margin-top:14px; }
        .vD .news .nnav button{ width:32px; height:32px; border-radius:50%; border:1px solid var(--line); background:var(--glass); color:var(--gold); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vD .news .ndots{ display:flex; gap:6px; }
        .vD .news .ndots i{ width:6px; height:6px; border-radius:50%; background:var(--line); display:inline-block; } .vD .news .ndots i.on{ background:var(--gold); width:16px; border-radius:3px; }
        .vD .foot .frow{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:16px; }
        .vD .foot .frow a{ display:inline-flex; align-items:center; gap:8px; padding:11px 18px; border-radius:999px; text-decoration:none; font-weight:800; font-size:.86rem; border:1px solid var(--line); }
        .vD .foot .frow .wa2{ background:#25D366; color:#fff; border-color:transparent; } .vD .foot .frow .em{ background:var(--glass); color:var(--tx); } .vD .foot .frow .ig{ background:var(--glass); color:var(--tx); }

        .vD .hdr{ position:sticky; top:0; z-index:40; background:linear-gradient(180deg,var(--bg) 60%,transparent); backdrop-filter:blur(10px); }
        .vD .hdrin{ display:flex; align-items:center; justify-content:space-between; padding:26px 8px 14px; direction:ltr; }
        .vD .brand img{ height:112px; max-height:120px; width:auto; object-fit:contain; filter:drop-shadow(0 6px 18px rgba(0,0,0,.5)); }
        .vD .brand span{ font-size:2.8rem; font-weight:800; color:var(--orange); }
        .vD .hr{ display:flex; gap:10px; align-items:center; }
        .vD .gbtn{ border:1px solid var(--line); background:var(--glass); color:var(--tx); border-radius:999px; padding:6px 12px; font-weight:700; font-size:.72rem; backdrop-filter:blur(10px); transition:transform .15s; }
        .vD .gbtn:active{ transform:scale(.94); }
        .vD .gic{ width:44px; height:44px; border-radius:50%; border:1px solid var(--line); background:var(--glass); color:var(--lime); display:flex; align-items:center; justify-content:center; }

        .vD .hero{ text-align:center; padding:26px 6px 20px; position:relative; }
        .vD .hero .glow{ position:absolute; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(255,122,51,.28),transparent 70%); top:-40px; left:50%; transform:translateX(-50%); z-index:0; }
        .vD .hero h1{ position:relative; font-size:clamp(2.5rem,9vw,3.6rem); line-height:1.04; font-weight:800; }
        .vD .hero h1 em{ font-style:normal; background:linear-gradient(90deg,var(--gold),var(--orange)); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .vD .hero p{ position:relative; color:var(--mut); margin:14px auto 0; max-width:40ch; line-height:1.6; }
        .vD .hcta{ position:relative; margin-top:22px; border:none; background:linear-gradient(90deg,var(--orange),var(--gold)); color:#1a120a; padding:15px 30px; border-radius:999px; font-weight:800; font-size:1.02rem; box-shadow:0 12px 30px rgba(255,122,51,.35); transition:transform .15s; }
        .vD .hcta:active{ transform:scale(.96); }

        .vD .sec{ padding:26px 0; }
        .vD .kick{ color:var(--gold); font-weight:800; letter-spacing:.16em; text-transform:uppercase; font-size:.72rem; }
        .vD .h2{ font-size:1.7rem; font-weight:800; margin:6px 0 16px; }
        .vD .row{ display:flex; align-items:center; justify-content:space-between; }
        .vD .navb{ display:flex; gap:8px; }
        .vD .rnd{ width:42px; height:42px; border-radius:50%; border:1px solid var(--line); background:var(--glass); color:var(--lime); display:flex; align-items:center; justify-content:center; transition:transform .15s,background .2s; }
        .vD .rnd:active{ transform:scale(.9); background:rgba(143,227,154,.14); }

        .vD .stage{ position:relative; border-radius:26px; overflow:hidden; min-height:360px; display:flex; }
        .vD .stage .bg{ position:absolute; inset:0; background-size:cover; background-position:center; transition:transform .6s cubic-bezier(.16,1,.3,1); }
        .vD .stage:active .bg{ transform:scale(1.04); }
        .vD .stage .ov{ position:absolute; inset:0; background:linear-gradient(180deg,rgba(8,18,14,.15),rgba(8,18,14,.9)); }
        .vD .stage .c{ position:relative; margin-top:auto; padding:24px; }
        .vD .stage h3{ font-size:1.7rem; font-weight:800; } .vD .stage p{ color:#d7e5dc; margin-top:6px; line-height:1.5; font-size:.92rem; }
        .vD .stage .age{ display:inline-block; margin-top:14px; background:linear-gradient(90deg,var(--orange),var(--gold)); color:#1a120a; padding:6px 16px; border-radius:999px; font-weight:800; font-size:.85rem; }
        .vD .idx{ text-align:center; color:var(--mut); font-weight:700; font-size:.82rem; margin-top:10px; }
        .vD .dots{ display:flex; gap:7px; justify-content:center; margin-top:12px; flex-wrap:wrap; }
        .vD .dots button{ width:7px; height:7px; padding:0; border:none; border-radius:50%; background:var(--line); cursor:pointer; transition:width .2s,background .2s; }
        .vD .dots button.on{ background:var(--gold); width:18px; border-radius:4px; }

        .vD .tabs{ display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding-bottom:4px; }
        .vD .tabs::-webkit-scrollbar{ display:none; }
        .vD .tb{ flex:0 0 auto; border:1px solid var(--line); background:var(--glass); color:var(--mut); border-radius:999px; padding:9px 16px; font-weight:800; font-size:.85rem; transition:.2s; }
        .vD .tb.on{ background:linear-gradient(90deg,var(--orange),var(--gold)); color:#1a120a; border-color:transparent; }
        .vD .chips{ display:flex; gap:7px; margin:10px 0 16px; overflow-x:auto; scrollbar-width:none; } .vD .chips::-webkit-scrollbar{ display:none; }
        .vD .chip{ flex:0 0 auto; border:1px solid var(--line); background:none; color:var(--lime); padding:6px 14px; border-radius:999px; font-weight:800; font-size:.8rem; }
        .vD .chip.on{ background:var(--lime); color:#0C1A15; border-color:transparent; }

        .vD .meal{ overflow:hidden; display:flex; flex-direction:column; min-height:520px; }
        .vD .meal .body{ flex:1; display:flex; flex-direction:column; }
        .vD .meal .body h3{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.4em; }
        .vD .meal .body .d{ display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; min-height:4.2em; }
        .vD .meal .ph{ height:210px; background:#0e241c; position:relative; flex-shrink:0; }
        .vD .meal .ph img{ width:100%; height:100%; object-fit:cover; }
        .vD .meal .body{ padding:18px; }
        .vD .meal h3{ font-size:1.35rem; font-weight:800; } .vD .meal .d{ color:var(--mut); margin-top:6px; line-height:1.5; font-size:.9rem; }
        .vD .mac{ display:flex; gap:8px; margin-top:14px; }
        .vD .mac div{ flex:1; text-align:center; border:1px solid var(--line); border-radius:14px; padding:10px 4px; background:rgba(143,227,154,.06); }
        .vD .mac b{ display:block; color:var(--lime); } .vD .mac span{ font-size:.56rem; text-transform:uppercase; color:var(--mut); font-weight:800; letter-spacing:.05em; }
        .vD .aller{ margin-top:12px; color:var(--gold); font-size:.82rem; font-weight:700; }

        .vD .steps{ display:flex; flex-direction:column; gap:10px; }
        .vD .stp{ display:flex; gap:14px; align-items:center; padding:16px; }
        .vD .stp .n{ flex-shrink:0; width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,var(--orange),var(--gold)); color:#1a120a; display:flex; align-items:center; justify-content:center; font-weight:800; }
        .vD .stp p{ color:var(--tx); line-height:1.5; font-size:.94rem; }
        .vD .irow{ display:flex; gap:12px; overflow-x:auto; scrollbar-width:none; } .vD .irow::-webkit-scrollbar{ display:none; }
        .vD .ic{ flex:0 0 auto; width:108px; text-align:center; }
        .vD .ic .ph{ width:108px; height:108px; border-radius:20px; overflow:hidden; border:1px solid var(--line); background:var(--glass); display:flex; align-items:center; justify-content:center; }
        .vD .ic .ph img{ width:100%; height:100%; object-fit:cover; } .vD .ic b{ display:block; margin-top:8px; font-size:.84rem; } .vD .ic span{ font-size:.7rem; color:var(--mut); }
        .vD .q{ margin-bottom:9px; overflow:hidden; }
        .vD .q button{ width:100%; display:flex; justify-content:space-between; align-items:center; gap:12px; background:none; border:none; color:var(--tx); padding:16px; font-family:inherit; font-weight:800; font-size:.98rem; text-align:${isAR ? 'right' : 'left'}; }
        .vD .q .pm{ color:var(--gold); font-size:1.3rem; } .vD .q .a{ padding:0 16px 16px; color:var(--mut); line-height:1.6; font-size:.9rem; }
        .vD .foot{ text-align:center; padding:24px 0 10px; } .vD .foot img{ height:76px; object-fit:contain; } .vD .foot .fb{ font-size:2.2rem; font-weight:800; color:var(--orange); } .vD .foot .r{ color:var(--mut); margin-top:10px; font-size:.78rem; }

        .vD .tabbar{ position:fixed; left:0; right:0; bottom:0; z-index:50; background:rgba(12,26,21,.82); border-top:1px solid var(--line); backdrop-filter:blur(16px); display:flex; justify-content:space-around; padding:9px 0 14px; direction:ltr; }
        .vD .tbi{ background:none; border:none; display:flex; flex-direction:column; align-items:center; gap:3px; color:var(--mut); font-size:.66rem; font-weight:800; text-decoration:none; transition:color .2s; }
        .vD .tbi.on{ color:var(--gold); }
        @keyframes ninozPulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.16); } }
        .vD .tbi.startplan{ color:var(--orange) !important; }
        .vD .tbi.startplan svg{ animation:ninozPulse 1.25s ease-in-out infinite; }
        .vD .wa{ position:fixed; ${isAR ? 'left' : 'right'}:16px; bottom:98px; z-index:55; width:54px; height:54px; border-radius:50%; background:#25D366; box-shadow:0 12px 26px rgba(37,211,102,.4); display:flex; align-items:center; justify-content:center; }
      `}</style>

      {gate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3500, background: 'radial-gradient(120% 90% at 50% 20%, #122A22, #0C1A15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28, textAlign: 'center' }}>
          {logo?.url ? <img src={logo.url} alt="Ninoz" style={{ height: 120, maxWidth: '70vw', objectFit: 'contain', marginBottom: 6 }} /> : <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--orange)' }}>Ninoz</div>}
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tx)' }}>{isAR ? 'أهلاً بكِ في نينوز' : 'Welcome to Ninoz'}</div>
          <div style={{ fontSize: '.95rem', color: 'var(--mut)', maxWidth: 320, lineHeight: 1.6 }}>{isAR ? 'سجّلي الدخول أو تابعي كضيف لتصفّح الوجبات.' : 'Sign in, or continue as a guest to browse the meals.'}</div>
          <button onClick={() => chooseEntry(false)} style={{ marginTop: 8, border: 'none', background: 'linear-gradient(90deg,var(--orange),var(--gold))', color: '#1a120a', padding: '14px 34px', borderRadius: 999, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 12px 30px rgba(255,122,51,.35)' }}>{isAR ? 'تسجيل الدخول' : 'Sign in'}</button>
          <button onClick={() => chooseEntry(true)} style={{ border: '1px solid var(--line)', background: 'var(--glass)', color: 'var(--mut)', padding: '9px 20px', borderRadius: 999, fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2 }}>{isAR ? 'المتابعة كضيف' : 'Continue as guest'}</button>
        </div>
      )}

      <div className="hdr"><div className="wrap hdrin">
        <div className="hr">
          <button className="gbtn" onClick={switchLang}>{isAR ? 'English' : 'عربي'}</button>
        </div>
        <a className="brand" href="/">{logo?.url ? <img src={logo.url} alt="Ninoz" /> : <span>Ninoz</span>}</a>
      </div></div>

      {gg('service_area_note') && (
        <div className="svcbar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
          {gg('service_area_note')}
        </div>
      )}

      {customerName && (
        <div className="wrap"><div className="greet">{isAR ? 'مرحباً،' : 'Welcome,'} <b>{customerName.split(' ')[0]}</b></div></div>
      )}

      {curN && (
        <div className="wrap">
          <div className="newsstack">
            {totN > 1 && <div className="peek two" />}
            {totN > 1 && <div className="peek" />}
            <div className="news" onClick={() => setNewsOpen(o => !o)}
              onTouchStart={e => { newsTouchX.current = e.touches[0].clientX }}
              onTouchEnd={e => { if (newsTouchX.current == null) return; const d = newsTouchX.current - e.changedTouches[0].clientX; if (d > 40) nextN(); if (d < -40) prevN(); newsTouchX.current = null }}>
              <div className="ntag">{isAR ? 'أخبار نينوز' : 'Ninoz News'}</div>
              <h4>{nName(curN)}</h4>
              {newsOpen && nBody(curN) && <div className="nbody">{nBody(curN)}</div>}
              {totN > 1 && (
                <div className="ndots" style={{ justifyContent: 'center', marginTop: 14 }}>{newsItems.map((_, i) => <i key={i} className={i === (newsI % totN) ? 'on' : ''} />)}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="wrap">
        <section className="hero">
          <div className="glow" />
          <h1>{gg('hero_headline_1', isAR ? 'أنتِ تهتمين' : 'You care.')} <em>{gg('hero_headline_2', isAR ? 'ونحن نحضّر' : 'We prepare.')}</em></h1>
          <p>{gg('hero_description', isAR ? 'وجبات طازجة تُطبخ يومياً لكل مرحلة من مراحل طفلك.' : 'Fresh meals cooked daily for every stage of your little one.')}</p>
        </section>

        {curS && (
        <section className="sec reveal">
          <div className="row" style={{ marginBottom: 14 }}>
            <div><div className="kick">{isAR ? 'المراحل' : 'Stages'}</div><div className="h2" style={{ margin: 0 }}>{gg('stages_built_for', isAR ? 'لكل مرحلة' : 'Their stage')}</div></div>
          </div>
          <div className="stage" onTouchStart={e => { stageTouchX.current = e.touches[0].clientX }} onTouchEnd={e => { if (stageTouchX.current == null) return; const d = stageTouchX.current - e.changedTouches[0].clientX; if (d > 40) nextS(); if (d < -40) prevS(); stageTouchX.current = null }}>
            {curS.image_url && <div className="bg" style={{ backgroundImage: `url(${curS.image_url})` }} />}
            <div className="ov" /><div className="c"><h3>{sName(curS)}</h3><p>{sDesc(curS)}</p><span className="age">{sAge(curS)}</span></div>
          </div>
          {totS > 1 && <div className="dots">{stages.map((_, i) => <button key={i} aria-label={`stage ${i + 1}`} className={i === (stageI % totS) ? 'on' : ''} onClick={() => setStageI(i)} />)}</div>}
        </section>)}

        <section className="sec">
          <div className="kick">{isAR ? 'القائمة' : 'The menu'}</div>
          <div className="h2">{gg('menu_real_food', isAR ? 'طعام حقيقي، كل يوم' : 'Real food, every day')}</div>
          <div className="tabs">{categories.map(c => <button key={c.id} className={`tb ${tab === c.slug ? 'on' : ''}`} onClick={() => setTab(c.slug)}>{cName(c)}</button>)}</div>
          {stages.length > 0 && <div className="chips">{stages.map(s => { const on = stageFilter === s.id; return <button key={s.id} className={`chip ${on ? 'on' : ''}`} onClick={() => setStageFilter(on ? '' : s.id)}>{sName(s)}</button> })}</div>}
          {currM ? (
            <div className="glass meal" onTouchStart={e => { mealTouchX.current = e.touches[0].clientX }} onTouchEnd={e => { if (mealTouchX.current == null) return; const d = mealTouchX.current - e.changedTouches[0].clientX; if (d > 40) nextM(); if (d < -40) prevM(); mealTouchX.current = null }}>
              <div className="ph">{currM.image_url ? <img src={currM.image_url} alt={mName(currM)} /> : null}</div>
              <div className="body">
                <div className="row"><h3>{mName(currM)}</h3></div>
                <div className="d">{mDesc(currM)}</div>
                <div className="mac">{[{ v: currM.weight_g, l: isAR ? 'وزن' : 'Weight' }, { v: currM.protein_g, l: isAR ? 'بروتين' : 'Protein' }, { v: currM.carbs_g, l: isAR ? 'كارب' : 'Carbs' }, { v: currM.fiber_g, l: isAR ? 'ألياف' : 'Fiber' }].map(n => <div key={n.l}><b>{n.v ? `${n.v}g` : '0'}</b><span>{n.l}</span></div>)}</div>
                {currM.allergens && <div className="aller">{isAR ? 'حساسية: ' : 'Allergens: '}{mAllergens(currM)}</div>}
                {totM > 1 && <div className="dots" style={{ marginTop: 'auto', paddingTop: 12 }}>{mls.map((_, i) => <button key={i} aria-label={`meal ${i + 1}`} className={i === mealI ? 'on' : ''} onClick={() => setMealI(i)} />)}</div>}
              </div>
            </div>
          ) : <p style={{ color: 'var(--mut)' }}>{isAR ? 'لا توجد وجبات.' : 'No meals here.'}</p>}
        </section>

        {totH > 0 && (<section className="sec reveal"><div className="kick">{isAR ? 'كيف نعمل' : 'How it works'}</div><div className="h2">{gg('how_title', isAR ? 'ثلاث خطوات' : 'Three steps')}</div>
          <div className="steps">{howSteps.slice(0, 3).map((h, i) => <div className="glass stp" key={h.id}><div className="n">{i + 1}</div><p>{hDesc(h)}</p></div>)}</div></section>)}

        {totI > 0 && (<section className="sec reveal"><div className="kick">{isAR ? 'المكوّنات' : 'Ingredients'}</div><div className="h2">{gg('why_only_real', isAR ? 'مكوّنات حقيقية' : 'Real ingredients')}</div>
          <div className="irow">{ingredients.map(i => <div className="ic" key={i.id}><div className="ph">{i.image_url ? <img src={i.image_url} alt={iName(i)} /> : null}</div><b>{iName(i)}</b><span>{iDesc(i)}</span></div>)}</div></section>)}

        {faqs.length > 0 && (<section className="sec reveal"><div className="kick">{isAR ? 'أسئلة' : 'FAQ'}</div><div className="h2">{gg('faq_common_questions', isAR ? 'أسئلة شائعة' : 'Common questions')}</div>
          {faqs.map(f => <div className="glass q" key={f.id}><button onClick={() => setFaq(faq === f.id ? null : f.id)}><span>{fQuestion(f)}</span><span className="pm" style={{ display: 'inline-flex', transform: faq === f.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg></span></button>{faq === f.id && <div className="a">{fAnswer(f)}</div>}</div>)}</section>)}

        {(() => {
          const cEmail = g(content, 'footer_contact_email', 'hello@ninoz.app')
          const cInsta = (g(content, 'contact_instagram', 'ninoz.app') || '').replace(/^@|^https?:\/\/(www\.)?instagram\.com\//i, '')
          return (
        <div className="foot">
          {logo?.url ? <img src={logo.url} alt="Ninoz" /> : <div className="fb">Ninoz</div>}
          <div className="frow">
            <a className="wa2" href={`https://wa.me/${w}`} target="_blank" rel="noreferrer"><svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d={waPath} /></svg>{isAR ? 'واتساب' : 'WhatsApp'}</a>
            <a className="em" href={`mailto:${cEmail}`}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>{isAR ? 'البريد' : 'Email'}</a>
            <a className="ig" href={`https://instagram.com/${cInsta}`} target="_blank" rel="noreferrer"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>@{cInsta}</a>
          </div>
          <div className="r">{gg('footer_rights', '© 2026 Ninoz. All rights reserved.')}</div>
        </div>) })()}
      </div>

      <nav className="tabbar">
        <button className="tbi on" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>{isAR ? 'الرئيسية' : 'Home'}</button>
        <button className={`tbi ${hasPlan ? '' : 'startplan'}`} onClick={() => hasPlan ? router.push('/account/dashboard') : startPlan()}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 10h8M8 14h5"/></svg>{hasPlan ? (isAR ? 'خطتي' : 'My Plan') : (isAR ? 'ابدئي خطتك' : 'Start Plan')}</button>
        <button className="tbi" onClick={goToAccount}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="8" r="3.3"/><path d="M5.5 20c0-3 3-4.8 6.5-4.8s6.5 1.8 6.5 4.8"/></svg>{isAR ? 'حسابي' : 'Account'}</button>
      </nav>
    </div>
  )
}
