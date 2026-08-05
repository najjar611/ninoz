'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Row = {
  id: string; parent_name: string | null; kid_name: string | null; email: string | null
  mobile_number: string | null; delivery_address: string | null; out_of_area: boolean | null; created_at: string
}

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: '#E8F5EE', color: '#2D6A4F', label: 'Active' },
  frozen: { bg: '#E0F0FA', color: '#1E6091', label: 'Frozen' },
  pending_payment: { bg: '#FFF8EE', color: '#8A6D3B', label: 'Pending' },
  none: { bg: '#F3F1ED', color: '#9A8F84', label: 'No plan' },
  out_of_area: { bg: '#F3ECFD', color: '#8A3FFC', label: 'Out of area' },
}
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending_payment', label: 'Pending' },
  { key: 'frozen', label: 'Frozen' },
  { key: 'out_of_area', label: 'Out of area' },
  { key: 'none', label: 'No plan' },
]

export default function CustomersList() {
  const supabase = createClient()
  const initialQ = useSearchParams().get('q') || ''
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<Record<string, { status: string; plan: string }>>({})
  const [pendingAddr, setPendingAddr] = useState<Set<string>>(new Set())
  const [ooaPhones, setOoaPhones] = useState<Set<string>>(new Set())
  const [q, setQ] = useState(initialQ)
  const [filter, setFilter] = useState('all')
  const [needsOnly, setNeedsOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: subs }, { data: subscriptions }, { data: acr }, { data: dzr }] = await Promise.all([
        supabase.from('subscribers').select('id, parent_name, kid_name, email, mobile_number, delivery_address, out_of_area, created_at').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('subscriber_id, status, created_at, stages(name), payment_cycles(label)').in('status', ['active', 'frozen', 'pending_payment']).order('created_at', { ascending: false }),
        supabase.from('address_change_requests').select('subscriber_id').eq('status', 'pending'),
        supabase.from('delivery_zone_requests').select('phone'),
      ])
      setOoaPhones(new Set(((dzr as any[]) || []).map(r => (r.phone || '').replace(/\D/g, '')).filter(Boolean)))
      const m: Record<string, { status: string; plan: string }> = {}
      ;((subscriptions as any[]) || []).forEach(s => {
        if (!m[s.subscriber_id]) m[s.subscriber_id] = { status: s.status, plan: [s.stages?.name, s.payment_cycles?.label].filter(Boolean).join(' · ') }
      })
      setMeta(m)
      setPendingAddr(new Set(((acr as any[]) || []).map(r => r.subscriber_id)))
      setRows((subs as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  const isOOA = (r: Row) => !!r.out_of_area || ooaPhones.has((r.mobile_number || '').replace(/\D/g, ''))
  const statusOf = (r: Row) => isOOA(r) ? 'out_of_area' : (meta[r.id]?.status || 'none')
  const requestsOf = (r: Row) => {
    const out: { label: string; bg: string; color: string }[] = []
    if (meta[r.id]?.status === 'pending_payment') out.push({ label: 'Payment', bg: '#FFF8EE', color: '#8A6D3B' })
    if (pendingAddr.has(r.id)) out.push({ label: 'Address', bg: '#E0F0FA', color: '#1E6091' })
    if (isOOA(r)) out.push({ label: 'Out of area', bg: '#F3ECFD', color: '#8A3FFC' })
    return out
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return rows.filter(r => {
      if (t && !((r.parent_name || '').toLowerCase().includes(t) || (r.kid_name || '').toLowerCase().includes(t) || (r.mobile_number || '').includes(t) || (r.email || '').toLowerCase().includes(t))) return false
      if (filter !== 'all' && statusOf(r) !== filter) return false
      if (needsOnly && requestsOf(r).length === 0) return false
      return true
    })
  }, [rows, q, filter, needsOnly, meta, pendingAddr, ooaPhones])

  const stats = useMemo(() => {
    let active = 0, pending = 0, needs = 0
    rows.forEach(r => { const s = statusOf(r); if (s === 'active') active++; if (s === 'pending_payment') pending++; if (requestsOf(r).length) needs++ })
    return { total: rows.length, active, pending, needs }
  }, [rows, meta, pendingAddr, ooaPhones])

  const tile = (n: number | string, label: string, color: string, bg: string) => (
    <div style={{ flex: '1 1 140px', background: '#fff', border: '1px solid #EDEBE8', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, marginBottom: 10 }} />
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{loading ? '—' : n}</div>
      <div style={{ fontSize: 11.5, color: '#7A7068', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>Customers</h1>
        <p style={{ fontSize: 13, color: '#7A7068', marginTop: 4 }}>Everything about your customers — status, plans, and what needs action.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        {tile(stats.total, 'Total', '#1C1C1A', '#F0EBE5')}
        {tile(stats.active, 'Active', '#2D6A4F', '#E8F5EE')}
        {tile(stats.pending, 'Pending', '#8A6D3B', '#FFF8EE')}
        {tile(stats.needs, 'Needs action', '#C84B0F', '#FDF0E8')}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone, email…"
          style={{ flex: '1 1 240px', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #EDE8E0', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#5A5048', cursor: 'pointer', background: needsOnly ? '#FDF0E8' : '#fff', border: `1.5px solid ${needsOnly ? '#F0C9A8' : '#EDE8E0'}`, borderRadius: 10, padding: '9px 13px' }}>
          <input type="checkbox" checked={needsOnly} onChange={e => setNeedsOnly(e.target.checked)} style={{ accentColor: '#C84B0F' }} /> Needs action
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            border: `1.5px solid ${filter === f.key ? '#C84B0F' : '#EDE8E0'}`, background: filter === f.key ? '#C84B0F' : '#fff', color: filter === f.key ? '#fff' : '#7A7068',
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#B0A098' }}>Loading customers…</div> : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #EDEBE8', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Name', 'Mobile', 'Plan', 'Status', 'Requests', 'Registered'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', fontSize: 10.5, fontWeight: 800, color: '#B0A098', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#FAFAF9', borderBottom: '1px solid #F0EBE5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const st = STATUS[statusOf(r)]; const reqs = requestsOf(r)
                  return (
                    <tr key={r.id} onClick={() => { window.location.href = `/admin/customers/${r.id}` }}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F9F7F5' : 'none', cursor: 'pointer', background: reqs.length ? '#FFFDF9' : '#fff' }}>
                      <td style={{ padding: '13px 18px', fontWeight: 700, color: '#1C1C1A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#C84B0F', flexShrink: 0 }}>{(r.parent_name || '?').charAt(0).toUpperCase()}</div>
                          <div>{r.parent_name || '—'}<div style={{ fontSize: 11.5, color: '#B0A098', fontWeight: 400 }}>{r.kid_name || ''}</div></div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', fontFamily: 'monospace', color: '#4A3C34' }}>{r.mobile_number || '—'}</td>
                      <td style={{ padding: '13px 18px', color: '#4A3C34' }}>{meta[r.id]?.plan || '—'}</td>
                      <td style={{ padding: '13px 18px' }}><span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>{st.label}</span></td>
                      <td style={{ padding: '13px 18px' }}>
                        {reqs.length === 0 ? <span style={{ color: '#D0C8C0' }}>—</span> : (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {reqs.map(x => <span key={x.label} style={{ background: x.bg, color: x.color, fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>{x.label}</span>)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '13px 18px', color: '#B0A098', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: '#B0A098' }}>No customers match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
