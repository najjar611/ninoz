'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WaitlistAdmin() {
  const supabase = createClient()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('waitlist_submissions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) console.error('Waitlist fetch error:', error)
      setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const csvHref = () => {
    const rows = [
      ['#', 'Name', 'Baby Name', 'WhatsApp', "Baby's Age", 'Language', 'Date'],
      ...entries.map((e, i) => [
        i + 1,
        e.parent_name,
        e.baby_name || '',
        e.whatsapp,
        e.baby_age || '',
        e.language === 'ar' ? 'Arabic' : 'English',
        new Date(e.created_at).toLocaleDateString(),
      ]),
    ]
    return 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: '#1C1C1A' }}>Waitlist</h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '4px 0 0' }}>
            {entries.length} {entries.length === 1 ? 'person' : 'people'} signed up
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/waitlist" target="_blank" style={{ padding: '10px 18px', background: '#FAF5EE', color: '#C84B0F', border: '1.5px solid #EDE8E0', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            Preview Page ↗
          </a>
          {entries.length > 0 && (
            <a href={csvHref()} download="waitlist.csv" style={{ padding: '10px 20px', background: '#C84B0F', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Export CSV
            </a>
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#FAF5EE', borderBottom: '1px solid #eee' }}>
              {['#', 'Name', "Baby's Name", 'WhatsApp', "Baby's Age", 'Language', 'Date'].map(h => (
                <th key={h} style={{ padding: '13px 16px', fontSize: 11, fontWeight: 700, color: '#7A7068', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ padding: '14px 16px', color: '#B0A098', fontSize: 12 }}>{i + 1}</td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1C1C1A' }}>{e.parent_name}</td>
                <td style={{ padding: '14px 16px', color: '#4A3C34' }}>{e.baby_name || <span style={{ color: '#C9A98A' }}>—</span>}</td>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13, color: '#2C1A0E' }}>{e.whatsapp}</td>
                <td style={{ padding: '14px 16px', color: '#4A3C34' }}>{e.baby_age || <span style={{ color: '#C9A98A' }}>—</span>}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: e.language === 'ar' ? '#EEF2FF' : '#E8F5EE', color: e.language === 'ar' ? '#3B5BDB' : '#2D6A4F', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {e.language === 'ar' ? 'AR' : 'EN'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: '#7A7068', fontSize: 13, whiteSpace: 'nowrap' }}>
                  {new Date(e.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '52px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <p style={{ color: '#7A7068', fontSize: 14, margin: 0, fontWeight: 600 }}>No signups yet.</p>
            <p style={{ color: '#A0958D', fontSize: 13, margin: '6px 0 0' }}>Share <strong>ninozapp.netlify.app/waitlist</strong> on Instagram to start collecting.</p>
          </div>
        )}
      </div>
    </div>
  )
}
