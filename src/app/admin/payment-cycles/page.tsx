'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Cycle = {
  id: string; label: string; label_ar: string | null
  days: number; meals_total: number; price_sar: number
}

export default function PaymentCyclesAdmin() {
  const supabase = createClient()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('payment_cycles').select('*').order('days')
    setCycles(data || [])
    setLoading(false)
  }

  function update(id: string, key: keyof Cycle, val: any) {
    setCycles(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c))
  }

  async function save(cycle: Cycle) {
    setSaving(cycle.id)
    const { error } = await supabase.from('payment_cycles').update({
      label: cycle.label, label_ar: cycle.label_ar,
      days: cycle.days, meals_total: cycle.meals_total, price_sar: cycle.price_sar,
    }).eq('id', cycle.id)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  async function addCycle() {
    const { data, error } = await supabase.from('payment_cycles').insert({
      label: 'New Plan', label_ar: null, days: 7, meals_total: 21, price_sar: 0,
    }).select().single()
    if (error) { flash('Error: ' + error.message); return }
    if (data) setCycles(prev => [...prev, data])
  }

  async function deleteCycle(id: string) {
    if (!confirm('Delete this plan? Existing subscriptions on it will keep their price but the option will no longer be offered.')) return
    const { error } = await supabase.from('payment_cycles').delete().eq('id', id)
    if (error) { flash('Error: ' + error.message); return }
    setCycles(prev => prev.filter(c => c.id !== id))
    flash('Deleted')
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #EDE8E0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: '12px' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading plans…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Payment Plans</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Manage the subscription plans (Weekly, Monthly, etc.) and their prices.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={addCycle} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Plan
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 20 }}>
        {cycles.map(cycle => (
          <div key={cycle.id} style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="cycle-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Plan Name (English)</label>
                <input style={inp} value={cycle.label} onChange={e => update(cycle.id, 'label', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase', textAlign: 'right' }}>اسم الخطة (عربي)</label>
                <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={cycle.label_ar || ''} onChange={e => update(cycle.id, 'label_ar', e.target.value)} />
              </div>
            </div>

            <div className="cycle-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Days</label>
                <input type="number" min={1} style={inp} value={cycle.days} onChange={e => update(cycle.id, 'days', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Total Meals</label>
                <input type="number" min={1} style={inp} value={cycle.meals_total} onChange={e => update(cycle.id, 'meals_total', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 4, textTransform: 'uppercase' }}>Price (SAR)</label>
                <input type="number" min={0} style={inp} value={cycle.price_sar} onChange={e => update(cycle.id, 'price_sar', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => deleteCycle(cycle.id)}
                style={{ padding: '7px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Delete
              </button>
              <button onClick={() => save(cycle)} disabled={saving === cycle.id}
                style={{ flex: 1, padding: '7px 16px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === cycle.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                {saving === cycle.id ? 'Saving…' : 'Save Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {cycles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 15 }}>No plans yet</div>
          <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Click "+ Add Plan" to create your first payment plan.</div>
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          .cycle-2col, .cycle-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
