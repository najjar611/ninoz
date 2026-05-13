// ════════════════════════════════════════════════════════════
// ADMIN IMAGE MANAGER
// Upload images for each specific section
// Each slot shows exactly where the image appears on the site
// Works on phone and computer
// ════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Bucket = 'logo' | 'slideshow' | 'plans' | 'blog' | 'meals'

const buckets: {
  id: Bucket
  label: string
  desc: string
  color: string
  hint: string
  multiple: boolean
}[] = [
  {
    id: 'logo',
    label: '🏷️ Logo',
    desc: 'Top left of every page',
    color: '#1C1C1A',
    hint: 'Upload one PNG with transparent background. Recommended: 200×60px',
    multiple: false,
  },
  {
    id: 'slideshow',
    label: '🏠 Hero Slideshow',
    desc: 'Rotating images on homepage',
    color: '#E8834A',
    hint: 'Upload multiple photos. They rotate automatically every 4 seconds on the homepage.',
    multiple: true,
  },
  {
    id: 'plans',
    label: '🥄 Plan Cards',
    desc: 'Images on plan cards',
    color: '#4A7C59',
    hint: 'Upload one image per plan. Name them: stage1-plan1.jpg, stage1-plan2.jpg, stage2-plan1.jpg etc.',
    multiple: true,
  },
  {
    id: 'blog',
    label: '📰 Blog Posts',
    desc: 'Blog article images',
    color: '#7B5EA7',
    hint: 'Upload one image per blog post. Name them: blog-1.jpg, blog-2.jpg etc.',
    multiple: true,
  },
  {
    id: 'meals',
    label: '🍽️ Meal Photos',
    desc: 'Individual meal photos',
    color: '#1A5EA8',
    hint: 'Photos of individual meals shown in the weekly schedule.',
    multiple: true,
  },
]

export default function ImagesPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [bucket, setBucket] = useState<Bucket>('logo')
  const [images, setImages] = useState<{ name: string; url: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: 'success' })
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

  function flash(text: string, type = 'success') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 4000) }

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { flash('Please upload an image file', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { flash('Image must be under 5MB', 'error'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = bucket === 'logo' ? `logo.${ext}` : `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: bucket === 'logo' })
    setUploading(false)
    if (error) flash(`Upload failed: ${error.message}`, 'error')
    else { flash('Uploaded successfully ✓'); loadImages() }
  }

  async function deleteImage(name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:'#1C1C1A', marginBottom:'4px' }}>Image Manager</h1>
          <p style={{ fontSize:'13px', color:'#7A7068' }}>Upload from phone or computer. Each section is clearly labeled.</p>
        </div>
        {msg.text && (
          <div style={{ background: msg.type === 'success' ? '#E8F5EE' : '#FEE2E2', color: msg.type === 'success' ? '#2D6A4F' : '#DC2626', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500 }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Section selector */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
        {buckets.map(b => (
          <button key={b.id} onClick={() => setBucket(b.id)} style={{
            padding:'9px 16px', borderRadius:'10px', border: bucket === b.id ? 'none' : '1px solid rgba(0,0,0,0.08)',
            cursor:'pointer', fontSize:'13px', fontWeight:500,
            background: bucket === b.id ? b.color : 'white',
            color: bucket === b.id ? 'white' : '#7A7068',
          }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Section info */}
      <div style={{ background:`${activeBucket.color}10`, border:`1px solid ${activeBucket.color}30`, borderRadius:'12px', padding:'14px 18px', marginBottom:'20px' }}>
        <div style={{ fontSize:'13px', fontWeight:600, color: activeBucket.color, marginBottom:'4px' }}>
          📍 Where this appears: {activeBucket.desc}
        </div>
        <div style={{ fontSize:'12px', color:'#7A7068' }}>{activeBucket.hint}</div>
      </div>

      {/* Upload area */}
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border:`2px dashed ${dragOver ? activeBucket.color : 'rgba(0,0,0,0.12)'}`,
          borderRadius:'14px', padding:'32px',
          textAlign:'center', cursor:'pointer',
          background: dragOver ? `${activeBucket.color}08` : 'white',
          marginBottom:'20px', transition:'all 0.2s',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); if (fileRef.current) fileRef.current.value = '' }}
          style={{ display:'none' }}
        />
        {uploading ? (
          <div style={{ color:'#7A7068', fontSize:'14px' }}>Uploading...</div>
        ) : (
          <>
            <div style={{ fontSize:'28px', marginBottom:'8px' }}>📤</div>
            <div style={{ fontSize:'14px', fontWeight:600, color:'#1C1C1A', marginBottom:'4px' }}>
              Tap to upload or drag & drop
            </div>
            <div style={{ fontSize:'12px', color:'#7A7068' }}>JPG, PNG, WebP — max 5MB</div>
          </>
        )}
      </div>

      {/* Images grid */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'32px', color:'#7A7068' }}>Loading...</div>
      ) : images.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px', color:'#C9A98A', fontSize:'14px' }}>
          No images yet in this section. Upload your first one above.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'10px' }}>
          {images.map(img => (
            <div key={img.name} style={{ background:'white', borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(0,0,0,0.06)' }}>
              <img src={img.url} alt={img.name} style={{ width:'100%', height:'110px', objectFit:'cover', display:'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div style={{ padding:'8px' }}>
                <div style={{ fontSize:'10px', color:'#7A7068', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'6px' }}>{img.name}</div>
                <div style={{ display:'flex', gap:'4px' }}>
                  <button onClick={() => copyUrl(img.url)} style={{ flex:1, padding:'4px', borderRadius:'5px', border:'1px solid #E8D5C4', background:'white', cursor:'pointer', fontSize:'10px', color:'#7A7068', fontWeight:500 }}>Copy URL</button>
                  <button onClick={() => deleteImage(img.name)} style={{ padding:'4px 6px', borderRadius:'5px', border:'1px solid #FEE2E2', background:'white', cursor:'pointer', color:'#DC2626', fontSize:'11px' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
