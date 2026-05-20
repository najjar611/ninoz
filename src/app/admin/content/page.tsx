'use client'

// src/app/admin/content/page.tsx — Universal Control Panel v14.0 (Intelligent Theme Grading Setup)
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentItem = { key: string; value: string; label: string; section: string }
type FooterLink = { id: string; label: string; url: string; position: number; is_active: boolean }

const SECTION_LABELS: Record<string, string> = {
  navbar: '🔝 Navbar',
  hero: '🏠 Hero & Typography',
  ticker: '📢 Ticker Bar',
  stages: '🍼 Stages Milestone',
  how: '📋 How It Works Card',
  menu: '🍽️ Menu Customizer',
  ingredients: '🥕 Ingredients & Typography',
  faq: '❓ FAQ Control',
  footer: '🔗 Footer Text',
}

const ORDERED_SECTIONS = ['navbar', 'hero', 'ticker', 'stages', 'how', 'menu', 'ingredients', 'faq', 'footer', 'footer_links']
const GOOGLE_FONTS_COLLECTION = ['Nunito', 'Poppins', 'Inter', 'Montserrat', 'Playfair Display', 'Lora', 'Quicksand', 'Fredoka', 'Cabin']

export default function ContentAdmin() {
  const supabase = createClient()
  const [items, setItems] = useState<ContentItem[]>([])
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savingLink, setSavingLink] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => { load() }, [])

  async function load() {
    const [content, links] = await Promise.all([
      supabase.from('site_content').select('*').order('section').order('key'),
      supabase.from('footer_links').select('*').order('position'),
    ])
    
    const data = content.data || []
    
    const essentialKeys = [
      { key: 'site_font', value: 'Nunito', label: 'Primary Brand Font Typography Theme', section: 'hero' },
      { key: 'theme_color_primary', value: '#C84B0F', label: 'Primary Brand Master Accent Color (Auto-Generates Graded Shades & Tints Everywhere)', section: 'hero' },
      { key: 'theme_color_deep_blue', value: '#0A429B', label: 'Complementary Layout Core Color (e.g. Header Nav, Footer Banners)', section: 'hero' },
      { key: 'hero_image_url', value: '', label: 'Landing Page Hero Backdrop Image', section: 'hero' },
      { key: 'menu_macros_layout_mobile', value: 'grid_2x2', label: 'Meal Nutrient Badges Layout Format on Mobile', section: 'menu' },
      { key: 'menu_meal_image_size_pct', value: '100', label: 'Meal Plate Photo Dimension Size Scale (Percentage 50% - 120%)', section: 'menu' },
      { key: 'font_size_ingredients_title_mobile', value: '2.2rem', label: 'Ingredients Title Mobile Font Size', section: 'ingredients' },
      { key: 'menu_box_bg_opacity', value: '0.45', label: 'Menu Box Transparent Opacity Degree (0.1 - 1.0)', section: 'menu' },
      { key: 'why_image_url', value: '', label: 'Ingredients Section Backdrop Image', section: 'ingredients' }
    ]

    let updatedList = [...data]
    essentialKeys.forEach(ek => {
      if (!updatedList.some(i => i.key === ek.key)) {
        updatedList.push(ek)
      }
    })

    const cleaned = updatedList.map(item => {
      if (item.key === 'site_font') return { ...item, section: 'hero', label: 'Primary Brand Font Typography Theme' }
      if (item.key === 'theme_color_primary') return { ...item, section: 'hero', label: 'Primary Brand Master Accent Color (Auto-Generates Graded Shades & Tints Everywhere)' }
      if (item.key === 'theme_color_deep_blue') return { ...item, section: 'hero', label: 'Complementary Layout Core Color (e.g. Header Nav, Footer Banners)' }
      if (item.key === 'hero_image_url') return { ...item, section: 'hero', label: 'Landing Page Hero Backdrop Image' }
      if (item.key === 'menu_macros_layout_mobile') return { ...item, section: 'menu', label: 'Meal Nutrient Badges Layout Format on Mobile' }
      if (item.key === 'menu_meal_image_size_pct') return { ...item, section: 'menu', label: 'Meal Plate Photo Dimension Size Scale (Percentage 50% - 120%)' }
      if (item.key === 'why_image_url') return { ...item, section: 'ingredients', label: 'Ingredients Section Backdrop Image' }
      if (item.key === 'font_size_ingredients_title_mobile') return { ...item, section: 'ingredients', label: 'Ingredients Title Mobile Font Size (e.g. 2.2rem)' }
      if (item.key === 'menu_box_bg_opacity') return { ...item, section: 'menu', label: 'Menu Header Opacity Scale (0.0 to 1.0)' }
      return item
    }).filter(i => i.key !== 'theme_color_primary_hover') // Cleaned out old hover variables natively

    setItems(cleaned)
    setFooterLinks(links.data || [])
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, key: string) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(key)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${key}-${Date.now()}.${fileExt}`
      const filePath = `public/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      update(key, publicUrl)
      await supabase.from('site_content').upsert({ key, value: publicUrl, section: activeSection, label: key }, { onConflict: 'key' })
      flash('Image synced successfully!')
    } catch (error: any) {
      alert(`Upload notice: ${error.message}`)
    } finally {
      setUploading(null)
    }
  }

  async function save(item: ContentItem) {
    setSaving(item.key)
    await supabase.from('site_content').upsert({ key: item.key, value: item.value, section: item.section, label: item.label }, { onConflict: 'key' })
    setSaving(null)
    flash('Saved successfully!')
  }

  function update(key: string, value: string) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, value } : i))
  }

  async function saveLink(link: FooterLink) {
    setSavingLink(link.id)
    await supabase.from('footer_links').update({ label: link.label, url: link.url, is_active: link.is_active }).eq('id', link.id)
    setSavingLink(null)
    flash('Saved Link!')
  }

  function updateLink(id: string, key: keyof FooterLink, val: any) {
    setFooterLinks(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l))
  }

  async function addLink() {
    const { data } = await supabase.from('footer_links').insert({ label: 'New Link', url: '#', position: footerLinks.length + 1 }).select().single()
    if (data) setFooterLinks(prev => [...prev, data])
  }

  async function deleteLink(id: string) {
    await supabase.from('footer_links').delete().eq('id', id)
    setFooterLinks(prev => prev.filter(l => l.id !== id))
  }

  function flash(text: string) { 
    setMsg(text)
    setTimeout(() => setMsg(''), 2500) 
  }

  const filtered = items.filter(i => i.section === activeSection)
  const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #EDE8E0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#FFF' }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontWeight: 600 }}>Syncing Admin Environment...</div>

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px' }}>
      
      <style>{`
        .admin-main-grid { display: flex; gap: 24px; width: 100%; align-items: flex-start; }
        .admin-sidebar-nav { width: 220px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        .admin-content-pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
        .admin-nav-btn { width: 100%; text-align: left; padding: 12px 16px; border-radius: 12px; border: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 700; transition: all 0.2s; text-wrap: nowrap; }
        
        @media (max-width: 768px) {
          .admin-main-grid { flex-direction: column; gap: 16px; }
          .admin-sidebar-nav { width: 100%; flex-direction: row; overflow-x: auto; padding-bottom: 8px; margin-bottom: 4px; -webkit-overflow-scrolling: touch; }
          .admin-nav-btn { width: auto; padding: 10px 16px; font-size: 13px; border-radius: 10px; }
          .admin-content-pane { width: 100%; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Content & Text</h1>
          <p style={{ fontSize: 14, color: '#7A7068', margin: 0 }}>Change font dimensions, track transparency values, and manage layout cards natively.</p>
        </div>
        {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, boxShadow: '0 2px 8px rgba(45,106,79,0.08)' }}>{msg}</div>}
      </div>

      <div className="admin-main-grid">
        <div className="admin-sidebar-nav no-scrollbar">
          {ORDERED_SECTIONS.map(section => (
            <button key={section} className="admin-nav-btn" onClick={() => setActiveSection(section)} style={{
              background: activeSection === section ? '#C84B0F' : 'white',
              color: activeSection === section ? 'white' : '#5A5048',
              boxShadow: activeSection === section ? '0 4px 12px rgba(200,75,15,0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              {section === 'footer_links' ? '🔗 Footer Links' : SECTION_LABELS[section] || section}
            </button>
          ))}
        </div>

        <div className="admin-content-pane">
          {activeSection === 'footer_links' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={addLink} style={{ padding: '10px 20px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(200,75,15,0.15)' }}>
                  + Add Link
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {footerLinks.map(link => (
                  <div key={link.id} style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                    <input style={{ ...inp, flex: '1 1 140px' }} placeholder="Label" value={link.label} onChange={e => updateLink(link.id, 'label', e.target.value)} />
                    <input style={{ ...inp, flex: '2 1 200px' }} placeholder="URL" value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#1C1C1A', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={link.is_active} onChange={e => updateLink(link.id, 'is_active', e.target.checked)} style={{ accentColor: '#C84B0F', width: 16, height: 16 }} />
                      Active
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                      <button onClick={() => deleteLink(link.id)} style={{ padding: '10px 14px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                      <button onClick={() => saveLink(link)} disabled={savingLink === link.id} style={{ padding: '10px 18px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: savingLink === link.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                        {savingLink === link.id ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map(item => {
                const isImageKey = item.key.includes('image_url');
                const isFontKey = item.key === 'site_font';
                const isLayoutKey = item.key === 'menu_macros_layout_mobile';
                const isSliderKey = item.key === 'menu_meal_image_size_pct';
                const isColorKey = item.key.startsWith('theme_color_');

                return (
                  <div key={item.key} style={{ background: 'white', borderRadius: 16, padding: '22px 20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isImageKey ? '#C84B0F' : '#7A7068', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.label} {isSliderKey && `(${item.value}%)`}
                    </label>

                    {isFontKey ? (
                      <select style={inp} value={item.value} onChange={e => update(item.key, e.target.value)}>
                        {GOOGLE_FONTS_COLLECTION.map(fontName => (
                          <option key={fontName} value={fontName}>{fontName} Style Typography</option>
                        ))}
                      </select>
                    ) : isLayoutKey ? (
                      <select style={inp} value={item.value} onChange={e => update(item.key, e.target.value)}>
                        <option value="grid_2x2">2 Columns x 2 Rows Grid Layout</option>
                        <option value="row_4x1">4 Columns x 1 Horizontal Single Line Row</option>
                      </select>
                    ) : isSliderKey ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <input type="range" min="50" max="120" step="5" style={{ flex: 1, accentColor: '#C84B0F', cursor: 'pointer' }} value={item.value} onChange={e => update(item.key, e.target.value)} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A', minWidth: 44, textAlign: 'right' }}>{item.value}%</span>
                      </div>
                    ) : isColorKey ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <input type="color" style={{ width: 60, height: 44, border: '1.5px solid #EDE8E0', borderRadius: 10, cursor: 'pointer', background: 'transparent' }} value={item.value} onChange={e => update(item.key, e.target.value)} />
                        <input type="text" style={{ ...inp, width: 140, textTransform: 'uppercase' }} maxLength={7} value={item.value} onChange={e => update(item.key, e.target.value)} />
                        <div style={{ flex: 1, height: 10, background: item.value, borderRadius: 10, opacity: 0.15 }} />
                      </div>
                    ) : isImageKey ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, item.key)} disabled={uploading !== null} style={{ fontSize: '14px', color: '#5A5048' }} />
                          {uploading === item.key && <span style={{ fontSize: '13px', color: '#C84B0F', fontWeight: 800 }}>Uploading...</span>}
                        </div>
                        <input style={{ ...inp, background: '#FAF8F5', color: '#7A7068', fontSize: '13px' }} value={item.value} placeholder="No uploaded resource asset URL found" readOnly />
                      </div>
                    ) : item.value.length > 80 ? (
                      <textarea style={{ ...inp, height: 80, resize: 'vertical', marginBottom: 8 }} value={item.value} onChange={e => update(item.key, e.target.value)} />
                    ) : (
                      <input style={{ ...inp, marginBottom: 8 }} value={item.value} onChange={e => update(item.key, e.target.value)} />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: (isFontKey || isLayoutKey || isSliderKey || isColorKey) ? 12 : 0 }}>
                      <button onClick={() => save(item)} disabled={saving === item.key}
                        style={{ padding: '10px 22px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving === item.key ? 0.6 : 1, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(200,75,15,0.1)' }}>
                        {saving === item.key ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}