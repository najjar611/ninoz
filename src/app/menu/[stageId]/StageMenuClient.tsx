'use client'

import { useState } from 'react'
import Link from 'next/link'

type Meal = {
  id: string; name: string; description: string; ingredients: string
  allergens: string; image_url: string | null; calories: string; position: number; is_active: boolean
}
type MealType = { id: string; name: string; position: number; meals: Meal[] }
type Stage = { id: string; name: string; age_range: string; description: string; image_url: string | null; emoji: string; tag_color: string }

type Props = { stage: Stage; mealTypes: MealType[] }

export default function StageMenuClient({ stage, mealTypes }: Props) {
  const [activeTab, setActiveTab] = useState(mealTypes[0]?.id || '')
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)

  const activeMealType = mealTypes.find(mt => mt.id === activeTab)
  const meals = (activeMealType?.meals || []).filter(m => m.is_active).sort((a, b) => a.position - b.position)
  const accentColor = stage.tag_color || '#C84B0F'

  return (
    <>
      <style>{`
        .meal-card {
          background: white; border-radius: 16px; overflow: hidden;
          cursor: pointer; border: 1px solid rgba(44,26,14,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex; flex-direction: column;
        }
        .meal-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(44,26,14,0.1); }
        .tab-btn {
          padding: 11px 24px; border-radius: 50px; border: 2px solid transparent;
          cursor: pointer; font-size: 14px; font-weight: 700;
          transition: all 0.2s; font-family: var(--font-body);
        }
        .tab-btn.active { border-color: ${accentColor}; color: ${accentColor}; background: ${accentColor}12; }
        .tab-btn:not(.active) { background: white; color: #7A6055; border-color: rgba(44,26,14,0.12); }
        .tab-btn:not(.active):hover { border-color: ${accentColor}; color: ${accentColor}; }
        .back-btn { display:inline-flex; align-items:center; gap:6px; font-size:14px; color:#7A6055; text-decoration:none; font-weight:600; transition:color 0.2s; }
        .back-btn:hover { color:#2C1A0E; }
        .popup-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); animation:fadeIn 0.2s ease; }
        .popup-content { background:white; border-radius:24px; max-width:480px; width:100%; max-height:90vh; overflow-y:auto; animation:slideUp 0.3s cubic-bezier(0.22,1,0.36,1); }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        .meals-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        @media(max-width:480px) { .meals-grid { gap:10px; } }
      `}</style>

      <main style={{ background:'var(--cream)', minHeight:'100vh', paddingBottom:'80px' }}>

        {/* Header */}
        <div style={{ background:'white', borderBottom:'1px solid rgba(44,26,14,0.08)', padding:'0 6%', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Link href="/" className="back-btn">← Back</Link>
            <div style={{ fontFamily:'var(--font-hero)', fontSize:'22px', color:'var(--orange)', fontWeight:900 }}>Ninoz</div>
            <div style={{ width:'60px' }} />
          </div>
        </div>

        {/* Stage info */}
        <div style={{ padding:'48px 6% 36px', maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ display:'inline-block', background:`${accentColor}15`, color:accentColor, fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'5px 14px', borderRadius:'50px', marginBottom:'14px' }}>
            {stage.age_range}
          </div>
          <h1 style={{ fontFamily:'var(--font-hero)', fontSize:'clamp(28px,4vw,52px)', fontWeight:900, lineHeight:1.1, marginBottom:'12px', color:'var(--text)' }}>
            {stage.name}
          </h1>
          <p style={{ fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7, maxWidth:'560px' }}>{stage.description}</p>
        </div>

        {/* Meal type tabs */}
        <div style={{ padding:'0 6%', maxWidth:'1100px', margin:'0 auto 32px' }}>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            {mealTypes.map(mt => (
              <button key={mt.id} onClick={() => setActiveTab(mt.id)} className={`tab-btn ${activeTab === mt.id ? 'active' : ''}`}>
                {mt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Meals grid — 2 per row */}
        <div style={{ padding:'0 6%', maxWidth:'1100px', margin:'0 auto' }}>
          {meals.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', color:'var(--text-muted)', fontSize:'15px', background:'white', borderRadius:'20px', border:'1px solid rgba(44,26,14,0.08)' }}>
              No meals added yet for this category.<br/>Add them from the admin portal → Meals.
            </div>
          ) : (
            <div className="meals-grid">
              {meals.map(meal => (
                <div key={meal.id} className="meal-card" onClick={() => setSelectedMeal(meal)}>
                  <div style={{ height:'180px', overflow:'hidden', background:'#F2EAE0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'52px', flexShrink:0 }}>
                    {meal.image_url
                      ? <img src={meal.image_url} alt={meal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : '🍽️'
                    }
                  </div>
                  <div style={{ padding:'14px 16px 18px', flex:1, display:'flex', flexDirection:'column' }}>
                    <div style={{ fontFamily:'var(--font-hero)', fontSize:'15px', fontWeight:800, color:'var(--text)', marginBottom:'4px', lineHeight:1.3 }}>{meal.name}</div>
                    {meal.calories && <div style={{ fontSize:'11px', color:accentColor, fontWeight:600, marginBottom:'8px' }}>{meal.calories}</div>}
                    <div style={{ marginTop:'auto', fontSize:'12px', color:accentColor, fontWeight:700 }}>Tap for details →</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Meal detail popup */}
      {selectedMeal && (
        <div className="popup-overlay" onClick={() => setSelectedMeal(null)}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <div style={{ height:'260px', overflow:'hidden', background:'#F2EAE0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'80px', position:'relative', borderRadius:'24px 24px 0 0' }}>
              {selectedMeal.image_url
                ? <img src={selectedMeal.image_url} alt={selectedMeal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : '🍽️'
              }
              <button onClick={() => setSelectedMeal(null)} style={{ position:'absolute', top:'12px', right:'12px', width:'34px', height:'34px', borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', color:'white', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ padding:'24px 28px 28px' }}>
              <h2 style={{ fontFamily:'var(--font-hero)', fontSize:'26px', fontWeight:900, color:'var(--text)', marginBottom:'6px' }}>{selectedMeal.name}</h2>
              {selectedMeal.calories && <div style={{ fontSize:'12px', color:accentColor, fontWeight:700, marginBottom:'16px' }}>{selectedMeal.calories}</div>}
              {selectedMeal.description && <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.75, marginBottom:'20px' }}>{selectedMeal.description}</p>}
              {selectedMeal.ingredients && (
                <div style={{ marginBottom:'16px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'8px' }}>Ingredients</div>
                  <p style={{ fontSize:'14px', color:'var(--text)', lineHeight:1.65 }}>{selectedMeal.ingredients}</p>
                </div>
              )}
              {selectedMeal.allergens && (
                <div style={{ background:'#FEF9EE', border:'1px solid rgba(200,75,15,0.2)', borderRadius:'12px', padding:'14px 18px', marginBottom:'20px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--orange)', marginBottom:'6px' }}>⚠️ Allergens</div>
                  <p style={{ fontSize:'14px', color:'var(--text)' }}>{selectedMeal.allergens}</p>
                </div>
              )}
              <button onClick={() => setSelectedMeal(null)} style={{ width:'100%', padding:'14px', borderRadius:'50px', border:'none', background:'var(--orange)', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
