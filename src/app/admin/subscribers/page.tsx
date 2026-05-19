'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string; email: string; parent_name: string | null; kid_name: string | null
  kid_birthday: string | null; stage: string | null; payment_cycle: string | null
  status: string; created_at: string
}

export default function SubscribersAdmin() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setErr('')
    const { data, error } = await supabase
      .from('lead_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setErr(error.message); setLoading(false); return }
    setLeads(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('lead_subscribers').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  function exportCSV() {
    const rows = [['Email','Parent','Kid','Birthday','Stage','Plan','Status','Date'], ...filtered.map(l => [l.email, l.parent_name||'', l.kid_name||'', l.kid_birthday||'', l.stage||'', l.payment_cycle||'', l.status, new Date(l.created_at).toLocaleDateString()])]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' }))
    a.download = `subscribers-${Date.now()}.csv`
    a.click()
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)
  const counts = { all: leads.length, lead: leads.filter(l=>l.status==='lead').length, converted: leads.filter(l=>l.status==='converted').length, dropped: leads.filter(l=>l.status==='dropped').length }
  const sc: Record<string,{bg:string;color:string}> = { lead:{bg:'#FDF0E8',color:'#C84B0F'}, converted:{bg:'#E8F5EE',color:'#2D6A4F'}, dropped:{bg:'#FEE2E2',color:'#DC2626'} }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:'Nunito,sans-serif', fontSize:22, fontWeight:900, color:'#1C1C1A', marginBottom:4 }}>Subscribers</h1>
          <p style={{ fontSize:13, color:'#7A7068' }}>{leads.length} total</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={load} style={{ padding:'9px 16px', background:'white', border:'1.5px solid #EDE8E0', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 Refresh</button>
          <button onClick={exportCSV} style={{ padding:'9px 16px', background:'white', border:'1.5px solid #EDE8E0', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>📥 Export CSV</button>
        </div>
      </div>

      {err && <div style={{ background:'#FEE2E2', color:'#DC2626', padding:'12px 16px', borderRadius:10, marginBottom:16, fontSize:13 }}>Error: {err}</div>}

      <div style={{ display:'flex', gap:6, marginBottom:20, background:'white', padding:4, borderRadius:10, border:'1px solid rgba(0,0,0,0.06)', width:'fit-content' }}>
        {(['all','lead','converted','dropped'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'7px 16px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600, textTransform:'capitalize', background:filter===f?'#1C1C1A':'transparent', color:filter===f?'white':'#7A7068' }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#C9A98A' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#C9A98A', background:'white', borderRadius:16 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <p style={{ fontSize:15, fontWeight:600 }}>No subscribers found.</p>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:16, border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:650 }}>
            <thead>
              <tr style={{ background:'#FAF5EE', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
                {['Email','Parent','Kid','Stage','Plan','Date','Status'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'#7A7068', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, idx) => (
                <tr key={lead.id} style={{ borderBottom:'1px solid rgba(0,0,0,0.04)', background:idx%2===0?'white':'#FDFAF7' }}>
                  <td style={{ padding:'12px 16px', fontWeight:600, color:'#1C1C1A' }}>{lead.email}</td>
                  <td style={{ padding:'12px 16px', color:'#7A7068' }}>{lead.parent_name||'—'}</td>
                  <td style={{ padding:'12px 16px', color:'#7A7068' }}>
                    {lead.kid_name||'—'}
                    {lead.kid_birthday && <div style={{ fontSize:11, color:'#C9A98A' }}>{new Date(lead.kid_birthday).toLocaleDateString()}</div>}
                  </td>
                  <td style={{ padding:'12px 16px', color:'#7A7068' }}>{lead.stage||'—'}</td>
                  <td style={{ padding:'12px 16px', color:'#7A7068', textTransform:'capitalize' }}>{lead.payment_cycle||'—'}</td>
                  <td style={{ padding:'12px 16px', color:'#7A7068', whiteSpace:'nowrap' }}>{new Date(lead.created_at).toLocaleDateString('en-SA', { day:'numeric', month:'short' })}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                      style={{ padding:'4px 10px', borderRadius:6, border:'none', background:sc[lead.status]?.bg||'#F5F5F5', color:sc[lead.status]?.color||'#333', fontWeight:700, fontSize:11, cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
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
