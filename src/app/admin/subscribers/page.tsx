'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SubscribersAdmin() {
  const supabase = createClient()
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch subscribers and join the allergen names
      const { data } = await supabase
        .from('lead_subscribers')
        .select(`
          *, 
          subscriber_allergens(allergens(name))
        `)
        .order('created_at', { ascending: false })
      
      setSubs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading data...</div>

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>Subscriber Management</h1>
      
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#FAF5EE', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '16px' }}>Name</th>
              <th style={{ padding: '16px' }}>Mobile</th>
              <th style={{ padding: '16px' }}>Child</th>
              <th style={{ padding: '16px' }}>Address</th>
              <th style={{ padding: '16px' }}>National ID</th>
              <th style={{ padding: '16px' }}>Allergies</th>
              <th style={{ padding: '16px' }}>Plan</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ padding: '16px' }}>{s.full_name}</td>
                <td style={{ padding: '16px' }}>{s.mobile_number}</td>
                <td style={{ padding: '16px' }}>{s.child_name || '-'}</td>
                <td style={{ padding: '16px' }}>{s.delivery_address || '-'}</td>
                <td style={{ padding: '16px' }}>{s.national_id || '-'}</td>
                <td style={{ padding: '16px' }}>
                  {s.subscriber_allergens?.map((a: any) => a.allergens?.name).join(', ') || 'None'}
                </td>
                <td style={{ padding: '16px', textTransform: 'capitalize' }}>{s.plan_cycle || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {subs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7A7068' }}>
          No subscribers found yet.
        </div>
      )}
    </div>
  )
}