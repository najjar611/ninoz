import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60

export default async function BlogPage() {
  const supabase = createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, published_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 32, fontWeight: 900, color: '#1C1C1A', marginBottom: 8 }}>Blog</h1>
      <p style={{ fontSize: 14, color: '#7A7068', marginBottom: 36 }}>Tips, recipes, and insights for busy parents.</p>
      {!posts || posts.length === 0 ? (
        <p style={{ color: '#C9A98A', fontSize: 14 }}>No posts yet — check back soon!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(0,0,0,0.06)', transition: 'transform 0.2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = 'none')}>
                <p style={{ fontSize: 11, color: '#C84B0F', fontWeight: 700, marginBottom: 8 }}>
                  {new Date(post.published_at).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 17, fontWeight: 800, color: '#1C1C1A', marginBottom: 10, lineHeight: 1.4 }}>
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p style={{ fontSize: 13, color: '#7A7068', lineHeight: 1.6 }}>{post.excerpt}</p>
                )}
                <p style={{ fontSize: 12, color: '#C84B0F', fontWeight: 700, marginTop: 14 }}>Read more →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
