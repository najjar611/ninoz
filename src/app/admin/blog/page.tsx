'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  published_at: string | null
  created_at: string
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const blank = { title: '', slug: '', excerpt: '', content: '' }

export default function AdminBlog() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k: keyof typeof blank, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    if (editId) {
      await supabase.from('blog_posts').update({ title: form.title, slug: form.slug, excerpt: form.excerpt, content: form.content }).eq('id', editId)
    } else {
      await supabase.from('blog_posts').insert({ title: form.title, slug: form.slug, excerpt: form.excerpt, content: form.content })
    }
    setForm(blank)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function togglePublish(post: Post) {
    await supabase.from('blog_posts').update({ published_at: post.published_at ? null : new Date().toISOString() }).eq('id', post.id)
    load()
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    load()
  }

  function startEdit(post: Post) {
    setEditId(post.id)
    setForm({ title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const published = posts.filter(p => p.published_at).length
  const drafts = posts.length - published

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5DDD4', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Blog Posts</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#7A7068' }}>
          <span>Total: <b>{posts.length}</b></span>
          <span>Published: <b style={{ color: '#2D6A4F' }}>{published}</b></span>
          <span>Drafts: <b style={{ color: '#C84B0F' }}>{drafts}</b></span>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{editId ? 'Edit Post' : 'New Post'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inp} placeholder="Title" value={form.title}
            onChange={e => { set('title', e.target.value); if (!editId) set('slug', toSlug(e.target.value)) }} />
          <input style={inp} placeholder="Slug (URL)" value={form.slug} onChange={e => set('slug', e.target.value)} />
          <input style={inp} placeholder="Excerpt (short summary)" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} />
          <textarea style={{ ...inp, minHeight: 180, resize: 'vertical' }} placeholder="Content (one paragraph per line)" value={form.content}
            onChange={e => set('content', e.target.value)} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving || !form.title}
              style={{ padding: '9px 22px', borderRadius: 8, background: '#C84B0F', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Saving…' : editId ? 'Update Post' : 'Create Post'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(blank) }}
                style={{ padding: '9px 22px', borderRadius: 8, background: '#F5EDE4', color: '#7A7068', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid rgba(0,0,0,0.05)' }}>
        {loading ? <div style={{ color: '#C9A98A', fontSize: 13 }}>Loading…</div> : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#C9A98A', fontSize: 13 }}>No posts yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {posts.map(post => (
              <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1A' }}>{post.title}</div>
                  <div style={{ fontSize: 11, color: '#7A7068', marginTop: 2 }}>/{post.slug}</div>
                </div>
                <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 50, background: post.published_at ? '#E8F5EE' : '#FDF0E8', color: post.published_at ? '#2D6A4F' : '#C84B0F', fontWeight: 700, flexShrink: 0 }}>
                  {post.published_at ? 'Published' : 'Draft'}
                </div>
                <button onClick={() => togglePublish(post)}
                  style={{ padding: '5px 12px', borderRadius: 7, background: '#F5EDE4', color: '#2C1A0E', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {post.published_at ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => startEdit(post)}
                  style={{ padding: '5px 12px', borderRadius: 7, background: '#EEF2FF', color: '#3730A3', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => deletePost(post.id)}
                  style={{ padding: '5px 12px', borderRadius: 7, background: '#FEE2E2', color: '#DC2626', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
