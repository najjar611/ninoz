'use client'

// src/app/admin/faq/page.tsx — v6.1
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Faq = { id: string; question: string; answer: string; position: number; is_active: boolean }

export default function FaqAdmin() {
  const supabase = createClient()
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('faqs').select('*').order('position')
    setFaqs(data || [])
    setLoading(false)
  }

  function update(id: string, key: keyof Faq, val: any) {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))
  }

  async function save(faq: Faq) {
    setSaving(faq.id)
    await supabase.from('faqs').update({ question: faq.question, answer: faq.answer, is_active: faq.is_active }).eq('id', faq.id)
    setSaving(null)
    flash('Saved!')
  }

  async function add() {
    const { data } = await supabase.from('faqs').insert({
      question: 'New Question', answer: 'Answer here...', position: faqs.length + 1
    }).select().single()
    if (data) setFaqs(prev => [...prev, data])
  }

  async function remove(id: string) {
    if (!confirm('Delete this FAQ?')) return
    await supabase.from('faqs').delete().eq('id', id)
    setFaqs(prev => prev.filter(f => f.id !== id))
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #EDE8E0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (loading) return <div style={{ padding: 40, color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>FAQ</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Manage frequently asked questions shown on the homepage.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={add} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Question
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map(faq => (
          <div key={faq.id} style={{ background: 'white', borderRadius: 14, padding: '20px', border: '1px solid rgba(0,0,0,0.06)', opacity: faq.is_active ? 1 : 0.6 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Question</label>
              <input style={inp} value={faq.question} onChange={e => update(faq.id, 'question', e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#7A7068', marginBottom: 5, textTransform: 'uppercase' }}>Answer</label>
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={faq.answer} onChange={e => update(faq.id, 'answer', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                <input type="checkbox" checked={faq.is_active} onChange={e => update(faq.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                Active
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => remove(faq.id)} style={{ padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                <button onClick={() => save(faq)} disabled={saving === faq.id} style={{ padding: '6px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === faq.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {saving === faq.id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#C9A98A' }}>
            <div style={{ fontSize: 40 }}>❓</div>
            <p style={{ marginTop: 8, fontSize: 14 }}>No FAQs yet. Add your first question above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
