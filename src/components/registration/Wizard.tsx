'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Wizard({ onClose }: { onClose: () => void }) {
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    fullName: '', email: '', phone: '', aboutFamily: '', 
    allergenIds: [] as string[], stageId: '', cycleId: '', address: ''
  })
  const [options, setOptions] = useState<{ allergens: any[]; stages: any[]; cycles: any[] }>({ allergens: [], stages: [], cycles: [] })

  useEffect(() => {
    async function fetchData() {
      const [al, st, cy] = await Promise.all([
        supabase.from('allergens').select('*').eq('is_active', true),
        supabase.from('stages').select('*'),
        supabase.from('payment_cycles').select('*')
      ])
      setOptions({ allergens: al.data || [], stages: st.data || [], cycles: cy.data || [] })
    }
    fetchData()
  }, [])

  const submit = async () => {
    setLoading(true)
    
    // 1. Insert Lead
    const { data: lead, error } = await supabase
      .from('lead_subscribers')
      .insert({
        parent_name: data.fullName,
        email: data.email,
        mobile_number: data.phone,
        about_family: data.aboutFamily,
        delivery_address: data.address,
        stage_id: data.stageId || null,
        payment_cycle_id: data.cycleId || null,
        child_name: data.fullName
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase Error:", error)
      alert(`Submission failed: ${error.message}`)
      setLoading(false)
      return
    }

    // 2. Insert Allergens with Upsert to prevent 409 Conflict
    if (lead && data.allergenIds.length > 0) {
      const allergenRecords = data.allergenIds.map(id => ({ 
        subscriber_id: lead.id, 
        allergen_id: id 
      }));

      await supabase
        .from('subscriber_allergens')
        .insert(allergenRecords);
    }
    
    setStep(6)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 66, 155, 0.4)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#F7F4F0', width: '100%', maxWidth: '500px', borderRadius: '40px', padding: '2.5rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ color: '#0A429B' }}>Let's get started</h2>
            <input placeholder="Full Name" onChange={e => setData({...data, fullName: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #E0DCD6' }} />
            <input placeholder="Email" onChange={e => setData({...data, email: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #E0DCD6' }} />
            <input placeholder="Mobile Number" onChange={e => setData({...data, phone: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #E0DCD6' }} />
            <button onClick={() => setStep(1)} style={{ padding: '1rem', background: '#C84B0F', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 800 }}>Next</button>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea placeholder="About your family..." onChange={e => setData({...data, aboutFamily: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #E0DCD6' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {options.allergens.map((a: any) => (
                <button key={a.id} onClick={() => setData({...data, allergenIds: data.allergenIds.includes(a.id) ? data.allergenIds.filter(i => i !== a.id) : [...data.allergenIds, a.id]})} style={{ padding: '8px', borderRadius: '12px', border: data.allergenIds.includes(a.id) ? '2px solid #C84B0F' : '1px solid #E0DCD6', background: data.allergenIds.includes(a.id) ? '#FBE8E0' : 'white' }}>{a.name}</button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ padding: '1rem', background: '#C84B0F', color: 'white', borderRadius: '16px', border: 'none' }}>Next</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select onChange={e => setData({...data, stageId: e.target.value})} style={{ padding: '1rem', borderRadius: '16px' }}>
              <option value="">Select Stage</option>
              {options.stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input placeholder="Delivery Address" onChange={e => setData({...data, address: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #E0DCD6' }} />
            <button onClick={submit} style={{ padding: '1rem', background: '#C84B0F', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 800 }}>{loading ? 'Submitting...' : 'Complete Registration'}</button>
          </div>
        )}

        {step === 6 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', color: '#C84B0F' }}>✓</div>
            <h2 style={{ color: '#0A429B' }}>Thank You!</h2>
            <button onClick={onClose} style={{ marginTop: '1rem', padding: '1rem 2rem', background: '#0A429B', color: 'white', borderRadius: '12px', border: 'none' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}