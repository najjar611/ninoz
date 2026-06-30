'use client'

import { Fragment, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Promo = { id: string; code: string; discount_percent: number; is_active: boolean; created_at: string; max_uses: number | null }
type Redeemer = { parent_name: string | null; kid_name: string | null }

export default function PromoCodesAdmin() {
  const supabase = createClient()
  const [promos, setPromos] = useState<Promo[]>([])
  const [usage, setUsage] = useState<Record<string, number>>({})
  const [redeemers, setRedeemers] = useState<Record<string, Redeemer[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState(10)
  const [maxUses, setMaxUses] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
    const codes = (data || []).map((p: Promo) => p.code)
    if (codes.length > 0) {
      const { data: subs } = await supabase.from('subscriptions').select('promo_code, subscribers(parent_name, kid_name)').in('promo_code', codes)
      const counts: Record<string, number> = {}
      const names: Record<string, Redeemer[]> = {}
      ;((subs as any) || []).forEach((s: any) => {
        const key = (s.promo_code || '').toUpperCase()
        counts[key] = (counts[key] || 0) + 1
        if (!names[key]) names[key] = []
        if (s.subscribers) names[key].push(s.subscribers)
      })
      setUsage(counts)
      setRedeemers(names)
    }
  }

  async function addPromo() {
    if (!code.trim() || percent <= 0 || percent > 100) { setMsg('Enter a code and a percentage between 1-100'); return }
    setSaving(true)
    setMsg('')
    const { error } = await supabase.from('promo_codes').insert({
      code: code.trim().toUpperCase(), discount_percent: percent, max_uses: maxUses.trim() ? Number(maxUses) : null,
    })
    setSaving(false)
    if (error) { setMsg('Error: ' + error.message); return }
    setCode(''); setPercent(10); setMaxUses('')
    load()
  }

  async function toggleActive(p: Promo) {
    await supabase.from('promo_codes').update({ is_active: !p.is_active }).eq('id', p.id)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this promo code?')) return
    await supabase.from('promo_codes').delete().eq('id', id)
    load()
  }

  const inp: React.CSSProperties = { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 14, fontFamily: 'inherit' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 6 }}>Promo Codes</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>Codes customers can apply at checkout for a percentage discount.</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input style={{ ...inp, width: 180, maxWidth: '100%' }} placeholder="CODE" value={code} onChange={e => setCode(e.target.value)} />
        <input style={{ ...inp, width: 90 }} type="number" min={1} max={100} value={percent} onChange={e => setPercent(Number(e.target.value))} />
        <span style={{ fontSize: 13, color: '#7A7068' }}>% off</span>
        <input style={{ ...inp, width: 110 }} type="number" min={1} placeholder="Max uses" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
        <button onClick={addPromo} disabled={saving} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Adding…' : 'Add Code'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#B0A098', marginBottom: 14, marginTop: -4 }}>Leave "Max uses" blank for unlimited.</p>
      {msg && <div style={{ fontSize: 12.5, color: msg.startsWith('Error') ? '#DC2626' : '#7A7068', marginBottom: 14 }}>{msg}</div>}

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
      <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #EDE8E0' }}>
        <thead>
          <tr style={{ background: '#FAF7F4' }}>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11.5, color: '#7A7068', fontWeight: 800 }}>CODE</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11.5, color: '#7A7068', fontWeight: 800 }}>DISCOUNT</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11.5, color: '#7A7068', fontWeight: 800 }}>USES</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11.5, color: '#7A7068', fontWeight: 800 }}>STATUS</th>
            <th style={{ padding: '10px 14px' }}></th>
          </tr>
        </thead>
        <tbody>
          {promos.map(p => {
            const used = usage[p.code.toUpperCase()] || 0
            const names = redeemers[p.code.toUpperCase()] || []
            return (
              <Fragment key={p.id}>
                <tr style={{ borderTop: '1px solid #F2EDE8' }}>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1C1C1A' }}>{p.code}</td>
                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#C84B0F', fontWeight: 700 }}>{p.discount_percent}%</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#1C1C1A' }}>
                    <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} disabled={names.length === 0} style={{ background: 'none', border: 'none', cursor: names.length ? 'pointer' : 'default', fontFamily: 'inherit', fontWeight: 700, color: '#1C1C1A', textDecoration: names.length ? 'underline' : 'none', padding: 0, fontSize: 13 }}>
                      {used}{p.max_uses != null ? ` / ${p.max_uses}` : ''}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => toggleActive(p)} style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: p.is_active ? '#E8F5EE' : '#F2EDE8', color: p.is_active ? '#2D6A4F' : '#7A7068',
                    }}>{p.is_active ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Delete</button>
                  </td>
                </tr>
                {expanded === p.id && names.length > 0 && (
                  <tr style={{ borderTop: '1px solid #F2EDE8' }}>
                    <td colSpan={5} style={{ padding: '8px 14px 14px', background: '#FAF7F4' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#7A7068', marginBottom: 6 }}>USED BY</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {names.map((r, i) => (
                          <div key={i} style={{ fontSize: 13, color: '#1C1C1A' }}>{r.parent_name || 'Unknown'} — {r.kid_name || 'baby'}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {promos.length === 0 && (
            <tr><td colSpan={5} style={{ padding: '20px 14px', fontSize: 13, color: '#B0A098', textAlign: 'center' }}>No promo codes yet.</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}
