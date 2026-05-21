'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
type Allergen = { id: string; name: string }
type Stage    = { id: string; name: string; age_range: string; image_url: string | null; emoji: string; description: string }
type Cycle    = { id: string; label: string; days: number; meals_total: number; price_sar: number }

type Form = {
  fullName: string; phone: string; email: string; otp: string[]
  childName: string; birthdate: string; gender: 'male' | 'female' | ''
  allergenIds: string[]; allergenNotes: string
  deliveryType: 'home' | 'school' | 'office' | 'other' | ''
  deliveryAddress: string
  stageId: string; paymentCycleId: string
}

const EMPTY: Form = {
  fullName: '', phone: '', email: '', otp: ['', '', '', ''],
  childName: '', birthdate: '', gender: '', allergenIds: [], allergenNotes: '',
  deliveryType: '', deliveryAddress: '',
  stageId: '', paymentCycleId: '',
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = { orange: '#C84B0F', blue: '#0A429B', cream: '#F7F4F0', muted: '#7A7068', dark: '#1C1C1A' }

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.09)', fontSize: '0.97rem',
  fontFamily: 'inherit', background: C.cream, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
}
const lbl: React.CSSProperties = {
  fontSize: '0.75rem', fontWeight: 700, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.055em', marginBottom: 7, display: 'block',
}
const btnMain: React.CSSProperties = {
  width: '100%', padding: '15px', borderRadius: 14, border: 'none',
  background: C.orange, color: 'white', fontSize: '1rem', fontWeight: 800,
  cursor: 'pointer', fontFamily: 'inherit',
}
const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 15 }

const selCard = (sel: boolean): React.CSSProperties => ({
  borderRadius: 14, border: `2px solid ${sel ? C.orange : 'rgba(0,0,0,0.08)'}`,
  background: sel ? 'rgba(200,75,15,0.04)' : 'white',
  padding: '1.1rem 0.85rem', cursor: 'pointer', textAlign: 'center',
  transition: 'all 0.2s', position: 'relative',
  boxShadow: sel ? '0 6px 20px rgba(200,75,15,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
})

// ─── Slide variants ───────────────────────────────────────────────────────────
const slide = {
  enter:  (d: number) => ({ x: d > 0 ?  52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const } },
  exit:   (d: number) => ({ x: d > 0 ? -52 :  52, opacity: 0, transition: { duration: 0.2 } }),
}

// ─── Module-level sub-components (never recreated on re-render) ───────────────
const ProgressBar = ({ step }: { step: number }) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
    {[1,2,3,4,5].map(n => (
      <div key={n} style={{
        height: 5, borderRadius: 4,
        background: n <= step ? C.orange : '#EDE8E0',
        width: n === step ? 26 : 8,
        opacity: n < step ? 0.45 : 1,
        transition: 'all 0.35s ease',
      }} />
    ))}
  </div>
)

const StepHead = ({ tag, title, sub, step }: { tag: string; title: string; sub?: string; step: number }) => (
  <div style={{ textAlign: 'center', marginBottom: 22 }}>
    <ProgressBar step={step} />
    <p style={{ color: C.orange, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{tag}</p>
    <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: C.blue, marginBottom: sub ? 5 : 0, lineHeight: 1.15 }}>{title}</h2>
    {sub && <p style={{ color: C.muted, fontSize: '0.88rem', lineHeight: 1.4 }}>{sub}</p>}
  </div>
)

const SelectTick = () => (
  <div style={{ position: 'absolute', top: 9, right: 9, width: 20, height: 20, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>
  </div>
)

const DELIVERY_TYPES = [
  { id: 'home',   icon: '🏠', label: 'Home'   },
  { id: 'school', icon: '🏫', label: 'School' },
  { id: 'office', icon: '🏢', label: 'Office' },
  { id: 'other',  icon: '📍', label: 'Other'  },
] as const

// ─── Wizard ───────────────────────────────────────────────────────────────────
export default function Wizard({ onClose }: { onClose: () => void }) {
  const [step, setStep]           = useState(1)
  const [dir,  setDir]            = useState(1)
  const [otpSent, setOtpSent]     = useState(false)
  const [done, setDone]           = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState<Form>(EMPTY)
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [stages,   setStages]     = useState<Stage[]>([])
  const [cycles,   setCycles]     = useState<Cycle[]>([])

  const otpRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const [a, s, c] = await Promise.all([
        supabase.from('allergens').select('id, name').eq('is_active', true).order('name'),
        supabase.from('stages').select('id, name, age_range, image_url, emoji, description').order('position'),
        supabase.from('payment_cycles').select('id, label, days, meals_total, price_sar').order('position'),
      ])
      if (a.data) setAllergens(a.data)
      if (s.data) setStages(s.data)
      if (c.data) setCycles(c.data)
    })()
  }, [])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))

  const goNext = () => { setDir(1);  setStep(s => s + 1) }
  const goBack = () => {
    setDir(-1)
    if (step === 1 && otpSent) { setOtpSent(false); return }
    setStep(s => Math.max(s - 1, 1))
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...form.otp]; next[i] = val.slice(-1)
    set('otp', next)
    if (val && i < 3) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !form.otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const submit = async () => {
    setSaving(true)
    try {
      const { data: sub, error } = await supabase.from('subscribers').insert({
        full_name:        form.fullName,
        email:            form.email,
        mobile_number:    form.phone,
        child_name:       form.childName       || null,
        child_birthdate:  form.birthdate       || null,
        child_gender:     form.gender          || null,
        delivery_address: form.deliveryAddress || null,
        delivery_type:    form.deliveryType    || null,
        stage_id:         form.stageId         || null,
        payment_cycle_id: form.paymentCycleId  || null,
        allergen_notes:   form.allergenNotes   || null,
        status:           'new',
      }).select('id').single()

      if (error) { console.error('Submit error:', error); setSaving(false); return }

      if (sub?.id && form.allergenIds.length > 0) {
        await supabase.from('subscriber_allergens').insert(
          form.allergenIds.map(aid => ({ subscriber_id: sub.id, allergen_id: aid }))
        )
      }
      setDone(true)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  // ─── Done screen ──────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,66,155,0.2)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: 'white', borderRadius: 28, padding: '3rem 2.5rem', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(10,66,155,0.16)' }}
      >
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(200,75,15,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span style={{ fontSize: '2.6rem' }}>🎉</span>
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: C.blue, marginBottom: 10 }}>Thank You!</h2>
        <p style={{ color: C.muted, lineHeight: 1.65, marginBottom: 28, fontSize: '0.94rem' }}>
          Thank you for your interest in Ninoz!<br />
          We&apos;ve received your details and will get back to you very soon.
        </p>
        <motion.button onClick={onClose} style={btnMain} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  )

  // ─── Step content as plain JSX (not component functions) ─────────────────
  const stepContent: Record<number, React.ReactNode> = {
    1: (
      <div>
        <StepHead step={step} tag="Step 1 of 5" title="Let's Get Started" sub="We'll send a quick code to verify your number." />
        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={col}>
              <div>
                <label style={lbl}>Your Name</label>
                <input style={inp} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Sara Al-Mansouri" />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ ...inp, width: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, fontWeight: 800, fontSize: '0.9rem' }}>+966</div>
                  <input style={{ ...inp, flex: 1 }} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="5X XXX XXXX" />
                </div>
              </div>
              <div>
                <label style={lbl}>Email Address</label>
                <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
              </div>
              <motion.button
                style={{ ...btnMain, marginTop: 4, opacity: (!form.fullName || !form.phone || !form.email) ? 0.42 : 1 }}
                disabled={!form.fullName || !form.phone || !form.email}
                onClick={() => setOtpSent(true)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >Send Verification Code →</motion.button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p style={{ textAlign: 'center', color: C.muted, marginBottom: 26, fontSize: '0.88rem', lineHeight: 1.5 }}>
                Code sent to <strong style={{ color: C.blue }}>+966 {form.phone}</strong>
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 26 }}>
                {form.otp.map((val, i) => (
                  <div key={i} style={{
                    width: 62, height: 68, borderRadius: 14,
                    border: `2.5px solid ${val ? C.orange : 'rgba(0,0,0,0.11)'}`,
                    background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', transition: 'border-color 0.2s',
                    boxShadow: val ? '0 4px 14px rgba(200,75,15,0.14)' : 'none',
                  }}>
                    {val && <div style={{ width: 13, height: 13, borderRadius: '50%', background: C.dark, pointerEvents: 'none' }} />}
                    <input
                      ref={el => { otpRefs.current[i] = el }}
                      type="tel" inputMode="numeric" maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      autoFocus={i === 0}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'text', fontSize: '1.5rem' }}
                    />
                  </div>
                ))}
              </div>
              <motion.button
                style={{ ...btnMain, opacity: form.otp.join('').length < 4 ? 0.42 : 1 }}
                disabled={form.otp.join('').length < 4}
                onClick={goNext}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >Verify & Continue →</motion.button>
              <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.82rem', color: C.muted }}>
                Didn&apos;t receive it?{' '}
                <button onClick={() => set('otp', ['','','',''])} style={{ background: 'none', border: 'none', color: C.orange, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Resend</button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ),

    2: (
      <div>
        <StepHead step={step} tag="Step 2 of 5" title="About Your Little One" />
        <div style={col}>
          <div>
            <label style={lbl}>Child&apos;s Name</label>
            <input style={inp} value={form.childName} onChange={e => set('childName', e.target.value)} placeholder="e.g. Nora" />
          </div>
          <div>
            <label style={lbl}>Date of Birth</label>
            <input style={{ ...inp, colorScheme: 'light' }} type="date" value={form.birthdate} onChange={e => set('birthdate', e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label style={lbl}>Gender</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['male', 'female'] as const).map(g => (
                <div key={g} onClick={() => set('gender', g)} style={{ ...selCard(form.gender === g), padding: '13px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>{g === 'male' ? '👦' : '👧'}</span>
                  <span style={{ fontWeight: 800, color: form.gender === g ? C.orange : C.dark, fontSize: '0.92rem' }}>{g === 'male' ? 'Boy' : 'Girl'}</span>
                  {form.gender === g && <SelectTick />}
                </div>
              ))}
            </div>
          </div>
          {allergens.length > 0 && (
            <div>
              <label style={lbl}>Allergies (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allergens.map(a => {
                  const sel = form.allergenIds.includes(a.id)
                  return (
                    <div key={a.id}
                      onClick={() => set('allergenIds', sel ? form.allergenIds.filter(id => id !== a.id) : [...form.allergenIds, a.id])}
                      style={{ padding: '8px 15px', borderRadius: 100, border: `1.5px solid ${sel ? C.orange : 'rgba(0,0,0,0.1)'}`, background: sel ? 'rgba(200,75,15,0.06)' : C.cream, color: sel ? C.orange : C.dark, fontWeight: 700, fontSize: '0.87rem', cursor: 'pointer', transition: 'all 0.18s' }}>
                      {sel && <span style={{ marginRight: 4 }}>✓</span>}{a.name}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <label style={lbl}>Any other notes or allergies?</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 76 }} value={form.allergenNotes} onChange={e => set('allergenNotes', e.target.value)} placeholder="e.g. sensitive to citrus, prefers no spice..." />
          </div>
        </div>
      </div>
    ),

    3: (
      <div>
        <StepHead step={step} tag="Step 3 of 5" title="Where Do We Deliver?" sub="Choose your preferred delivery location." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {DELIVERY_TYPES.map(t => (
            <div key={t.id} onClick={() => set('deliveryType', t.id)} style={selCard(form.deliveryType === t.id)}>
              <div style={{ fontSize: '1.7rem', marginBottom: 5 }}>{t.icon}</div>
              <div style={{ fontSize: '0.77rem', fontWeight: 800, color: form.deliveryType === t.id ? C.orange : C.dark }}>{t.label}</div>
              {form.deliveryType === t.id && <SelectTick />}
            </div>
          ))}
        </div>
        <div style={{ background: '#E4DED4', borderRadius: 16, height: 126, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 36px),repeating-linear-gradient(90deg,rgba(0,0,0,0.03) 0,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 36px)' }} />
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 3 }}>📍</div>
            <p style={{ fontSize: '0.73rem', color: C.muted, fontWeight: 600 }}>Google Maps — coming soon</p>
          </div>
        </div>
        <div>
          <label style={lbl}>
            {form.deliveryType === 'school' ? 'School Name & Address' : form.deliveryType === 'office' ? 'Company & Building Address' : 'Full Delivery Address'}
          </label>
          <textarea
            style={{ ...inp, minHeight: 80, resize: 'vertical' }}
            value={form.deliveryAddress}
            onChange={e => set('deliveryAddress', e.target.value)}
            placeholder={
              form.deliveryType === 'school' ? 'School name, street, district, Riyadh' :
              form.deliveryType === 'office' ? 'Company name, building, street, Riyadh' :
              'Building / villa number, street, district, city'
            }
          />
        </div>
      </div>
    ),

    4: (
      <div>
        <StepHead step={step} tag="Step 4 of 5" title="Customize Your Plan" sub="Select the stage that matches your child's age." />
        <div style={{ display: 'grid', gridTemplateColumns: stages.length <= 2 ? '1fr 1fr' : 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {stages.map(s => {
            const sel = form.stageId === s.id
            return (
              <div key={s.id} onClick={() => set('stageId', s.id)} style={{ ...selCard(sel), padding: '1rem 0.8rem' }}>
                {sel && <SelectTick />}
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', marginBottom: 10, background: '#EDE8E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.image_url ? <img src={s.image_url} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>{s.emoji || '🍼'}</span>}
                </div>
                <div style={{ fontWeight: 900, fontSize: '0.88rem', color: sel ? C.orange : C.blue, marginBottom: 3 }}>{s.name}</div>
                <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600 }}>{s.age_range}</div>
              </div>
            )
          })}
          {stages.length === 0 && <p style={{ color: C.muted, fontSize: '0.9rem', gridColumn: '1/-1' }}>Loading stages...</p>}
        </div>
      </div>
    ),

    5: (
      <div>
        <StepHead step={step} tag="Step 5 of 5" title="Choose Your Cycle" sub="Pick a plan that works for your schedule." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {cycles.map(c => {
            const sel = form.paymentCycleId === c.id
            return (
              <div key={c.id} onClick={() => set('paymentCycleId', c.id)} style={{ borderRadius: 16, border: `2px solid ${sel ? C.orange : 'rgba(0,0,0,0.08)'}`, background: sel ? 'rgba(200,75,15,0.03)' : 'white', padding: '1rem 1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', boxShadow: sel ? '0 6px 20px rgba(200,75,15,0.1)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? C.orange : 'rgba(0,0,0,0.18)'}`, background: sel ? C.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.97rem', color: sel ? C.orange : C.blue }}>{c.label}</div>
                    <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2 }}>{c.days} days · {c.meals_total} meals</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: C.blue }}>SAR {c.price_sar}</div>
                  <div style={{ fontSize: '0.68rem', color: C.muted, marginTop: 1 }}>per cycle</div>
                </div>
              </div>
            )
          })}
          {cycles.length === 0 && <p style={{ color: C.muted, fontSize: '0.9rem' }}>Loading plans...</p>}
        </div>
      </div>
    ),

    6: (() => {
      const stage = stages.find(s => s.id === form.stageId)
      const cycle = cycles.find(c => c.id === form.paymentCycleId)
      const allergenNames = allergens.filter(a => form.allergenIds.includes(a.id)).map(a => a.name)
      const Row = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
        <div style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 2 }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 700, color: C.dark, fontSize: '0.9rem', wordBreak: 'break-word' }}>{value}</div>
          </div>
        </div>
      )
      return (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <ProgressBar step={step} />
            <p style={{ color: C.orange, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Almost There</p>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: C.blue, marginBottom: 5 }}>Review Your Order</h2>
            <p style={{ color: C.muted, fontSize: '0.87rem' }}>Looks good? Hit submit and we&apos;ll be in touch.</p>
          </div>
          <div style={{ background: C.cream, borderRadius: 16, padding: '2px 16px 6px' }}>
            <Row icon="👤" label="Parent"   value={`${form.fullName} · +966 ${form.phone}`} />
            <Row icon="📧" label="Email"    value={form.email} />
            <Row icon="👶" label="Child"    value={[form.childName, form.gender === 'male' ? 'Boy' : form.gender === 'female' ? 'Girl' : '', form.birthdate ? `Born ${form.birthdate}` : ''].filter(Boolean).join(' · ') || '—'} />
            {allergenNames.length > 0 && <Row icon="⚠️" label="Allergies" value={allergenNames.join(', ')} />}
            {form.allergenNotes && <Row icon="📝" label="Notes"     value={form.allergenNotes} />}
            <Row icon="📍" label="Delivery" value={[form.deliveryType ? form.deliveryType.charAt(0).toUpperCase() + form.deliveryType.slice(1) : '', form.deliveryAddress].filter(Boolean).join(' · ') || '—'} />
            <Row icon="🍽️" label="Stage"   value={stage ? `${stage.name} (${stage.age_range})` : '—'} />
            <Row icon="📅" label="Plan"     value={cycle ? `${cycle.label} · SAR ${cycle.price_sar}` : '—'} />
          </div>
        </div>
      )
    })(),
  }

  const canAdvance: Record<number, boolean> = {
    1: false,
    2: !!form.childName,
    3: !!form.deliveryType && !!form.deliveryAddress.trim(),
    4: !!form.stageId,
    5: !!form.paymentCycleId,
    6: true,
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,66,155,0.18)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{   scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: 'white', borderRadius: 28, maxWidth: 500, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(10,66,155,0.15)', overflow: 'hidden' }}
      >
        {/* Top bar */}
        <div style={{ padding: '1.3rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button
            onClick={goBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontWeight: 700, fontSize: '0.84rem', padding: '4px 0', visibility: step === 1 && !otpSent ? 'hidden' : 'visible' }}
          >← Back</button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '1.5rem', lineHeight: 1, padding: '0 4px', borderRadius: 8 }}
          >×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem 1.2rem' }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={`${step}-${otpSent}`} custom={dir} variants={slide} initial="enter" animate="center" exit="exit">
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer CTA — steps 2–6 only */}
        {step > 1 && (
          <div style={{ padding: '0.5rem 2rem 1.8rem', flexShrink: 0 }}>
            {step === 6 ? (
              <motion.button
                onClick={submit} disabled={saving}
                style={{ ...btnMain, opacity: saving ? 0.55 : 1 }}
                whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
              >{saving ? 'Submitting...' : 'Submit My Plan →'}</motion.button>
            ) : (
              <motion.button
                onClick={goNext} disabled={!canAdvance[step]}
                style={{ ...btnMain, opacity: canAdvance[step] ? 1 : 0.42 }}
                whileHover={{ scale: canAdvance[step] ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}
              >Continue →</motion.button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
