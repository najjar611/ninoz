import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content, excerpt, cover_image_url, author, published_at, is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) {
    notFound()
  }

  const paragraphs = post.content ? post.content.split('\n') : []

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', fontFamily: 'Nunito, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .post-nav { background: white; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 0 2rem; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .post-cover { width: 100%; max-height: 420px; object-fit: cover; display: block; }
        .post-cover-placeholder { width: 100%; height: 320px; background: linear-gradient(135deg, #0A429B 0%, #0d3480 100%); display: flex; align-items: center; justify-content: center; }
        .post-body { max-width: 720px; margin: 0 auto; padding: 52px 2rem 72px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 800; color: #C84B0F; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
        .post-title { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 900; color: #0A429B; line-height: 1.2; margin: 24px 0 14px; letter-spacing: -0.02em; }
        .post-meta { font-size: 14px; font-weight: 700; color: #C84B0F; margin-bottom: 36px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .post-content p { font-size: 1.05rem; line-height: 1.8; color: #2C1A0E; margin: 0 0 1.25em; }
        .post-divider { border: none; border-top: 1px solid rgba(0,0,0,0.08); margin: 48px 0 36px; }
        @media (max-width: 580px) { .post-body { padding: 32px 1.25rem 56px; } .post-nav { padding: 0 1.25rem; } }
      `}</style>

      {/* Nav */}
      <nav className="post-nav">
        <Link href="/" style={{ fontWeight: 900, fontSize: 22, color: '#0A429B', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Ninoz
        </Link>
        <Link href="/blog" style={{ fontSize: 14, fontWeight: 700, color: '#5A5048', textDecoration: 'none' }}>
          ← Blog
        </Link>
      </nav>

      {/* Cover Image */}
      {post.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt={post.title} className="post-cover" />
      ) : (
        <div className="post-cover-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
      )}

      {/* Article body */}
      <div className="post-body">
        <Link href="/blog" className="back-link">← Back to Blog</Link>

        <h1 className="post-title">{post.title}</h1>

        <div className="post-meta">
          <span>{post.author || 'Ninoz Team'}</span>
          {post.published_at && (
            <>
              <span style={{ color: '#C9A98A' }}>·</span>
              <span>{formatDate(post.published_at)}</span>
            </>
          )}
        </div>

        {post.excerpt && (
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#5A5048', lineHeight: 1.7, margin: '0 0 32px', padding: '18px 22px', background: 'white', borderRadius: 14, borderLeft: '4px solid #C84B0F' }}>
            {post.excerpt}
          </p>
        )}

        <div className="post-content">
          {paragraphs.map((para, i) =>
            para.trim() ? (
              <p key={i}>{para}</p>
            ) : (
              <br key={i} />
            )
          )}
        </div>

        <hr className="post-divider" />

        <Link href="/blog" className="back-link">← Back to Blog</Link>
      </div>

      {/* Footer stripe */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: 'white', padding: '28px 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#A0958D', margin: 0, fontWeight: 600 }}>
          © {new Date().getFullYear()} Ninoz · Wholesome meals for growing babies
        </p>
      </div>
    </div>
  )
}
