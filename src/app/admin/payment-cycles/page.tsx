'use client'

// src/app/admin/payment-cycles/page.tsx — v6
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Cycle = { id: string; label: string; days: number; meals_total: number; price_sar: number; is_active: boolean; position: number }

export default function PaymentCyclesAdmin() {
  const supabase = createClient()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('payment_cycles').select('*').order('position')
    setCycles(data || [])
    setLoading(false)
  }

  function update(id: string, key: keyof Cycle, val: any) {
    setCycles(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c))
  }

  async function save(cycle: Cycle) {
    setSaving(cycle.id)
    const { error } = await supabase.from('payment_cycles').update({
      label: cycle.label, days: cycle.days, meals_total: cycle.meals_total,
      price_sar: cycle.price_sar, is_active: cycle.is_active,
    }).eq('id', cycle.id)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  async function addCycle() {
    const { data } = await supabase.from('payment_cycles').insert({
      label: 'New Cycle', days: 7, meals_total: 21, price_sar: 0, position: cycles.length + 1,
    }).select().single()
    if (data) setCycles(prev => [...prev, data])
  }

  async function deleteCycle(id: string) {
    if (!confirm('Delete this cycle?')) return
    await supabase.from('payment_cycles').delete().eq('id', id)
    setCycles(prev => prev.filter(c => c.id !== id))
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #EDE8E0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Payment Cycles</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>These appear in the subscription popup Step 4. Edit prices, labels and meal counts.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={addCycle} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Cycle
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cycles.map(cycle => (
          <div key={cycle.id} style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(0,0,0,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end', opacity: cycle.is_active ? 1 : 0.6 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Label</label>
              <input style={inp} value={cycle.label} onChange={e => update(cycle.id, 'label', e.target.value)} placeholder="e.g. Weekly" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Days</label>
              <input style={inp} type="number" value={cycle.days} onChange={e => update(cycle.id, 'days', parseInt(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Total Meals</label>
              <input style={inp} type="number" value={cycle.meals_total} onChange={e => update(cycle.id, 'meals_total', parseInt(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Price (SAR)</label>
              <input style={inp} type="number" value={cycle.price_sar} onChange={e => update(cycle.id, 'price_sar', parseInt(e.target.value))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#2C1A0E', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={cycle.is_active} onChange={e => update(cycle.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                Active
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => deleteCycle(cycle.id)}
                  style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                <button onClick={() => save(cycle)} disabled={saving === cycle.id}
                  style={{ padding: '6px 14px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: saving === cycle.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {saving === cycle.id ? '...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cycles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#C9A98A' }}>
          <div style={{ fontSize: 40 }}>💳</div>
          <p style={{ marginTop: 8, fontSize: 14 }}>No payment cycles yet. Add your first one above.</p>
        </div>
      )}
    </div>
  )
}
