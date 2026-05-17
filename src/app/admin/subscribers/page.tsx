// ════════════════════════════════════════════════════════════
// ADMIN SUBSCRIBERS PAGE — /admin/subscribers
// View all subscription submissions
// Change status: new → contacted → active → cancelled
// Add notes per subscriber
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Sub = {
  id: string; parent_name: string; phone: string; plan: string
  kid_name: string; allergies: string; address: string
  street_number: string; status: string; notes: string; created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  new: '#E8834A', contacted: '#7B5EA7', active: '#4A7C59', cancelled: '#DC2626'
}

export default function SubscribersPage() {
  const supabase = createClient()
  const [subs, setSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
    if (data) setSubs(data)
    setLoading(false)
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  async function saveNotes(sub: Sub) {
    setSaving(sub.id)
    await supabase.from('subscriptions').update({ notes: sub.notes, status: sub.status }).eq('id', sub.id)
    setSaving(null)
    flash('Saved ✓')
  }

  async function deleteSub(id: string) {
    if (!confirm('Delete this subscriber?')) return
    await supabase.from('subscriptions').delete().eq('id', id)
    setSubs(subs.filter(s => s.id !== id))
    flash('Deleted')
  }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)
  const counts = { all: subs.length, new: subs.filter(s => s.status === 'new').length, contacted: subs.filter(s => s.status === 'contacted').length, active: subs.filter(s => s.status === 'active').length, cancelled: subs.filter(s => s.status === 'cancelled').length }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const btn = (color: string, small = false) => ({ padding: small ? '5px 10px' : '8px 16px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: small ? '11px' : '12px', fontWeight: 600 as const })

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading subscribers...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1A', marginBottom: '4px' }}>Subscribers</h1>
          <p style={{ fontSize: '13px', color: '#7A7068' }}>{subs.length} total submissions</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600,
            background: filter === key ? '#1C1C1A' : 'white',
            color: filter === key ? 'white' : '#7A7068',
          }}>
            {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      {/* Subscriber cards */}
      {filtered.map(sub => (
        <div key={sub.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '10px', overflow: 'hidden' }}>
          {/* Header */}
          <div onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFF0EA', color: '#E8834A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
              {sub.parent_name?.slice(0, 1) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1C1C1A' }}>{sub.parent_name || 'Unknown'}</div>
              <div style={{ fontSize: '12px', color: '#7A7068' }}>{sub.phone} · {sub.plan}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: `${STATUS_COLORS[sub.status]}18`, color: STATUS_COLORS[sub.status], fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '50px' }}>
                {sub.status}
              </span>
              <div style={{ fontSize: '11px', color: '#C9A98A' }}>{new Date(sub.created_at).toLocaleDateString()}</div>
              <div style={{ color: '#C9A98A' }}>{expanded === sub.id ? '▲' : '▼'}</div>
            </div>
          </div>

          {/* Expanded details */}
          {expanded === sub.id && (
            <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: "Kid's Name", value: sub.kid_name },
                  { label: 'Plan', value: sub.plan },
                  { label: 'Phone', value: sub.phone },
                  { label: 'Address', value: sub.address },
                  { label: 'Street Number', value: sub.street_number },
                  { label: 'Allergies', value: sub.allergies || 'None' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#FAFAF8', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#C9A98A', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                    <div style={{ fontSize: '13px', color: '#1C1C1A', fontWeight: 500 }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#C9A98A', marginBottom: '6px' }}>STATUS</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['new','contacted','active','cancelled'].map(s => (
                    <button key={s} onClick={() => setSubs(subs.map(x => x.id === sub.id ? { ...x, status: s } : x))} style={{
                      padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 600,
                      background: sub.status === s ? STATUS_COLORS[s] : `${STATUS_COLORS[s]}18`,
                      color: sub.status === s ? 'white' : STATUS_COLORS[s],
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#C9A98A', marginBottom: '6px' }}>NOTES</div>
                <textarea value={sub.notes || ''} onChange={e => setSubs(subs.map(x => x.id === sub.id ? { ...x, notes: e.target.value } : x))}
                  rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Add notes about this subscriber..." />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => saveNotes(sub)} style={btn('#E8834A')}>{saving === sub.id ? 'Saving...' : 'Save'}</button>
                <a href={`https://wa.me/${sub.phone}`} target="_blank" style={{ ...btn('#25B560'), textDecoration: 'none' }}>💬 WhatsApp</a>
                <button onClick={() => deleteSub(sub.id)} style={btn('#DC2626', true)}>🗑 Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#C9A98A', background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)', fontSize: '14px' }}>
          No subscribers yet.
        </div>
      )}
    </div>
  )
}
