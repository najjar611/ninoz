import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const revalidate = 60

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .not('published_at', 'is', null)
    .single()

  if (!post) notFound()

  const paragraphs: string[] = (post.content || '').split('\n')

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif' }}>
      <a href="/blog" style={{ fontSize: 13, color: '#C84B0F', textDecoration: 'none', fontWeight: 700 }}>← Back to Blog</a>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 32, fontWeight: 900, color: '#1C1C1A', margin: '20px 0 8px' }}>
        {post.title}
      </h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 32 }}>
        {new Date(post.published_at).toLocaleDateString('en-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <div className="post-content">
        {paragraphs.map((para: string, i: number) =>
          para.trim() ? (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.8, color: '#2C1A0E', marginBottom: 16 }}>{para}</p>
          ) : (
            <br key={i} />
          )
        )}
      </div>
    </main>
  )
}
