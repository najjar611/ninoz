// ADMIN CONTENT PAGE
// Edit FAQ, testimonials, and blog posts
// Changes save to Supabase instantly

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'faq' | 'testimonials' | 'blog'
type FaqItem = { id: string; question: string; answer: string; is_active: boolean }
type Testimonial = { id: string; name: string; location: string; review: string; is_active: boolean }
type BlogPost = { id: string; tag: string; title: string; excerpt: string; is_published: boolean }

export default function ContentPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('faq')
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [f, t, b] = await Promise.all([
      supabase.from('faq_items').select('*').order('position'),
      supabase.from('testimonials').select('*').order('position'),
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
    ])
    if (f.data) setFaqs(f.data)
    if (t.data) setTestimonials(t.data)
    if (b.data) setBlogs(b.data)
    setLoading(false)
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  async function saveFaq(faq: FaqItem) {
    await supabase.from('faq_items').update({ question: faq.question, answer: faq.answer, is_active: faq.is_active }).eq('id', faq.id)
    flash('Saved ✓')
  }

  async function addFaq() {
    const { data } = await supabase.from('faq_items').insert({ question: 'New question', answer: 'Answer here', position: faqs.length + 1 }).select().single()
    if (data) setFaqs([...faqs, data])
  }

  async function deleteFaq(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('faq_items').delete().eq('id', id)
    setFaqs(faqs.filter(f => f.id !== id))
  }

  async function saveTestimonial(t: Testimonial) {
    await supabase.from('testimonials').update({ name: t.name, location: t.location, review: t.review, is_active: t.is_active }).eq('id', t.id)
    flash('Saved ✓')
  }

  async function addTestimonial() {
    const { data } = await supabase.from('testimonials').insert({ name: 'Customer Name', location: 'Riyadh', review: 'Great service!', rating: 5, avatar_text: 'NA', avatar_bg: '#FFDDD2', avatar_color: '#993D20', position: testimonials.length + 1 }).select().single()
    if (data) setTestimonials([...testimonials, data])
  }

  async function deleteTestimonial(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('testimonials').delete().eq('id', id)
    setTestimonials(testimonials.filter(t => t.id !== id))
  }

  async function saveBlog(b: BlogPost) {
    await supabase.from('blog_posts').update({ tag: b.tag, title: b.title, excerpt: b.excerpt, is_published: b.is_published }).eq('id', b.id)
    flash('Saved ✓')
  }

  async function addBlog() {
    const { data } = await supabase.from('blog_posts').insert({ tag: 'Nutrition', title: 'New Post', excerpt: 'Excerpt here', is_published: false }).select().single()
    if (data) setBlogs([data, ...blogs])
  }

  async function deleteBlog(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    setBlogs(blogs.filter(b => b.id !== id))
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8D5C4', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const btnStyle = (color: string) => ({ padding: '7px 14px', borderRadius: '7px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 as const })

  if (loading) return <div style={{ padding: '40px', color: '#7A7068' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Content Manager</h1>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '4px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '24px', width: 'fit-content' }}>
        {(['faq', 'testimonials', 'blog'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: tab === t ? '#1C1C1A' : 'transparent', color: tab === t ? 'white' : '#7A7068' }}>
            {t === 'faq' ? 'FAQ' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* FAQ */}
      {tab === 'faq' && (
        <div>
          <button onClick={addFaq} style={btnStyle('#E8834A')}>+ Add Question</button>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map(faq => (
              <div key={faq.id} style={{ background: 'white', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <input value={faq.question} onChange={e => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, question: e.target.value } : f))}
                  style={{ ...inputStyle, fontWeight: 500, marginBottom: '8px' }} placeholder="Question" />
                <textarea value={faq.answer} onChange={e => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, answer: e.target.value } : f))}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }} rows={2} placeholder="Answer" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveFaq(faq)} style={btnStyle('#E8834A')}>Save</button>
                  <button onClick={() => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f))}
                    style={btnStyle(faq.is_active ? '#4A7C59' : '#C9A98A')}>{faq.is_active ? 'Visible' : 'Hidden'}</button>
                  <button onClick={() => deleteFaq(faq.id)} style={btnStyle('#DC2626')}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {tab === 'testimonials' && (
        <div>
          <button onClick={addTestimonial} style={btnStyle('#E8834A')}>+ Add Review</button>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {testimonials.map(t => (
              <div key={t.id} style={{ background: 'white', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input value={t.name} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} style={inputStyle} placeholder="Name" />
                  <input value={t.location} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, location: e.target.value } : x))} style={inputStyle} placeholder="Location" />
                </div>
                <textarea value={t.review} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, review: e.target.value } : x))}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }} rows={2} placeholder="Review" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveTestimonial(t)} style={btnStyle('#E8834A')}>Save</button>
                  <button onClick={() => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x))}
                    style={btnStyle(t.is_active ? '#4A7C59' : '#C9A98A')}>{t.is_active ? 'Visible' : 'Hidden'}</button>
                  <button onClick={() => deleteTestimonial(t.id)} style={btnStyle('#DC2626')}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blog */}
      {tab === 'blog' && (
        <div>
          <button onClick={addBlog} style={btnStyle('#E8834A')}>+ Add Post</button>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {blogs.map(b => (
              <div key={b.id} style={{ background: 'white', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input value={b.tag} onChange={e => setBlogs(blogs.map(x => x.id === b.id ? { ...x, tag: e.target.value } : x))} style={inputStyle} placeholder="Tag" />
                  <input value={b.title} onChange={e => setBlogs(blogs.map(x => x.id === b.id ? { ...x, title: e.target.value } : x))} style={{ ...inputStyle, fontWeight: 500 }} placeholder="Title" />
                </div>
                <textarea value={b.excerpt} onChange={e => setBlogs(blogs.map(x => x.id === b.id ? { ...x, excerpt: e.target.value } : x))}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }} rows={2} placeholder="Excerpt" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveBlog(b)} style={btnStyle('#E8834A')}>Save</button>
                  <button onClick={() => setBlogs(blogs.map(x => x.id === b.id ? { ...x, is_published: !x.is_published } : x))}
                    style={btnStyle(b.is_published ? '#4A7C59' : '#C9A98A')}>{b.is_published ? 'Published' : 'Draft'}</button>
                  <button onClick={() => deleteBlog(b.id)} style={btnStyle('#DC2626')}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
