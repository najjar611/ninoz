'use client'

// ══════════════════════════════════════════════════════════
// SubscriptionPopup.tsx — v6
// 4-step popup matching the design PDF
// Food photos scattered background
// Step 1: Email
// Step 2: First Name, Kid Name, Kid Birthday
// Step 3: Choose Stage
// Step 4: Payment Cycle
// Saves to lead_subscribers in Supabase
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stage = { id: string; name: string; age_range: string; description: string; card_bg: string; emoji: string }
type PaymentCycle = { id: string; label: string; days: number; meals_total: number; price_sar: number }

type Props = {
  stages: Stage[]
  paymentCycles: PaymentCycle[]
  content: Record<string, string>
  onClose: () => void
}

const c = (content: Record<string, string>, key: string, fallback = '') => content[key] || fallback

const FOOD_DECORATIONS = [
  { top: '0%', left: '0%', emoji: '🥕', size: 80, rotate: -20 },
  { top: '0%', right: '0%', emoji: '🥦', size: 80, rotate: 15 },
  { bottom: '0%', left: '0%', emoji: '🫛', size: 70, rotate: 10 },
  { bottom: '0%', right: '0%', emoji: '🍊', size: 75, rotate: -15 },
  { top: '30%', left: '-2%', emoji: '🥬', size: 60, rotate: 20 },
  { top: '50%', right: '-2%', emoji: '🍠', size: 65, rotate: -10 },
]

export default function SubscriptionPopup({ stages, paymentCycles, content, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [parentName, setParentName] = useState('')
  const [kidName, setKidName] = useState('')
  const [kidBirthday, setKidBirthday] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedCycle, setSelectedCycle] = useState('')

  function canNext() {
    if (step === 1) return email.includes('@')
    if (step === 2) return parentName.trim().length > 0 && kidName.trim().length > 0
    if (step === 3) return !!selectedStage
    if (step === 4) return !!selectedCycle
    return false
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const stageObj = stages.find(s => s.id === selectedStage)
      const { error: err } = await supabase.from('lead_subscribers').insert({
        email,
        parent_name: parentName,
        kid_name: kidName,
        kid_birthday: kidBirthday || null,
        stage_id: selectedStage || null,
        payment_cycle: selectedCycle || null,
        status: 'lead',
      })
      if (err) throw err
      setDone(true)
    } catch (e: any) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepTitles = [
    c(content, 'popup_step1_title', "Let's get started"),
    c(content, 'popup_step2_title', 'Meal Picks, Just for you'),
    c(content, 'popup_step3_title', 'Customized Your Plan'),
    c(content, 'popup_step4_title', 'Payment Cycle'),
  ]
  const stepSubtitles = [
    '',
    c(content, 'popup_step2_subtitle', 'With a few basic details we will cater your experience to the needs of your family'),
    c(content, 'popup_step3_subtitle', 'Fresh & healthy meals delivered to your doorstep'),
    c(content, 'popup_step4_subtitle', 'Fresh & healthy meals delivered to your doorstep'),
  ]

  return (
    <>
      <style>{`
        .sp-overlay {
          position: fixed; inset: 0; z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; background: rgba(44,26,14,0.5);
          backdrop-filter: blur(8px);
          animation: spFade 0.25s ease;
        }
        @keyframes spFade { from { opacity: 0 } to { opacity: 1 } }

        .sp-box {
          background: white; border-radius: 28px;
          width: 100%; max-width: 480px;
          position: relative; overflow: hidden;
          animation: spSlide 0.3s ease;
          max-height: 92vh; overflow-y: auto;
        }
        @keyframes spSlide { from { transform: scale(0.92); opacity: 0 } to { transform: scale(1); opacity: 1 } }

        /* Food decoration photos */
        .sp-food-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
        }
        .sp-food-item {
          position: absolute; font-size: 80px; opacity: 0.18; user-select: none;
        }

        .sp-inner { position: relative; z-index: 1; padding: 40px 36px 36px; }

        .sp-close {
          position: absolute; top: 16px; right: 16px; z-index: 10;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(44,26,14,0.08); border: none;
          color: #2C1A0E; font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }

        .sp-progress {
          display: flex; gap: 6px; margin-bottom: 32px;
        }
        .sp-prog-bar {
          flex: 1; height: 4px; border-radius: 2px;
          background: rgba(200,75,15,0.15); transition: background 0.3s;
        }
        .sp-prog-bar.filled { background: #C84B0F; }

        .sp-title {
          font-family: 'Nunito', sans-serif; font-size: 26px; font-weight: 900;
          color: #C84B0F; text-align: center; margin-bottom: 6px;
        }
        .sp-subtitle {
          font-size: 13px; color: #7A7068; text-align: center;
          line-height: 1.55; margin-bottom: 28px; max-width: 340px; margin-inline: auto;
        }

        .sp-label {
          display: block; font-size: 12px; font-weight: 700;
          color: #2C1A0E; margin-bottom: 7px; letter-spacing: 0.04em;
        }
        .sp-input {
          width: 100%; padding: 14px 16px;
          border: 1.5px solid rgba(200,75,15,0.25);
          border-radius: 10px; font-size: 15px;
          font-family: 'Nunito Sans', sans-serif; color: #2C1A0E;
          outline: none; transition: border-color 0.2s;
          box-sizing: border-box; margin-bottom: 16px;
          background: rgba(250,245,238,0.5);
        }
        .sp-input:focus { border-color: #C84B0F; background: white; }

        /* Stage cards */
        .sp-stages { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
        .sp-stage {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border: 2px solid rgba(200,75,15,0.15);
          border-radius: 14px; cursor: pointer; transition: all 0.2s;
          background: white; position: relative;
        }
        .sp-stage.selected { border-color: #C84B0F; background: #FDF5F0; }
        .sp-stage:hover:not(.selected) { border-color: rgba(200,75,15,0.35); }
        .sp-stage-emoji { font-size: 32px; }
        .sp-stage-info { flex: 1; }
        .sp-stage-name { font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 800; color: #2C1A0E; }
        .sp-stage-age { font-size: 12px; color: #7A7068; margin-top: 2px; }
        .sp-stage-desc { font-size: 12px; color: #A08070; line-height: 1.4; margin-top: 3px; }
        .sp-stage-check {
          width: 22px; height: 22px; border-radius: 50%;
          background: #C84B0F; color: white; font-size: 11px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* Payment cycles */
        .sp-cycles { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
        .sp-cycle {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; border: 2px solid rgba(200,75,15,0.15);
          border-radius: 14px; cursor: pointer; transition: all 0.2s;
          background: white; position: relative;
        }
        .sp-cycle.selected { border-color: #C84B0F; background: #FDF5F0; }
        .sp-cycle:hover:not(.selected) { border-color: rgba(200,75,15,0.35); }
        .sp-cycle-info { flex: 1; }
        .sp-cycle-label { font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 800; color: #C84B0F; }
        .sp-cycle-detail { font-size: 12px; color: #7A7068; margin-top: 3px; }
        .sp-cycle-price { font-family: 'Nunito', sans-serif; font-size: 20px; font-weight: 900; color: #2C1A0E; }
        .sp-cycle-price-sub { font-size: 11px; color: #A08070; text-align: right; }

        .sp-actions { display: flex; gap: 10px; margin-top: 24px; }
        .sp-back {
          padding: 14px 20px; border: 2px solid rgba(44,26,14,0.1);
          border-radius: 12px; background: white; font-family: 'Nunito', sans-serif;
          font-size: 14px; font-weight: 700; color: #7A7068; cursor: pointer;
          transition: all 0.2s;
        }
        .sp-back:hover { border-color: #C84B0F; color: #C84B0F; }
        .sp-next {
          flex: 1; padding: 15px; background: #C84B0F; color: white; border: none;
          border-radius: 12px; font-family: 'Nunito', sans-serif;
          font-size: 15px; font-weight: 800; cursor: pointer;
          transition: background 0.2s; letter-spacing: 0.05em;
        }
        .sp-next:hover:not(:disabled) { background: #A33A0A; }
        .sp-next:disabled { opacity: 0.5; cursor: not-allowed; }

        .sp-error {
          background: #FEE2E2; color: #DC2626; padding: 10px 14px;
          border-radius: 8px; font-size: 13px; margin-top: 8px;
        }

        /* Done state */
        .sp-done { padding: 48px 36px; text-align: center; }
        .sp-done-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: #FDF0E8; font-size: 40px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
        }
        .sp-done-title {
          font-family: 'Nunito', sans-serif; font-size: 26px;
          font-weight: 900; color: #2C1A0E; margin-bottom: 12px;
        }
        .sp-done-text { font-size: 14px; color: #7A7068; line-height: 1.7; margin-bottom: 28px; }
        .sp-done-btn {
          padding: 14px 40px; background: #C84B0F; color: white; border: none;
          border-radius: 50px; font-family: 'Nunito', sans-serif;
          font-size: 15px; font-weight: 800; cursor: pointer;
        }

        @media (max-width: 480px) {
          .sp-box { border-radius: 20px; }
          .sp-inner { padding: 32px 24px 28px; }
          .sp-title { font-size: 22px; }
        }
      `}</style>

      <div className="sp-overlay" onClick={onClose}>
        <div className="sp-box" onClick={e => e.stopPropagation()}>
          {/* Food decorations */}
          <div className="sp-food-bg">
            {FOOD_DECORATIONS.map((d, i) => (
              <span key={i} className="sp-food-item" style={{
                top: (d as any).top, bottom: (d as any).bottom,
                left: (d as any).left, right: (d as any).right,
                fontSize: d.size, transform: `rotate(${d.rotate}deg)`,
              }}>
                {d.emoji}
              </span>
            ))}
          </div>

          <button className="sp-close" onClick={onClose}>✕</button>

          {done ? (
            <div className="sp-done">
              <div className="sp-done-icon">🎉</div>
              <div className="sp-done-title">You're on the list, {parentName}!</div>
              <div className="sp-done-text">
                We'll reach out to <strong>{email}</strong> shortly to confirm your plan
                and set up delivery for <strong>{kidName}</strong>.<br /><br />
                No payment taken yet — we'll walk you through everything.
              </div>
              <button className="sp-done-btn" onClick={onClose}>Back to Home</button>
            </div>
          ) : (
            <div className="sp-inner">
              {/* Progress */}
              <div className="sp-progress">
                {[1,2,3,4].map(n => (
                  <div key={n} className={`sp-prog-bar ${n <= step ? 'filled' : ''}`} />
                ))}
              </div>

              {/* Title */}
              <div className="sp-title">{stepTitles[step - 1]}</div>
              {stepSubtitles[step - 1] && (
                <div className="sp-subtitle">{stepSubtitles[step - 1]}</div>
              )}

              {/* Step 1: Email */}
              {step === 1 && (
                <div>
                  <label className="sp-label">{c(content, 'popup_step1_field1', 'Email')}</label>
                  <input
                    className="sp-input" type="email"
                    placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter' && canNext()) setStep(2) }}
                  />
                </div>
              )}

              {/* Step 2: Names */}
              {step === 2 && (
                <div>
                  <label className="sp-label">{c(content, 'popup_step2_field1', 'Your First Name')}</label>
                  <input className="sp-input" type="text" placeholder="e.g. Sara"
                    value={parentName} onChange={e => setParentName(e.target.value)} autoFocus />
                  <label className="sp-label">{c(content, 'popup_step2_field2', "Kid's Name")}</label>
                  <input className="sp-input" type="text" placeholder="e.g. Adam"
                    value={kidName} onChange={e => setKidName(e.target.value)} />
                  <label className="sp-label">
                    {c(content, 'popup_step2_field3', "Kid's Birthday")}
                    <span style={{ fontWeight: 400, color: '#A08070' }}> (optional)</span>
                  </label>
                  <input className="sp-input" type="date" value={kidBirthday}
                    onChange={e => setKidBirthday(e.target.value)} style={{ marginBottom: 0 }} />
                </div>
              )}

              {/* Step 3: Stage */}
              {step === 3 && (
                <div className="sp-stages">
                  {stages.map(stage => (
                    <div key={stage.id}
                      className={`sp-stage ${selectedStage === stage.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStage(stage.id)}>
                      <span className="sp-stage-emoji">{stage.emoji}</span>
                      <div className="sp-stage-info">
                        <div className="sp-stage-name">{stage.name}</div>
                        <div className="sp-stage-age">{stage.age_range}</div>
                        <div className="sp-stage-desc">{stage.description}</div>
                      </div>
                      {selectedStage === stage.id && <div className="sp-stage-check">✓</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 4: Payment */}
              {step === 4 && (
                <div className="sp-cycles">
                  {paymentCycles.map(cycle => (
                    <div key={cycle.id}
                      className={`sp-cycle ${selectedCycle === cycle.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCycle(cycle.id)}>
                      <div className="sp-cycle-info">
                        <div className="sp-cycle-label">{cycle.label}</div>
                        <div className="sp-cycle-detail">{cycle.days} days / {cycle.meals_total} meals total</div>
                      </div>
                      <div>
                        <div className="sp-cycle-price">{cycle.price_sar} SAR</div>
                        <div className="sp-cycle-price-sub">per {cycle.label.toLowerCase()}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: '#A08070', marginTop: 4, textAlign: 'center' }}>
                    No payment now — we'll contact you to confirm.
                  </div>
                </div>
              )}

              {error && <div className="sp-error">{error}</div>}

              <div className="sp-actions">
                {step > 1 && (
                  <button className="sp-back" onClick={() => setStep(s => s - 1)}>← Back</button>
                )}
                <button
                  className="sp-next"
                  disabled={!canNext() || loading}
                  onClick={() => {
                    if (step < 4) setStep(s => s + 1)
                    else handleSubmit()
                  }}
                >
                  {loading ? 'Submitting...' : step === 4
                    ? c(content, 'popup_btn_submit', 'SUBMIT')
                    : c(content, 'popup_btn_continue', 'CONTINUE')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
