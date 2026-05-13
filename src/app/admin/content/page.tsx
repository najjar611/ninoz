// ════════════════════════════════════════════════════════════
// ADMIN CONTENT PAGE
// Edit all website text from one place:
//   - Hero headlines and description
//   - Stats bar numbers
//   - Section titles
//   - How It Works steps
//   - Why Ninoz points
//   - FAQ, Testimonials, Blog posts
// Changes reflect on website immediately
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'text' | 'steps' | 'why' | 'faq' | 'testimonials' | 'blog'
type ContentItem = { key: string; value: string; label: string; section: string }
type Step = { id: string; number: string; icon: string; title: string; description: string; position: number }
type WhyPoint = { id: string; icon: string; icon_bg: string; title: string; description: string; position: number }
type FaqItem = { id: string; question: string; answer: string; is_active: boolean }
type Testimonial = { id: string; name: string; location: string; review: string; is_active: boolean; avatar_text: string }
type BlogPost = { id: string; tag: string; title: string; excerpt: string; is_published: boolean }

export default function ContentPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('text')
  const [content, setContent] = useState<ContentItem[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [whyPoints, setWhyPoints] = useState<WhyPoint[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [c, s, w, f, t, b] = await Promise.all([
      supabase.from('site_content').select('*').order('section'),
      supabase.from('how_steps').select('*').order('position'),
      supabase.from('why_points').select('*').order('position'),
      supabase.from('faq_items').select('*').order('position'),
      supabase.from('testimonials').select('*').order('position'),
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
    ])
    if (c.data) setContent(c.data)
    if (s.data) setSteps(s.data)
    if (w.data) setWhyPoints(w.data)
    if (f.data) setFaqs(f.data)
    if (t.data) setTestimonials(t.data)
    if (b.data) setBlogs(b.data)
    setLoading(false)
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  // ── SAVE SITE CONTENT ──
  async function saveContent(key: string, value: string) {
    setSaving(key)
    await supabase.from('site_content').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
    setSaving(null)
    flash('Saved ✓')
  }

  // ── SAVE STEP ──
  async function saveStep(step: Step) {
    setSaving(step.id)
    await supabase.from('how_steps').update({ icon: step.icon, title: step.title, description: step.description }).eq('id', step.id)
    setSaving(null)
    flash('Saved ✓')
  }

  // ── SAVE WHY POINT ──
  async function saveWhy(point: WhyPoint) {
    setSaving(point.id)
    await supabase.from('why_points').update({ icon: point.icon, icon_bg: point.icon_bg, title: point.title, description: point.description }).eq('id', point.id)
    setSaving(null)
    flash('Saved ✓')
  }

  // ── FAQ ──
  async function saveFaq(faq: FaqItem) {
    setSaving(faq.id)
    await supabase.from('faq_items').update({ question: faq.question, answer: faq.answer, is_active: faq.is_active }).eq('id', faq.id)
    setSaving(null)
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

  // ── TESTIMONIALS ──
  async function saveTestimonial(t: Testimonial) {
    setSaving(t.id)
    await supabase.from('testimonials').update({ name: t.name, location: t.location, review: t.review, avatar_text: t.avatar_text, is_active: t.is_active }).eq('id', t.id)
    setSaving(null)
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

  // ── BLOG ──
  async function saveBlog(b: BlogPost) {
    setSaving(b.id)
    await supabase.from('blog_posts').update({ tag: b.tag, title: b.title, excerpt: b.excerpt, is_published: b.is_published }).eq('id', b.id)
    setSaving(null)
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

  const inp = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E8D5C4', fontSize:'13px', outline:'none', boxSizing:'border-box' as const }
  const btn = (color: string) => ({ padding:'7px 14px', borderRadius:'7px', border:'none', background:color, color:'white', cursor:'pointer', fontSize:'12px', fontWeight:600 as const, display:'flex', alignItems:'center', gap:'4px' })
  const card = { background:'white', borderRadius:'12px', padding:'18px', border:'1px solid rgba(0,0,0,0.05)', marginBottom:'10px' }

  // Group content by section
  const sections = content.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, ContentItem[]>)

  const sectionLabels: Record<string, string> = {
    hero: '🏠 Hero Section',
    stats: '📊 Stats Bar',
    offers: '🥄 Plans Section',
    how: '📋 How It Works',
    why: '✅ Why Ninoz',
    testimonials: '⭐ Testimonials',
    blog: '📰 Blog',
    faq: '❓ FAQ',
    contact: '📞 Contact',
    footer: '🔗 Footer',
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'text',         label: '📝 Text' },
    { id: 'steps',        label: '📋 Steps' },
    { id: 'why',          label: '✅ Why' },
    { id: 'faq',          label: '❓ FAQ' },
    { id: 'testimonials', label: '⭐ Reviews' },
    { id: 'blog',         label: '📰 Blog' },
  ]

  if (loading) return <div style={{ padding:'40px', color:'#7A7068' }}>Loading...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:'#1C1C1A', marginBottom:'4px' }}>Content Manager</h1>
          <p style={{ fontSize:'13px', color:'#7A7068' }}>Edit all website text. Changes appear on the site immediately.</p>
        </div>
        {msg && <div style={{ background:'#E8F5EE', color:'#2D6A4F', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500 }}>{msg}</div>}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', background:'white', padding:'4px', borderRadius:'10px', border:'1px solid rgba(0,0,0,0.06)', marginBottom:'20px', flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'7px 14px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:500, background: tab === t.id ? '#1C1C1A' : 'transparent', color: tab === t.id ? 'white' : '#7A7068' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TEXT TAB ── */}
      {tab === 'text' && (
        <div>
          {Object.entries(sections).map(([section, items]) => (
            <div key={section} style={{ marginBottom:'24px' }}>
              <div style={{ fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'#C9A98A', marginBottom:'10px' }}>
                {sectionLabels[section] || section}
              </div>
              {items.map(item => (
                <div key={item.key} style={card}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#1C1C1A', marginBottom:'6px' }}>{item.label}</label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {item.value.length > 80
                      ? <textarea
                          value={item.value}
                          onChange={e => setContent(content.map(c => c.key === item.key ? { ...c, value: e.target.value } : c))}
                          rows={3}
                          style={{ ...inp, resize:'vertical', flex:1 }}
                        />
                      : <input
                          value={item.value}
                          onChange={e => setContent(content.map(c => c.key === item.key ? { ...c, value: e.target.value } : c))}
                          style={{ ...inp, flex:1 }}
                        />
                    }
                    <button onClick={() => saveContent(item.key, item.value)} style={btn('#E8834A')}>
                      {saving === item.key ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── STEPS TAB ── */}
      {tab === 'steps' && (
        <div>
          <p style={{ fontSize:'13px', color:'#7A7068', marginBottom:'16px' }}>Edit the 3 "How It Works" steps shown in the dark section.</p>
          {steps.map(step => (
            <div key={step.id} style={card}>
              <div style={{ display:'grid', gridTemplateColumns:'60px 1fr', gap:'10px', marginBottom:'10px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Icon</label>
                  <input value={step.icon} onChange={e => setSteps(steps.map(s => s.id === step.id ? { ...s, icon: e.target.value } : s))} style={{ ...inp, textAlign:'center', fontSize:'20px' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Title</label>
                  <input value={step.title} onChange={e => setSteps(steps.map(s => s.id === step.id ? { ...s, title: e.target.value } : s))} style={inp} />
                </div>
              </div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Description</label>
              <textarea value={step.description} onChange={e => setSteps(steps.map(s => s.id === step.id ? { ...s, description: e.target.value } : s))} rows={2} style={{ ...inp, resize:'vertical', marginBottom:'10px' }} />
              <button onClick={() => saveStep(step)} style={btn('#E8834A')}>{saving === step.id ? 'Saving...' : 'Save Step'}</button>
            </div>
          ))}
        </div>
      )}

      {/* ── WHY TAB ── */}
      {tab === 'why' && (
        <div>
          <p style={{ fontSize:'13px', color:'#7A7068', marginBottom:'16px' }}>Edit the "Why Ninoz" key points. Change icon, background color, title and description.</p>
          {whyPoints.map(point => (
            <div key={point.id} style={card}>
              <div style={{ display:'grid', gridTemplateColumns:'60px 80px 1fr', gap:'10px', marginBottom:'10px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Icon</label>
                  <input value={point.icon} onChange={e => setWhyPoints(whyPoints.map(w => w.id === point.id ? { ...w, icon: e.target.value } : w))} style={{ ...inp, textAlign:'center', fontSize:'20px' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>BG Color</label>
                  <input type="color" value={point.icon_bg} onChange={e => setWhyPoints(whyPoints.map(w => w.id === point.id ? { ...w, icon_bg: e.target.value } : w))} style={{ width:'100%', height:'36px', borderRadius:'8px', border:'1px solid #E8D5C4', cursor:'pointer' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Title</label>
                  <input value={point.title} onChange={e => setWhyPoints(whyPoints.map(w => w.id === point.id ? { ...w, title: e.target.value } : w))} style={inp} />
                </div>
              </div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Description</label>
              <textarea value={point.description} onChange={e => setWhyPoints(whyPoints.map(w => w.id === point.id ? { ...w, description: e.target.value } : w))} rows={2} style={{ ...inp, resize:'vertical', marginBottom:'10px' }} />
              <button onClick={() => saveWhy(point)} style={btn('#E8834A')}>{saving === point.id ? 'Saving...' : 'Save'}</button>
            </div>
          ))}
        </div>
      )}

      {/* ── FAQ TAB ── */}
      {tab === 'faq' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'12px' }}>
            <button onClick={addFaq} style={btn('#E8834A')}>+ Add Question</button>
          </div>
          {faqs.map(faq => (
            <div key={faq.id} style={card}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Question</label>
              <input value={faq.question} onChange={e => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, question: e.target.value } : f))} style={{ ...inp, fontWeight:500, marginBottom:'8px' }} />
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Answer</label>
              <textarea value={faq.answer} onChange={e => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, answer: e.target.value } : f))} rows={2} style={{ ...inp, resize:'vertical', marginBottom:'10px' }} />
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => saveFaq(faq)} style={btn('#E8834A')}>{saving === faq.id ? '...' : 'Save'}</button>
                <button onClick={() => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f))} style={btn(faq.is_active ? '#4A7C59' : '#C9A98A')}>{faq.is_active ? '👁 Visible' : '🙈 Hidden'}</button>
                <button onClick={() => deleteFaq(faq.id)} style={btn('#DC2626')}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TESTIMONIALS TAB ── */}
      {tab === 'testimonials' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'12px' }}>
            <button onClick={addTestimonial} style={btn('#E8834A')}>+ Add Review</button>
          </div>
          {testimonials.map(t => (
            <div key={t.id} style={card}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:'8px', marginBottom:'8px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Name</label>
                  <input value={t.name} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Location</label>
                  <input value={t.location} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, location: e.target.value } : x))} style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Initials</label>
                  <input value={t.avatar_text} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, avatar_text: e.target.value } : x))} style={{ ...inp, textAlign:'center' }} maxLength={4} />
                </div>
              </div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Review</label>
              <textarea value={t.review} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, review: e.target.value } : x))} rows={2} style={{ ...inp, resize:'vertical', marginBottom:'10px' }} />
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => saveTestimonial(t)} style={btn('#E8834A')}>{saving === t.id ? '...' : 'Save'}</button>
                <button onClick={() => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x))} style={btn(t.is_active ? '#4A7C59' : '#C9A98A')}>{t.is_active ? '👁 Visible' : '🙈 Hidden'}</button>
                <button onClick={() => deleteTestimonial(t.id)} style={btn('#DC2626')}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BLOG TAB ── */}
      {tab === 'blog' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'12px' }}>
            <button onClick={addBlog} style={btn('#E8834A')}>+ Add Post</button>
          </div>
          {blogs.map(b => (
            <div key={b.id} style={card}>
              <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:'8px', marginBottom:'8px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Tag</label>
                  <input value={b.tag} onChange={e => setBlogs(blogs.map(x => x.id === b.id ? { ...x, tag: e.target.value } : x))} style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Title</label>
                  <input value={b.title} onChange={e => setBlogs(blogs.map(x => x.id === b.id ? { ...x, title: e.target.value } : x))} style={{ ...inp, fontWeight:500 }} />
                </div>
              </div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#C9A98A', marginBottom:'4px' }}>Excerpt</label>
              <textarea value={b.excerpt} onChange={e => setBlogs(blogs.map(x => x.id === b.id ? { ...x, excerpt: e.target.value } : x))} rows={2} style={{ ...inp, resize:'vertical', marginBottom:'10px' }} />
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => saveBlog(b)} style={btn('#E8834A')}>{saving === b.id ? '...' : 'Save'}</button>
                <button onClick={() => setBlogs(blogs.map(x => x.id === b.id ? { ...x, is_published: !x.is_published } : x))} style={btn(b.is_published ? '#4A7C59' : '#C9A98A')}>{b.is_published ? '✅ Published' : '📝 Draft'}</button>
                <button onClick={() => deleteBlog(b.id)} style={btn('#DC2626')}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
