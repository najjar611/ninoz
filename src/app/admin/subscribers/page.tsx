'use client'

// ══════════════════════════════════════════════════════════
// /admin/subscribers/page.tsx — v5 (REPLACE existing)
// Shows lead_subscribers from the multi-step popup
// Filter by status, stage, payment cycle
// Export to CSV
// ══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  email: string
  parent_name: string | null
  kid_name: string | null
  kid_birthday: string | null
  stage: string | null
  payment_cycle: string | null
  status: string
  created_at: string
}

const STAGE_LABELS: Record<string, string> = {
  stage1: 'Baby Blends (3–6m)',
  stage2: 'Textured (6–12m)',
  stage3: 'Big Baby (1–3y)',
}

const CYCLE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  '3months': '3 Months',
}

export default function SubscribersAdmin() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'lead' | 'converted' | 'dropped'>('all')

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    const { data } = await supabase
      .from('lead_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('lead_subscribers').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  function exportCSV() {
    const rows = [
      ['Email', 'Parent', 'Kid', 'Birthday', 'Stage', 'Cycle', 'Status', 'Date'],
      ...filtered.map(l => [
        l.email,
        l.parent_name || '',
        l.kid_name || '',
        l.kid_birthday || '',
        STAGE_LABELS[l.stage || ''] || l.stage || '',
        CYCLE_LABELS[l.payment_cycle || ''] || l.payment_cycle || '',
        l.status,
        new Date(l.created_at).toLocaleDateString('en-SA'),
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ninoz-leads-${Date.now()}.csv`
    a.click()
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  const statusColor: Record<string, string> = {
    lead: '#E8834A',
    converted: '#2D6A4F',
    dropped: '#DC2626',
  }

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading subscribers...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>Subscribers</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>
            {leads.length} total · {leads.filter(l => l.status === 'lead').length} pending · {leads.filter(l => l.status === 'converted').length} converted
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={exportCSV}
            style={{ padding: '9px 16px', background: 'white', color: '#2C1A0E', border: '1.5px solid #EDE8E0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'white', padding: 4, borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', width: 'fit-content' }}>
        {(['all', 'lead', 'converted', 'dropped'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: filter === f ? '#1C1C1A' : 'transparent',
              color: filter === f ? 'white' : '#7A7068',
              textTransform: 'capitalize',
            }}
          >
            {f} {f !== 'all' && `(${leads.filter(l => l.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#C9A98A' }}>
          <div style={{ fontSize: 40 }}>📋</div>
          <p style={{ marginTop: 8 }}>No subscribers yet. Share the site to start collecting leads!</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAF5EE', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {['Email', 'Parent', 'Kid', 'Stage', 'Cycle', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#7A7068', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, idx) => (
                <tr
                  key={lead.id}
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: idx % 2 === 0 ? 'white' : '#FDFAF7' }}
                >
                  <td style={{ padding: '12px 16px', color: '#2C1A0E', fontWeight: 600 }}>{lead.email}</td>
                  <td style={{ padding: '12px 16px', color: '#7A7068' }}>{lead.parent_name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#7A7068' }}>
                    {lead.kid_name || '—'}
                    {lead.kid_birthday && (
                      <div style={{ fontSize: 11, color: '#C9A98A' }}>
                        {new Date(lead.kid_birthday).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7A7068' }}>
                    {STAGE_LABELS[lead.stage || ''] || lead.stage || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7A7068' }}>
                    {CYCLE_LABELS[lead.payment_cycle || ''] || lead.payment_cycle || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7A7068', whiteSpace: 'nowrap' }}>
                    {new Date(lead.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: 'none',
                        background: statusColor[lead.status] + '20',
                        color: statusColor[lead.status],
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="lead">Lead</option>
                      <option value="converted">Converted</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
