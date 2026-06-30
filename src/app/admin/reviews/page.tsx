'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Review = {
  id: string; menu_date: string; meal_type: string; comment: string; created_at: string; rating: number | null
  subscriber_id: string
  subscribers: { parent_name: string | null; kid_name: string | null } | null
  meals: { name: string; name_ar: string | null } | null
}

type Group = {
  subscriberId: string
  parentName: string
  kidName: string | null
  reviews: Review[]
  latest: string
}

function stars(n: number | null) {
  if (!n) return null
  return '⭐'.repeat(n)
}

export default function ReviewsAdmin() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('meal_reviews')
        .select('id, menu_date, meal_type, comment, created_at, rating, subscriber_id, subscribers(parent_name, kid_name), meals(name, name_ar)')
        .order('created_at', { ascending: false })
      if (error) setError(error.message)
      setReviews((data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#B0A098', fontFamily: 'Nunito, sans-serif', fontSize: 14 }}>
      Loading reviews…
    </div>
  )

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 14, padding: '18px 22px', fontSize: 13, lineHeight: 1.7 }}>
        <strong>Cannot load reviews:</strong> {error}
      </div>
    </div>
  )

  const groups: Group[] = []
  const bySub: Record<string, Group> = {}
  reviews.forEach(r => {
    if (!bySub[r.subscriber_id]) {
      const g: Group = {
        subscriberId: r.subscriber_id,
        parentName: r.subscribers?.parent_name || 'A parent',
        kidName: r.subscribers?.kid_name || null,
        reviews: [],
        latest: r.created_at,
      }
      bySub[r.subscriber_id] = g
      groups.push(g)
    }
    bySub[r.subscriber_id].reviews.push(r)
  })
  groups.sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime())

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>Reviews</h1>
        {reviews.length > 0 && (
          <span style={{ background: '#C84B0F', color: 'white', fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '3px 10px' }}>
            {reviews.length} new
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#B0A098', padding: '60px 20px', fontSize: 14 }}>No reviews submitted yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(g => {
            const mealNames = Array.from(new Set(g.reviews.map(r => r.meals?.name || r.meal_type)))
            const isOpen = openGroup === g.subscriberId
            return (
              <div key={g.subscriberId} style={{ background: 'white', border: '1.5px solid #EDE8E0', borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenGroup(isOpen ? null : g.subscriberId)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1A' }}>
                      {g.parentName}{g.kidName ? ` · ${g.kidName}` : ''} reviewed {mealNames.join(', ')}
                    </div>
                    <div style={{ fontSize: 12, color: '#7A7068', marginTop: 2 }}>{g.reviews.length} {g.reviews.length === 1 ? 'review' : 'reviews'}</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#C84B0F', fontWeight: 700 }}>{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop: '1.5px solid #EDE8E0', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {g.reviews.map(r => (
                      <div key={r.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 12.5, color: '#7A7068' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 700, color: '#C84B0F' }}>{r.meal_type}</span> · {r.meals?.name || 'a meal'} · {new Date(r.menu_date).toLocaleDateString()}
                            {stars(r.rating) && <span style={{ marginLeft: 8 }}>{stars(r.rating)}</span>}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#B0A098' }}>{new Date(r.created_at).toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#FDF8F4', border: '1px solid #F3E3D6', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, color: '#1C1C1A', lineHeight: 1.6 }}>
                          “{r.comment}”
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
