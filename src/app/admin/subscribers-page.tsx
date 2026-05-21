'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SubscribersAdmin() {
  const supabase = createClient()
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('subscribers')
      .select(`
        *,
        stages(name),
        payment_cycles(label),
        subscriber_allergens(allergens(name))
      `)
      .order('created_at', { ascending: false })

    if (err) setError(`Error loading subscribers: ${err.message}. ${err.hint || ''}`)
    setSubs(data || [])
    setLoading(false)
  }

  async function setStatus(id: string, status: string) {
    await supabase.from('subscribers').update({ status }).eq('id', id)
    setSubs(subs.map(s => s.id === id ? { ...s, status } : s))
  }

  async function togglePaid(id: string, current: boolean) {
    await supabase.from('subscribers').update({ is_paid: !current }).eq('id', id)
    setSubs(subs.map(s => s.id === id ? { ...s, is_paid: !current } : s))
  }

  const filtered = subs.filter(s =>
    !search || [s.full_name, s.email, s.mobile_number].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  const statusColor: Record<string, string> = { new: '#0A429B', active: '#2D6A4F', cancelled: '#C84B0F', paused: '#7A7068' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading subscribers...</div>

  return (
    <div style={{ padding: '32px', fontFamily: 'sans-serif', background: '#F5F3EE', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1C1C1A', margin: 0 }}>Subscriber Management</h1>
          <input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #E0DCD6', width: '280px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: subs.length, color: '#0A429B' },
            { label: 'Active', value: subs.filter(s => s.status === 'active').length, color: '#2D6A4F' },
            { label: 'New', value: subs.filter(s => s.status === 'new' || !s.status).length, color: '#E8834A' },
            { label: 'Paid', value: subs.filter(s => s.is_paid).length, color: '#7B5EA7' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#7A7068', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#FEE', border: '1px solid #FCC', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', color: '#C84B0F', fontSize: '13px' }}>
            <strong>Error loading subscribers:</strong> {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAF5EE', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allergies</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <React.Fragment key={s.id}>
                  <tr onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    style={{ borderBottom: '1px solid #F5F3EE', cursor: 'pointer', background: expanded === s.id ? '#FAFAF8' : 'white', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1C1C1A' }}>{s.full_name || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', color: '#1C1C1A' }}>{s.mobile_number || '-'}</div>
                      <div style={{ fontSize: '12px', color: '#7A7068' }}>{s.email || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', color: '#1C1C1A' }}>{s.stages?.name || '-'}</div>
                      <div style={{ fontSize: '12px', color: '#7A7068' }}>{s.payment_cycles?.label || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {s.subscriber_allergens?.length > 0
                          ? s.subscriber_allergens.map((a: any, i: number) => (
                              <span key={i} style={{ background: '#FBE8E0', color: '#C84B0F', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '50px' }}>
                                {a.allergens?.name}
                              </span>
                            ))
                          : <span style={{ fontSize: '13px', color: '#C9A98A' }}>None</span>
                        }
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={s.status || 'new'}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); setStatus(s.id, e.target.value) }}
                        style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${statusColor[s.status] || statusColor.new}`, color: statusColor[s.status] || statusColor.new, fontSize: '12px', fontWeight: 700, background: 'white', cursor: 'pointer' }}>
                        <option value="new">New</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); togglePaid(s.id, s.is_paid) }}
                        style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: s.is_paid ? '#2D6A4F' : '#E0DCD6', color: s.is_paid ? 'white' : '#7A7068', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        {s.is_paid ? 'Paid ✓' : 'Unpaid'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7A7068' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                  {expanded === s.id && (
                    <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EDE8' }}>
                      <td colSpan={7} style={{ padding: '0 16px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '12px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C9A98A', textTransform: 'uppercase', marginBottom: '4px' }}>Delivery Address</div>
                            <div style={{ fontSize: '13px', color: '#1C1C1A' }}>{s.delivery_address || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C9A98A', textTransform: 'uppercase', marginBottom: '4px' }}>About Family</div>
                            <div style={{ fontSize: '13px', color: '#1C1C1A' }}>{s.about_family || '—'}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#7A7068', fontSize: '14px' }}>
            {search ? 'No subscribers match your search.' : 'No subscribers yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
