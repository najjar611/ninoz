'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Subscriber = { id: string; parent_name: string | null; kid_name: string | null }
type Status = { subscriber_id: string; status: string }

const STATUSES = [
  { key: 'preparing', label: 'Preparing', emoji: '👩‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery', emoji: '🚴' },
  { key: 'delivered', label: 'Delivered', emoji: '✅' },
]

// Use local calendar date, not toISOString() (which is UTC and can land on
// the wrong day depending on timezone/time of day).
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DeliveryStatusAdmin() {
  const supabase = createClient()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const date = todayISO()

  useEffect(() => { load() }, [])

  async function load() {
    const [subsRes, statusRes] = await Promise.all([
      supabase.from('subscribers').select('id, parent_name, kid_name').order('parent_name'),
      supabase.from('delivery_status').select('subscriber_id, status').eq('menu_date', date),
    ])
    setSubscribers((subsRes.data as any) || [])
    const map: Record<string, string> = {}
    ;((statusRes.data as any as Status[]) || []).forEach(s => { map[s.subscriber_id] = s.status })
    setStatuses(map)
    setLoading(false)
  }

  async function setStatus(subscriberId: string, status: string) {
    setSaving(subscriberId)
    await supabase.from('delivery_status').upsert(
      { subscriber_id: subscriberId, menu_date: date, status, updated_at: new Date().toISOString() },
      { onConflict: 'subscriber_id,menu_date' }
    )
    setStatuses(prev => ({ ...prev, [subscriberId]: status }))
    setSaving(null)
  }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Delivery Status</h1>
        <p style={{ fontSize: 13, color: '#7A7068' }}>Today, {new Date(date).toLocaleDateString()} — set each subscriber's meal status.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {subscribers.map(s => {
          const current = statuses[s.id] || 'preparing'
          return (
            <div key={s.id} style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1C1C1A' }}>{s.parent_name || 'Unnamed'}</div>
                <div style={{ fontSize: 12, color: '#7A7068' }}>{s.kid_name ? `Baby: ${s.kid_name}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUSES.map(st => (
                  <button
                    key={st.key}
                    onClick={() => setStatus(s.id, st.key)}
                    disabled={saving === s.id}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 12, fontWeight: 700,
                      background: current === st.key ? '#C84B0F' : '#F2EDE8',
                      color: current === st.key ? 'white' : '#5A5048',
                      opacity: saving === s.id ? 0.6 : 1,
                    }}
                  >
                    {st.emoji} {st.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {subscribers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#B0A098' }}>No subscribers yet.</div>
      )}
    </div>
  )
}
