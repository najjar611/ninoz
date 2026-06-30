'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Faq = { id: string; question: string; answer: string; question_ar: string | null; answer_ar: string | null; position: number; is_active?: boolean }

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
    const { error } = await supabase.from('faqs').update({
      question: faq.question, answer: faq.answer, question_ar: faq.question_ar, answer_ar: faq.answer_ar, is_active: faq.is_active,
    }).eq('id', faq.id)
    setSaving(null)
    if (error) flash('Error: ' + error.message)
    else flash('Saved!')
  }

  async function add() {
    const { data } = await supabase.from('faqs').insert({
      question: 'New question?', answer: '', position: faqs.length + 1, is_active: true,
    }).select().single()
    if (data) setFaqs(prev => [...prev, data])
  }

  async function remove(id: string) {
    if (!confirm('Delete this FAQ?')) return
    await supabase.from('faqs').delete().eq('id', id)
    setFaqs(prev => prev.filter(f => f.id !== id))
    flash('Deleted')
  }

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EDE8E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1C1C1A' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading FAQs…</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>FAQ</h1>
          <p style={{ fontSize: 13, color: '#7A7068' }}>Manage frequently asked questions shown on the homepage.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          <button onClick={add} style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add FAQ
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map((faq, i) => (
          <div key={faq.id} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #EDEBE8', opacity: faq.is_active === false ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#C9A98A', minWidth: 20 }}>#{i + 1}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#5A5048', marginLeft: 'auto' }}>
                <input type="checkbox" checked={faq.is_active !== false} onChange={e => update(faq.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F' }} />
                Active
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Question (English)</label>
                <input style={inp} value={faq.question} onChange={e => update(faq.id, 'question', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'right' }}>السؤال (عربي)</label>
                <input style={{ ...inp, direction: 'rtl', textAlign: 'right' }} value={faq.question_ar || ''} onChange={e => update(faq.id, 'question_ar', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Answer (English)</label>
                <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={faq.answer} onChange={e => update(faq.id, 'answer', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#C9A98A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'right' }}>الإجابة (عربي)</label>
                <textarea style={{ ...inp, height: 80, resize: 'vertical', direction: 'rtl', textAlign: 'right' }} value={faq.answer_ar || ''} onChange={e => update(faq.id, 'answer_ar', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => remove(faq.id)} style={{ padding: '7px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
              <button onClick={() => save(faq)} disabled={saving === faq.id} style={{ padding: '7px 24px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving === faq.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                {saving === faq.id ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ))}

        {faqs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❓</div>
            <div style={{ fontWeight: 700, color: '#5A5048', fontSize: 15 }}>No FAQs yet</div>
            <div style={{ color: '#B0A098', fontSize: 13, marginTop: 4 }}>Click "+ Add FAQ" to create your first question.</div>
          </div>
        )}
      </div>
    </div>
  )
}
