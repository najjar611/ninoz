'use client'

// ══════════════════════════════════════════════════════════
// SubscriptionPopup.tsx — v5
// 4-step multi-step popup (no payment, saves lead to Supabase)
// Step 1: Email
// Step 2: Parent name + Kid name + Kid birthday
// Step 3: Choose Stage
// Step 4: Payment cycle (Weekly / Monthly / 3-months with prices)
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  defaultStage?: string
  onClose: () => void
}

type FormData = {
  email: string
  parentName: string
  kidName: string
  kidBirthday: string
  stage: string
  paymentCycle: string
}

const STAGES = [
  {
    id: 'stage1',
    emoji: '🍼',
    name: 'Baby Blends',
    subtitle: '3–6 months',
    desc: 'Smooth purées, gentle introduction to solids.',
    color: '#E8834A',
  },
  {
    id: 'stage2',
    emoji: '🥣',
    name: 'Textured Meals',
    subtitle: '6–12 months',
    desc: 'Graduated textures, bolder flavors, iron-rich.',
    color: '#4A7C59',
  },
  {
    id: 'stage3',
    emoji: '🍗',
    name: 'Big Baby Meals',
    subtitle: '1–3 years',
    desc: 'Real chunks, exciting flavors for toddlers.',
    color: '#7B5EA7',
  },
]

const CYCLES = [
  {
    id: 'weekly',
    label: 'Weekly',
    prices: { stage1: 299, stage2: 349, stage3: 399 },
    badge: null,
    desc: 'Cancel or pause anytime before 10pm.',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    prices: { stage1: 1099, stage2: 1199, stage3: 1299 },
    badge: 'Most Popular',
    desc: 'Save ~10% vs weekly billing.',
  },
  {
    id: '3months',
    label: '3 Months',
    prices: { stage1: 2999, stage2: 3299, stage3: 3599 },
    badge: 'Best Value',
    desc: 'Biggest savings — lock in for 3 months.',
  },
]

export default function SubscriptionPopup({ defaultStage = '', onClose }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    email: '',
    parentName: '',
    kidName: '',
    kidBirthday: '',
    stage: defaultStage,
    paymentCycle: '',
  })

  const set = (key: keyof FormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const selectedStage = STAGES.find(s => s.id === form.stage)
  const selectedCycle = CYCLES.find(c => c.id === form.paymentCycle)

  function getPrice() {
    if (!selectedCycle || !form.stage) return null
    return selectedCycle.prices[form.stage as keyof typeof selectedCycle.prices]
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('lead_subscribers').insert({
        email: form.email,
        parent_name: form.parentName,
        kid_name: form.kidName,
        kid_birthday: form.kidBirthday || null,
        stage: form.stage,
        payment_cycle: form.paymentCycle,
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

  // Validate per step
  function canNext() {
    if (step === 1) return form.email.includes('@')
    if (step === 2) return form.parentName.trim().length > 0 && form.kidName.trim().length > 0
    if (step === 3) return !!form.stage
    if (step === 4) return !!form.paymentCycle
    return false
  }

  return (
    <>
      <style>{`
        .sub-overlay {
          position: fixed;
          inset: 0;
          background: rgba(44,26,14,0.65);
          backdrop-filter: blur(6px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: subFadeIn 0.2s ease;
        }
        @keyframes subFadeIn { from { opacity: 0 } to { opacity: 1 } }

        .sub-box {
          background: white;
          border-radius: 28px;
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          animation: subSlide 0.25s ease;
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes subSlide {
          from { transform: translateY(24px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }

        .sub-header {
          background: #C84B0F;
          padding: 28px 28px 24px;
          position: relative;
        }
        .sub-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sub-step-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .sub-title {
          font-family: 'Nunito', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: white;
          margin-bottom: 16px;
        }

        /* Progress bar */
        .progress-track {
          display: flex;
          gap: 6px;
        }
        .prog-dot {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.3);
          transition: background 0.3s;
        }
        .prog-dot.filled { background: white; }

        .sub-body {
          padding: 28px;
        }

        .sub-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #2C1A0E;
          margin-bottom: 7px;
        }
        .sub-input {
          width: 100%;
          padding: 13px 16px;
          border: 2px solid #EDE8E0;
          border-radius: 12px;
          font-size: 15px;
          font-family: 'Nunito Sans', sans-serif;
          color: #2C1A0E;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          margin-bottom: 16px;
        }
        .sub-input:focus { border-color: #C84B0F; }

        /* Stage cards */
        .stage-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 4px;
        }
        .stage-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 2px solid #EDE8E0;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        .stage-card.selected {
          border-color: #C84B0F;
          background: #FDF5F0;
        }
        .stage-card:hover:not(.selected) { border-color: #F0C8B0; }
        .stage-emoji { font-size: 28px; }
        .stage-info { flex: 1; }
        .stage-name {
          font-family: 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #2C1A0E;
          margin-bottom: 2px;
        }
        .stage-sub { font-size: 12px; color: #7A7068; }
        .stage-check {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #C84B0F;
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Cycle cards */
        .cycle-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 4px;
        }
        .cycle-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 2px solid #EDE8E0;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          position: relative;
        }
        .cycle-card.selected {
          border-color: #C84B0F;
          background: #FDF5F0;
        }
        .cycle-card:hover:not(.selected) { border-color: #F0C8B0; }
        .cycle-badge {
          position: absolute;
          top: -8px;
          right: 14px;
          background: #C84B0F;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cycle-label-wrap { flex: 1; }
        .cycle-label {
          font-family: 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #2C1A0E;
        }
        .cycle-desc { font-size: 12px; color: #7A7068; margin-top: 2px; }
        .cycle-price {
          font-family: 'Nunito', sans-serif;
          font-size: 18px;
          font-weight: 900;
          color: #C84B0F;
          text-align: right;
        }
        .cycle-price-sub { font-size: 10px; color: #A08070; text-align: right; }

        /* Bottom actions */
        .sub-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }
        .sub-back {
          padding: 14px 20px;
          border: 2px solid #EDE8E0;
          border-radius: 12px;
          background: white;
          font-family: 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #7A7068;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sub-back:hover { border-color: #C84B0F; color: #C84B0F; }
        .sub-next {
          flex: 1;
          padding: 14px;
          background: #C84B0F;
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sub-next:hover:not(:disabled) { background: #A33A0A; }
        .sub-next:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Done state */
        .sub-done {
          padding: 48px 28px;
          text-align: center;
        }
        .done-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #FDF0E8;
          font-size: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .done-title {
          font-family: 'Nunito', sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: #2C1A0E;
          margin-bottom: 10px;
        }
        .done-text { font-size: 14px; color: #7A7068; line-height: 1.6; margin-bottom: 24px; }
        .done-close {
          padding: 14px 32px;
          background: #C84B0F;
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .sub-error {
          background: #FEE2E2;
          color: #DC2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-top: 8px;
        }
      `}</style>

      <div className="sub-overlay" onClick={onClose}>
        <div className="sub-box" onClick={e => e.stopPropagation()}>
          {done ? (
            <div className="sub-done">
              <div className="done-icon">🎉</div>
              <div className="done-title">You're on the list, {form.parentName}!</div>
              <div className="done-text">
                We'll reach out to {form.email} shortly to confirm your plan
                and set up delivery for {form.kidName}.
                <br /><br />
                No payment taken yet — we'll walk you through everything.
              </div>
              <button className="done-close" onClick={onClose}>Back to Menu</button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sub-header">
                <button className="sub-close" onClick={onClose}>✕</button>
                <div className="sub-step-label">Step {step} of 4</div>
                <div className="sub-title">
                  {step === 1 && 'What\'s your email?'}
                  {step === 2 && 'Tell us about you & your little one'}
                  {step === 3 && 'Which stage fits your baby?'}
                  {step === 4 && 'Choose your plan frequency'}
                </div>
                <div className="progress-track">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className={`prog-dot ${n <= step ? 'filled' : ''}`} />
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="sub-body">
                {step === 1 && (
                  <>
                    <label className="sub-label">Email address</label>
                    <input
                      className="sub-input"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      autoFocus
                    />
                    <div style={{ fontSize: 12, color: '#A08070' }}>
                      We'll use this to confirm your subscription. No spam, ever.
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <label className="sub-label">Your name</label>
                    <input
                      className="sub-input"
                      type="text"
                      placeholder="e.g. Sara"
                      value={form.parentName}
                      onChange={e => set('parentName', e.target.value)}
                      autoFocus
                    />
                    <label className="sub-label">Your baby's name</label>
                    <input
                      className="sub-input"
                      type="text"
                      placeholder="e.g. Adam"
                      value={form.kidName}
                      onChange={e => set('kidName', e.target.value)}
                    />
                    <label className="sub-label">Baby's birthday <span style={{ fontWeight: 400, color: '#A08070' }}>(optional)</span></label>
                    <input
                      className="sub-input"
                      type="date"
                      value={form.kidBirthday}
                      onChange={e => set('kidBirthday', e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </>
                )}

                {step === 3 && (
                  <div className="stage-cards">
                    {STAGES.map(s => (
                      <div
                        key={s.id}
                        className={`stage-card ${form.stage === s.id ? 'selected' : ''}`}
                        onClick={() => set('stage', s.id)}
                      >
                        <span className="stage-emoji">{s.emoji}</span>
                        <div className="stage-info">
                          <div className="stage-name">{s.name}</div>
                          <div className="stage-sub">{s.subtitle} · {s.desc}</div>
                        </div>
                        {form.stage === s.id && (
                          <div className="stage-check">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <>
                    <div className="cycle-cards">
                      {CYCLES.map(c => {
                        const price = form.stage ? c.prices[form.stage as keyof typeof c.prices] : null
                        return (
                          <div
                            key={c.id}
                            className={`cycle-card ${form.paymentCycle === c.id ? 'selected' : ''}`}
                            onClick={() => set('paymentCycle', c.id)}
                          >
                            {c.badge && <div className="cycle-badge">{c.badge}</div>}
                            <div className="cycle-label-wrap">
                              <div className="cycle-label">{c.label}</div>
                              <div className="cycle-desc">{c.desc}</div>
                            </div>
                            {price && (
                              <div>
                                <div className="cycle-price">{price} SAR</div>
                                <div className="cycle-price-sub">per {c.id === '3months' ? '3 months' : c.id}</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ fontSize: 12, color: '#A08070', marginTop: 8 }}>
                      No payment now — we'll contact you to set up delivery & billing.
                    </div>
                  </>
                )}

                {error && <div className="sub-error">{error}</div>}

                <div className="sub-actions">
                  {step > 1 && (
                    <button className="sub-back" onClick={() => setStep(s => s - 1)}>
                      ← Back
                    </button>
                  )}
                  <button
                    className="sub-next"
                    disabled={!canNext() || loading}
                    onClick={() => {
                      if (step < 4) setStep(s => s + 1)
                      else handleSubmit()
                    }}
                  >
                    {loading ? 'Submitting...' : step === 4 ? 'Submit →' : 'Continue →'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
