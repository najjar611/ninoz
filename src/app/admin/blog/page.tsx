'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Post = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image_url: string
  author: string
  is_published: boolean
  published_at: string | null
  created_at: string
}

type FormState = {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string
  author: string
  is_published: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  author: 'Ninoz Team',
  is_published: false,
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid #EDE8E0',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  background: 'white',
  color: '#1C1C1A',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  color: '#7A7068',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export default function AdminBlogPage() {
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newForm, setNewForm] = useState<FormState>({ ...EMPTY_FORM })
  const [editForms, setEditForms] = useState<Record<string, FormState>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  function flash(text: string, type: 'success' | 'error' = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  // New form handlers
  function updateNew(key: keyof FormState, val: string | boolean) {
    setNewForm(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'title' && typeof val === 'string') {
        next.slug = slugify(val)
      }
      return next
    })
  }

  async function createPost() {
    if (!newForm.title.trim()) { flash('Title is required', 'error'); return }
    if (!newForm.slug.trim()) { flash('Slug is required', 'error'); return }
    setSaving(true)
    const payload = {
      ...newForm,
      published_at: newForm.is_published ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('blog_posts').insert(payload)
    setSaving(false)
    if (error) { flash('Error: ' + error.message, 'error'); return }
    flash('Post created!')
    setNewForm({ ...EMPTY_FORM })
    setShowNewForm(false)
    load()
  }

  // Edit form handlers
  function startEdit(post: Post) {
    setEditingId(post.id)
    setEditForms(prev => ({
      ...prev,
      [post.id]: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        cover_image_url: post.cover_image_url || '',
        author: post.author || 'Ninoz Team',
        is_published: post.is_published,
      }
    }))
  }

  function updateEdit(id: string, key: keyof FormState, val: string | boolean) {
    setEditForms(prev => {
      const cur = prev[id] || { ...EMPTY_FORM }
      const next = { ...cur, [key]: val }
      if (key === 'title' && typeof val === 'string') {
        next.slug = slugify(val)
      }
      return { ...prev, [id]: next }
    })
  }

  async function saveEdit(post: Post) {
    const form = editForms[post.id]
    if (!form) return
    if (!form.title.trim()) { flash('Title is required', 'error'); return }
    setSaving(true)

    const wasPublished = post.is_published
    const nowPublished = form.is_published

    const payload: Partial<Post> & { published_at?: string | null } = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_image_url: form.cover_image_url,
      author: form.author,
      is_published: form.is_published,
    }

    if (!wasPublished && nowPublished) {
      payload.published_at = new Date().toISOString()
    } else if (!nowPublished) {
      payload.published_at = null
    }

    const { error } = await supabase.from('blog_posts').update(payload).eq('id', post.id)
    setSaving(false)
    if (error) { flash('Error: ' + error.message, 'error'); return }
    flash('Post updated!')
    setEditingId(null)
    load()
  }

  async function deletePost(post: Post) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
    if (error) { flash('Error: ' + error.message, 'error'); return }
    flash('Post deleted')
    load()
  }

  const totalPosts = posts.length
  const publishedCount = posts.filter(p => p.is_published).length
  const draftCount = totalPosts - publishedCount

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading...</div>

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', margin: '0 0 4px' }}>Blog Posts</h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: 0 }}>Create and manage articles shown on the public blog.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && (
            <div style={{
              background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2',
              color: msg.type === 'success' ? '#2D6A4F' : '#DC2626',
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600
            }}>
              {msg.text}
            </div>
          )}
          <button
            onClick={() => { setShowNewForm(v => !v); setEditingId(null) }}
            style={{ padding: '9px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {showNewForm ? '✕ Cancel' : '+ New Post'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Posts', value: totalPosts, color: '#0A429B' },
          { label: 'Published', value: publishedCount, color: '#2D6A4F' },
          { label: 'Drafts', value: draftCount, color: '#92400E' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '16px 24px', minWidth: 120, flex: '0 0 auto' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A0958D', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* New Post Form */}
      {showNewForm && (
        <PostForm
          form={newForm}
          onChange={(k, v) => updateNew(k, v)}
          onSave={createPost}
          onCancel={() => setShowNewForm(false)}
          saving={saving}
          title="New Post"
        />
      )}

      {/* Post List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.length === 0 && !showNewForm && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#C9A98A', background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
            <p style={{ fontSize: 14, margin: 0 }}>No blog posts yet. Click &quot;+ New Post&quot; to create your first.</p>
          </div>
        )}

        {posts.map(post => (
          <div key={post.id}>
            {/* Row */}
            <div style={{
              background: 'white',
              borderRadius: editingId === post.id ? '14px 14px 0 0' : 14,
              border: '1px solid rgba(0,0,0,0.06)',
              borderBottom: editingId === post.id ? '1px solid #EDE8E0' : '1px solid rgba(0,0,0,0.06)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1A', marginBottom: 3 }}>{post.title}</div>
                <div style={{ fontSize: 12, color: '#A0958D' }}>/{post.slug}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  background: post.is_published ? '#D1FAE5' : '#FEF3C7',
                  color: post.is_published ? '#065F46' : '#92400E',
                }}>
                  {post.is_published ? 'Published' : 'Draft'}
                </span>
                <span style={{ fontSize: 12, color: '#A0958D', minWidth: 90 }}>{formatDate(post.published_at || post.created_at)}</span>
                <button
                  onClick={() => editingId === post.id ? setEditingId(null) : startEdit(post)}
                  style={{ padding: '6px 14px', background: editingId === post.id ? '#EDE8E0' : '#FAF0E6', color: editingId === post.id ? '#5A5048' : '#C84B0F', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {editingId === post.id ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={() => deletePost(post)}
                  style={{ padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === post.id && editForms[post.id] && (
              <div style={{ background: '#FAFAF8', border: '1px solid rgba(0,0,0,0.06)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '24px 20px' }}>
                <PostForm
                  form={editForms[post.id]}
                  onChange={(k, v) => updateEdit(post.id, k, v)}
                  onSave={() => saveEdit(post)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                  title="Edit Post"
                  inline
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared form component ──────────────────────────────────────────────────────
function PostForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  title,
  inline = false,
}: {
  form: FormState
  onChange: (key: keyof FormState, val: string | boolean) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  title: string
  inline?: boolean
}) {
  const wrap: React.CSSProperties = inline
    ? {}
    : { background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', padding: '24px 22px', marginBottom: 20 }

  return (
    <div style={wrap}>
      {!inline && (
        <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0A429B', margin: '0 0 20px' }}>{title}</h2>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Title *</label>
          <input
            style={inp}
            value={form.title}
            placeholder="My Blog Post"
            onChange={e => onChange('title', e.target.value)}
          />
        </div>
        <div>
          <label style={label}>Slug</label>
          <input
            style={inp}
            value={form.slug}
            placeholder="my-blog-post"
            onChange={e => onChange('slug', e.target.value)}
          />
        </div>
        <div>
          <label style={label}>Author</label>
          <input
            style={inp}
            value={form.author}
            placeholder="Ninoz Team"
            onChange={e => onChange('author', e.target.value)}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Excerpt (short summary)</label>
          <textarea
            style={{ ...inp, height: 64, resize: 'vertical' }}
            value={form.excerpt}
            placeholder="A brief description shown in the post card..."
            onChange={e => onChange('excerpt', e.target.value)}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Content</label>
          <textarea
            style={{ ...inp, height: 220, resize: 'vertical', lineHeight: 1.6 }}
            value={form.content}
            placeholder="Write your full article content here..."
            onChange={e => onChange('content', e.target.value)}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Cover Image URL</label>
          <input
            style={inp}
            value={form.cover_image_url}
            placeholder="https://..."
            onChange={e => onChange('cover_image_url', e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, flexWrap: 'wrap', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={e => onChange('is_published', e.target.checked)}
            style={{ accentColor: '#C84B0F', width: 16, height: 16 }}
          />
          Publish immediately
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ padding: '8px 16px', background: '#EDE8E0', color: '#5A5048', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ padding: '8px 22px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.65 : 1, fontFamily: 'inherit' }}
          >
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
