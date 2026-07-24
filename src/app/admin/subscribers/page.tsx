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

  async function grantExtraPause(subscriberId: string, parentName: string) {
    if (!confirm(`Grant ${parentName || 'this customer'} one more subscription pause?`)) return
    const { data: sub } = await supabase.from('subscriptions').select('id, extra_pauses').eq('subscriber_id', subscriberId).in('status', ['active', 'frozen']).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!sub) { alert('This customer has no active subscription to grant a pause on.'); return }
    const { error } = await supabase.from('subscriptions').update({ extra_pauses: (((sub as any).extra_pauses) || 0) + 1 }).eq('id', (sub as any).id)
    if (error) { alert('Could not grant the pause: ' + error.message + '\n\nMake sure the subscriptions.extra_pauses column exists (see README).'); return }
    alert(`Done — ${parentName || 'the customer'} can now request one more pause.`)
  }

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

      <style>{`
        @media (max-width: 768px) {
          .subs-table-wrap { display: none !important; }
          .subs-card-wrap { display: block !important; }
        }
      `}</style>

      <div className="subs-card-wrap" style={{ display: 'none' }}>
        {subs.map(s => {
          const allergyNames = (s.subscriber_allergens?.map((a: any) => a.allergens?.name).filter(Boolean)) || []
          return (
            <div key={s.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #EDEBE8', padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#C84B0F', flexShrink: 0 }}>
                  {(s.parent_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#1C1C1A', fontSize: 14.5 }}>{s.parent_name || '—'}</div>
                  <div style={{ fontSize: 11.5, color: '#B0A098' }}>{new Date(s.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, fontSize: 13 }}>
                <div style={{ color: '#B0A098', fontWeight: 700 }}>Email</div><div style={{ color: '#4A3C34' }}>{s.email || '—'}</div>
                <div style={{ color: '#B0A098', fontWeight: 700 }}>Mobile</div><div style={{ color: '#4A3C34', fontFamily: 'monospace' }}>{s.mobile_number || '—'}</div>
                <div style={{ color: '#B0A098', fontWeight: 700 }}>Child</div><div style={{ color: '#4A3C34' }}>{s.kid_name || '—'}</div>
                <div style={{ color: '#B0A098', fontWeight: 700 }}>Address</div><div style={{ color: '#7A7068' }}>{s.delivery_address || '—'}</div>
                <div style={{ color: '#B0A098', fontWeight: 700 }}>Allergies</div>
                <div>
                  {allergyNames.length > 0
                    ? allergyNames.map((name: string) => (
                      <span key={name} style={{ display: 'inline-block', background: '#FEF3E2', color: '#B45309', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginRight: 4 }}>{name}</span>
                    ))
                    : <span style={{ color: '#D0C8C0', fontSize: 12 }}>None</span>}
                </div>
              </div>
              <button onClick={() => grantExtraPause(s.id, s.parent_name)} style={{ marginTop: 12, width: '100%', padding: '9px', background: '#FDF0E8', color: '#C84B0F', border: '1.5px solid #F0C9A8', borderRadius: 9, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                ➕ Allow one more pause
              </button>
            </div>
          )
        })}
        {subs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 24px', background: 'white', borderRadius: 14, border: '1px solid #EDEBE8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 15 }}>No subscribers yet</div>
            <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Subscribers who complete registration will appear here.</div>
          </div>
        )}
      </div>

      <div className="subs-table-wrap" style={{ background: 'white', borderRadius: 16, border: '1px solid #EDEBE8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0EBE5' }}>
                {['Name', 'Email', 'Mobile', 'Child', 'Delivery Address', 'Allergies', 'Registered', 'Actions'].map(h => (
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
                  <td style={{ padding: '14px 18px', color: '#4A3C34' }}>{s.kid_name || '—'}</td>
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
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => grantExtraPause(s.id, s.parent_name)} style={{ padding: '7px 12px', background: '#FDF0E8', color: '#C84B0F', border: '1.5px solid #F0C9A8', borderRadius: 8, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ➕ Extra pause
                    </button>
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
