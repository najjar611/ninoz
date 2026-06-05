'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SubscribersAdmin() {
  const supabase = createClient()
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('lead_subscribers')
        .select(`
          *,
          subscriber_allergens(allergens(name))
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Subscribers fetch error:', error)
        setError(error.message)
      }
      setSubs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading data...</div>

  if (error) return (
    <div style={{ padding: 40, color: '#DC2626' }}>
      <strong>Error loading subscribers:</strong> {error}
      <br /><small>Check that the authenticated role has SELECT permission on lead_subscribers in Supabase.</small>
    </div>
  )

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>Subscriber Management</h1>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#FAF5EE', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '16px' }}>Name</th>
              <th style={{ padding: '16px' }}>Email</th>
              <th style={{ padding: '16px' }}>Mobile</th>
              <th style={{ padding: '16px' }}>Child</th>
              <th style={{ padding: '16px' }}>Address</th>
              <th style={{ padding: '16px' }}>Allergies</th>
              <th style={{ padding: '16px' }}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ padding: '16px' }}>{s.parent_name || '-'}</td>
                <td style={{ padding: '16px' }}>{s.email || '-'}</td>
                <td style={{ padding: '16px' }}>{s.mobile_number || '-'}</td>
                <td style={{ padding: '16px' }}>{s.child_name || '-'}</td>
                <td style={{ padding: '16px' }}>{s.delivery_address || '-'}</td>
                <td style={{ padding: '16px' }}>
                  {s.subscriber_allergens?.map((a: any) => a.allergens?.name).filter(Boolean).join(', ') || 'None'}
                </td>
                <td style={{ padding: '16px', color: '#7A7068', fontSize: '13px' }}>
                  {new Date(s.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7A7068' }}>
            No subscribers found yet.
          </div>
        )}
      </div>
    </div>
  )
}