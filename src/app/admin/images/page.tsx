// ADMIN IMAGE MANAGER
// Upload images from phone or computer
// Images go to Supabase Storage and appear on website instantly
//
// BUCKETS:
//   slideshow → hero section photos
//   plans     → plan card photos
//   blog      → blog post photos
//   meals     → individual meal photos

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Bucket = 'slideshow' | 'plans' | 'blog' | 'meals'

const buckets: { id: Bucket; label: string; desc: string; color: string }[] = [
  { id: 'slideshow', label: 'Slideshow', desc: 'Hero rotating images', color: '#E8834A' },
  { id: 'plans',     label: 'Plans',     desc: 'Plan card images',     color: '#4A7C59' },
  { id: 'blog',      label: 'Blog',      desc: 'Blog post images',     color: '#7B5EA7' },
  { id: 'meals',     label: 'Meals',     desc: 'Meal photos',          color: '#1A5EA8' },
]

export default function ImagesPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [bucket, setBucket] = useState<Bucket>('slideshow')
  const [images, setImages] = useState<{ name: string; url: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => { loadImages() }, [bucket])

  async function loadImages() {
    setLoading(true)
    const { data } = await supabase.storage.from(bucket).list('', { sortBy: { column: 'created_at', order: 'desc' } })
    if (data) {
      setImages(data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
        name: f.name,
        url: supabase.storage.from(bucket).getPublicUrl(f.name).data.publicUrl,
      })))
    }
    setLoading(false)
  }

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 4000) }

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { flash('Please upload an image file'); return }
    if (file.size > 5 * 1024 * 1024) { flash('Image must be under 5MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const { error } = await supabase.storage.from(bucket).upload(`${Date.now()}.${ext}`, file)
    setUploading(false)
    if (error) flash(`Upload failed: ${error.message}`)
    else { flash('Uploaded ✓'); loadImages() }
  }

  async function deleteImage(name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await supabase.storage.from(bucket).remove([name])
    flash('Deleted')
    setImages(images.filter(i => i.name !== name))
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    flash('URL copied ✓')
  }

  const activeBucket = buckets.find(b => b.id === bucket)!

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Image Manager</h1>
          <p style={{ color: '#7A7068', fontSize: '13px' }}>Upload from phone or computer. Changes appear instantly.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}
      </div>

      {/* Bucket tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {buckets.map(b => (
          <button key={b.id} onClick={() => setBucket(b.id)} style={{
            padding: '8px 16px', borderRadius: '8px', border: activeBucket.id === b.id ? 'none' : '1px solid rgba(0,0,0,0.08)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            background: activeBucket.id === b.id ? b.color : 'white',
            color: activeBucket.id === b.id ? 'white' : '#7A7068',
          }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Upload area — tap on mobile, drag on desktop */}
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? activeBucket.color : 'rgba(0,0,0,0.12)'}`,
          borderRadius: '14px', padding: '36px',
          textAlign: 'center', cursor: 'pointer',
          background: dragOver ? `${activeBucket.color}08` : 'white',
          marginBottom: '24px', transition: 'all 0.2s',
        }}
      >
        <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); if (fileRef.current) fileRef.current.value = '' }} style={{ display: 'none' }} />
        {uploading
          ? <div style={{ color: '#7A7068', fontSize: '14px' }}>Uploading...</div>
          : <>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📤</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1C1C1A', marginBottom: '4px' }}>Tap to upload or drag & drop</div>
              <div style={{ fontSize: '13px', color: '#7A7068' }}>JPG, PNG, WebP — max 5MB</div>
              <div style={{ fontSize: '12px', color: activeBucket.color, marginTop: '6px', fontWeight: 500 }}>→ {activeBucket.label}: {activeBucket.desc}</div>
            </>
        }
      </div>

      {/* Images grid */}
      {loading
        ? <div style={{ textAlign: 'center', padding: '40px', color: '#7A7068' }}>Loading...</div>
        : images.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px', color: '#C9A98A', fontSize: '14px' }}>No images yet. Upload your first one above.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {images.map(img => (
                <div key={img.name} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <img src={img.url} alt={img.name} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#7A7068', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>{img.name}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => copyUrl(img.url)} style={{ flex: 1, padding: '5px', borderRadius: '5px', border: '1px solid #E8D5C4', background: 'white', cursor: 'pointer', fontSize: '10px', color: '#7A7068', fontWeight: 500 }}>Copy URL</button>
                      <button onClick={() => deleteImage(img.name)} style={{ padding: '5px 7px', borderRadius: '5px', border: '1px solid #FEE2E2', background: 'white', cursor: 'pointer', color: '#DC2626', fontSize: '12px' }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}
