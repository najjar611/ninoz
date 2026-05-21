import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  author: string | null
  published_at: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, author, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const allPosts: Post[] = posts || []

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', fontFamily: 'Nunito, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .blog-nav { background: white; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 0 2rem; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .blog-hero { background: linear-gradient(135deg, #0A429B 0%, #0d3480 100%); color: white; padding: 80px 2rem; text-align: center; }
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; max-width: 1200px; margin: 0 auto; padding: 56px 2rem; }
        .blog-card { background: white; border-radius: 18px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
        .blog-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
        .blog-card-img { width: 100%; height: 200px; object-fit: cover; display: block; }
        .blog-card-img-placeholder { width: 100%; height: 200px; background: linear-gradient(135deg, #C84B0F 0%, #e05a1a 100%); display: flex; align-items: center; justify-content: center; }
        .blog-card-body { padding: 22px; flex: 1; display: flex; flex-direction: column; }
        .blog-card-category { display: inline-block; background: #FAF0E6; color: #C84B0F; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
        .blog-card-title { font-size: 17px; font-weight: 900; color: #0A429B; margin: 0 0 10px; line-height: 1.35; }
        .blog-card-excerpt { font-size: 13.5px; color: #6B6059; line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
        .blog-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.06); margin-top: auto; }
        .blog-card-meta { font-size: 12px; color: #A0958D; font-weight: 600; }
        .blog-read-more { font-size: 13px; font-weight: 800; color: #C84B0F; text-decoration: none; }
        .blog-read-more:hover { text-decoration: underline; }
        .blog-empty { text-align: center; padding: 100px 20px; color: #A0958D; }
        @media (max-width: 900px) { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 580px) { .blog-grid { grid-template-columns: 1fr; padding: 32px 1rem; } .blog-hero { padding: 56px 1.5rem; } }
      `}</style>

      {/* Nav */}
      <nav className="blog-nav">
        <Link href="/" style={{ fontWeight: 900, fontSize: 22, color: '#0A429B', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Ninoz
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: '#5A5048', textDecoration: 'none' }}>Home</Link>
          <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: 'white', background: '#C84B0F', padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="blog-hero">
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 16px', fontSize: 13, fontWeight: 700, marginBottom: 20, letterSpacing: '0.05em' }}>
          NINOZ BLOG
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Fresh Ideas &amp; Recipes
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'rgba(255,255,255,0.8)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6, fontWeight: 600 }}>
          Expert tips, wholesome recipes, and nutritional guidance for your little one&apos;s journey.
        </p>
      </div>

      {/* Grid */}
      {allPosts.length === 0 ? (
        <div className="blog-empty">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0A429B', marginBottom: 8 }}>No posts yet</h2>
          <p style={{ fontSize: 15 }}>Check back soon — fresh content is on its way!</p>
        </div>
      ) : (
        <div className="blog-grid">
          {allPosts.map(post => (
            <article key={post.id} className="blog-card">
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt={post.title} className="blog-card-img" />
              ) : (
                <div className="blog-card-img-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
              )}
              <div className="blog-card-body">
                <span className="blog-card-category">Nutrition</span>
                <h2 className="blog-card-title">{post.title}</h2>
                {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                <div className="blog-card-footer">
                  <div className="blog-card-meta">
                    <div style={{ fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>{post.author || 'Ninoz Team'}</div>
                    <div>{formatDate(post.published_at)}</div>
                  </div>
                  <Link href={`/blog/${post.slug}`} className="blog-read-more">
                    Read More →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Footer stripe */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: 'white', padding: '28px 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#A0958D', margin: 0, fontWeight: 600 }}>
          © {new Date().getFullYear()} Ninoz · Wholesome meals for growing babies
        </p>
      </div>
    </div>
  )
}
