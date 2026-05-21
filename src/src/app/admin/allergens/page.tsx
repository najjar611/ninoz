'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Allergen = { id: string; name: string; is_active: boolean }

export default function AllergensAdmin() {
  const supabase = createClient()
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [loading, setLoading] = useState(true)
  const [newAllergen, setNewAllergen] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('allergens').select('*').order('name')
    setAllergens(data || [])
    setLoading(false)
  }

  async function addAllergen() {
    if (!newAllergen.trim()) return
    const { data, error } = await supabase.from('allergens').insert({ name: newAllergen }).select().single()
    if (error) { alert('Error: ' + error.message); return }
    setAllergens([...allergens, data].sort((a,b) => a.name.localeCompare(b.name)))
    setNewAllergen('')
  }

  async function toggleAllergen(id: string, currentStatus: boolean) {
    await supabase.from('allergens').update({ is_active: !currentStatus }).eq('id', id)
    setAllergens(allergens.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a))
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h1>Allergen Management</h1>
      <p style={{ marginBottom: '20px', color: '#7A7068' }}>Add items that will appear as selectable options in the registration funnel.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          value={newAllergen} onChange={e => setNewAllergen(e.target.value)} 
          placeholder="New allergen name (e.g. Soy)"
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button onClick={addAllergen} style={{ padding: '10px 20px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {allergens.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
            <span>{a.name}</span>
            <button onClick={() => toggleAllergen(a.id, a.is_active)} style={{ background: a.is_active ? '#2D6A4F' : '#ccc', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              {a.is_active ? 'Active' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}