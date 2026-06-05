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
        .from('subscribers')
        .select('*, subscriber_allergens(allergens(name))')
        .order('created_at', { ascending: false })
      if (error) { setError(error.message) }
      setSubs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#B0A098', fontFamily: 'Nunito, sans-serif', fontSize: 14 }}>
      Loading subscribers…
    </div>
  )

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 14, padding: '18px 22px', fontSize: 13, lineHeight: 1.7 }}>
        <strong>Cannot load subscribers:</strong> {error}<br />
        Run this in Supabase → SQL Editor:<br />
        <code style={{ display: 'inline-block', marginTop: 8, background: 'rgba(0,0,0,0.06)', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
          GRANT SELECT ON subscribers TO authenticated;
        </code>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>Subscribers</h1>
        <p style={{ fontSize: 13, color: '#7A7068', marginTop: 4 }}>{subs.length} registered {subs.length === 1 ? 'customer' : 'customers'}</p>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #EDEBE8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0EBE5' }}>
                {['Name', 'Email', 'Mobile', 'Child', 'Delivery Address', 'Allergies', 'Registered'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', fontSize: 10.5, fontWeight: 800, color: '#B0A098', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#FAFAF9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < subs.length - 1 ? '1px solid #F9F7F5' : 'none' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1C1C1A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#C84B0F', flexShrink: 0 }}>
                        {(s.parent_name || '?').charAt(0).toUpperCase()}
                      </div>
                      {s.parent_name || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#4A3C34' }}>{s.email || '—'}</td>
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#4A3C34' }}>{s.mobile_number || '—'}</td>
                  <td style={{ padding: '14px 18px', color: '#4A3C34' }}>{s.child_name || '—'}</td>
                  <td style={{ padding: '14px 18px', color: '#7A7068', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.delivery_address || '—'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    {s.subscriber_allergens?.map((a: any) => a.allergens?.name).filter(Boolean).length > 0
                      ? s.subscriber_allergens.map((a: any) => a.allergens?.name).filter(Boolean).map((name: string) => (
                        <span key={name} style={{ display: 'inline-block', background: '#FEF3E2', color: '#B45309', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginRight: 4 }}>{name}</span>
                      ))
                      : <span style={{ color: '#D0C8C0', fontSize: 12 }}>None</span>
                    }
                  </td>
                  <td style={{ padding: '14px 18px', color: '#B0A098', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(s.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {subs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 15 }}>No subscribers yet</div>
              <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Subscribers who complete registration will appear here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
