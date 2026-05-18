'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Cycle = { id: string; name: string; subtitle: string; price: string; position: number; is_active: boolean }

export default function PaymentCyclesPage() {
  const supabase = createClient()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('payment_cycles').select('*').order('position')
    if (data) setCycles(data)
    setLoading(false)
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  async function saveCycle(cycle: Cycle) {
    setSaving(cycle.id)
    await supabase.from('payment_cycles').update({ name: cycle.name, subtitle: cycle.subtitle, price: cycle.price, is_active: cycle.is_active }).eq('id', cycle.id)
    setSaving(null)
    flash('Saved ✓')
  }

  async function addCycle() {
    const { data } = await supabase.from('payment_cycles').insert({ name: 'New Plan', subtitle: 'X days / Y meals total', price: '0 SAR', position: cycles.length + 1 }).select().single()
    if (data) setCycles([...cycles, data])
  }

  async function deleteCycle(id: string) {
    if (!confirm('Delete this cycle?')) return
    await supabase.from('payment_cycles').delete().eq('id', id)
    setCycles(cycles.filter(c => c.id !== id))
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#C9A98A', marginBottom: '4px' }
  const btn = (color: string, small = false) => ({ padding: small ? '5px 10px' : '8px 16px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: small ? '11px' : '12px', fontWeight: 600 as const })

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Payment Cycles</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>Control the subscription options shown during checkout.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>{msg}</div>}
          <button onClick={addCycle} style={btn('#4A7C59')}>+ Add Cycle</button>
        </div>
      </div>
      {cycles.map(cycle => (
        <div key={cycle.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', padding: '18px', marginBottom: '10px', opacity: cycle.is_active ? 1 : 0.6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Plan Name</label>
              <input value={cycle.name} onChange={e => setCycles(cycles.map(c => c.id === cycle.id ? {...c, name: e.target.value} : c))} style={inp} placeholder="e.g. Weekly" />
            </div>
            <div>
              <label style={lbl}>Subtitle</label>
              <input value={cycle.subtitle} onChange={e => setCycles(cycles.map(c => c.id === cycle.id ? {...c, subtitle: e.target.value} : c))} style={inp} placeholder="e.g. 6 days / 18 meals" />
            </div>
            <div>
              <label style={lbl}>Price</label>
              <input value={cycle.price} onChange={e => setCycles(cycles.map(c => c.id === cycle.id ? {...c, price: e.target.value} : c))} style={inp} placeholder="e.g. 377 SAR" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => saveCycle(cycle)} style={btn('#E8834A')}>{saving === cycle.id ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setCycles(cycles.map(c => c.id === cycle.id ? {...c, is_active: !c.is_active} : c))} style={btn(cycle.is_active ? '#4A7C59' : '#C9A98A', true)}>{cycle.is_active ? '👁 Visible' : '🙈 Hidden'}</button>
            <button onClick={() => deleteCycle(cycle.id)} style={btn('#DC2626', true)}>🗑 Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
