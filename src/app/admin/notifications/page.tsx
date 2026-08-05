'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SEEN_KEY = 'admin_notifications_last_seen'
const UNREAD_KEY = 'admin_notifications_unread_ids'

type NotifItem = {
  id: string
  type: 'review' | 'subscription' | 'freeze' | 'payment' | 'zone' | 'address'
  created_at: string
  label: string
  sub: string
  link?: string
}

export default function AdminNotifications() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<NotifItem[]>([])
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const previousSeen = localStorage.getItem(SEEN_KEY) || new Date(0).toISOString()

    const [reviewRes, subRes, freezeRes, paymentRes, zoneRes, addrRes] = await Promise.all([
      supabase.from('meal_reviews')
        .select('id, created_at, comment, rating, subscriber_id, subscribers(parent_name, kid_name)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('subscriptions')
        .select('id, created_at, status, subscriber_id, subscribers(parent_name, kid_name), stages(name), payment_cycles(label)')
        .gte('created_at', since)
        .in('status', ['active', 'pending_payment'])
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('freeze_requests')
        .select('id, created_at, freeze_start, freeze_end, subscriptions(subscriber_id, subscribers(parent_name, kid_name))')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('payments')
        .select('id, created_at, amount, status, subscriptions(subscriber_id, subscribers(parent_name, kid_name))')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('delivery_zone_requests')
        .select('id, created_at, name, phone, area_text')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('address_change_requests')
        .select('id, created_at, status, delivery_address, subscriber_id, subscribers(parent_name, mobile_number)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const out: NotifItem[] = []

    ;((reviewRes.data || []) as any[]).forEach(r => {
      const pn = r.subscribers?.parent_name || 'Unknown'
      const kn = r.subscribers?.kid_name || 'baby'
      out.push({
        id: 'r_' + r.id,
        type: 'review',
        created_at: r.created_at,
        label: `New review from ${pn} (${kn})`,
        sub: r.comment ? `"${r.comment.slice(0, 80)}${r.comment.length > 80 ? '…' : ''}"` : `Rating: ${r.rating ?? '—'}`,
        link: r.subscriber_id ? `/admin/customers/${r.subscriber_id}` : undefined,
      })
    })

    ;((subRes.data || []) as any[]).forEach(s => {
      const pn = s.subscribers?.parent_name || 'Unknown'
      const kn = s.subscribers?.kid_name || 'baby'
      out.push({
        id: 's_' + s.id,
        type: 'subscription',
        created_at: s.created_at,
        label: `New subscription — ${pn} (${kn})`,
        sub: `${s.stages?.name || '—'} · ${s.payment_cycles?.label || '—'} · ${s.status}`,
        link: s.subscriber_id ? `/admin/customers/${s.subscriber_id}` : undefined,
      })
    })

    ;((freezeRes.data || []) as any[]).forEach(f => {
      const sub = (f.subscriptions as any)
      const pn = sub?.subscribers?.parent_name || 'Unknown'
      const kn = sub?.subscribers?.kid_name || 'baby'
      out.push({
        id: 'f_' + f.id,
        type: 'freeze',
        created_at: f.created_at,
        label: `Subscription paused — ${pn} (${kn})`,
        sub: `${f.freeze_start} → ${f.freeze_end}`,
        link: sub?.subscriber_id ? `/admin/customers/${sub.subscriber_id}` : undefined,
      })
    })

    ;((paymentRes.data || []) as any[]).forEach(p => {
      const sub = (p.subscriptions as any)
      const pn = sub?.subscribers?.parent_name || 'Unknown'
      const kn = sub?.subscribers?.kid_name || 'baby'
      out.push({
        id: 'p_' + p.id,
        type: 'payment',
        created_at: p.created_at,
        label: `Payment received — ${pn} (${kn})`,
        sub: `${p.amount} SAR · ${p.status}`,
        link: sub?.subscriber_id ? `/admin/customers/${sub.subscriber_id}` : undefined,
      })
    })

    ;((zoneRes.data || []) as any[]).forEach(z => {
      out.push({
        id: 'z_' + z.id,
        type: 'zone',
        created_at: z.created_at,
        label: `Out-of-area request — ${z.name || 'Unknown'}`,
        sub: `${z.phone || '—'}${z.area_text ? ' · ' + z.area_text.slice(0, 60) : ''}`,
        link: z.phone ? `/admin/customers?q=${encodeURIComponent(z.phone)}` : undefined,
      })
    })

    ;((addrRes.data || []) as any[]).forEach(a => {
      out.push({
        id: 'a_' + a.id,
        type: 'address',
        created_at: a.created_at,
        label: `Location change request — ${a.subscribers?.parent_name || 'Customer'}`,
        sub: `${a.delivery_address || '—'}${a.status && a.status !== 'pending' ? ' · ' + a.status : ''}`,
        link: a.subscriber_id ? `/admin/customers/${a.subscriber_id}` : undefined,
      })
    })

    out.sort((a, b) => b.created_at.localeCompare(a.created_at))
    setItems(out)
    setLoading(false)

    // New items since the last visit start out unread; merge with anything
    // still manually marked unread from before (and drop ids that fell out
    // of the 30-day window).
    const validIds = new Set(out.map(i => i.id))
    const newIds = out.filter(i => i.created_at > previousSeen).map(i => i.id)
    let storedUnread: string[] = []
    try { storedUnread = JSON.parse(localStorage.getItem(UNREAD_KEY) || '[]') } catch { storedUnread = [] }
    const merged = Array.from(new Set([...storedUnread.filter(id => validIds.has(id)), ...newIds]))
    localStorage.setItem(UNREAD_KEY, JSON.stringify(merged))
    setUnreadIds(new Set(merged))

    // Mark all as seen. Defer the cross-component events to a microtask so the
    // sidebar badge update never lands inside this component's render/commit.
    localStorage.setItem(SEEN_KEY, new Date().toISOString())
    setTimeout(() => {
      window.dispatchEvent(new Event('admin-notif-seen'))
      window.dispatchEvent(new Event('admin-notif-unread-changed'))
    }, 0)
  }

  function toggleUnread(id: string) {
    // Side effects (localStorage + cross-component event) must run in the click
    // handler, NOT inside a setState updater — an updater runs during render,
    // and dispatching there would update AdminLayoutClient mid-render.
    const next = new Set(unreadIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setUnreadIds(next)
    localStorage.setItem(UNREAD_KEY, JSON.stringify(Array.from(next)))
    window.dispatchEvent(new Event('admin-notif-unread-changed'))
  }

  const iconFor = (type: NotifItem['type']) =>
    type === 'review' ? '⭐' : type === 'subscription' ? '✅' : type === 'freeze' ? '❄️' : type === 'zone' ? '📍' : type === 'address' ? '🏠' : '💳'

  const colorFor = (type: NotifItem['type']) =>
    type === 'review' ? '#C84B0F' : type === 'subscription' ? '#2D6A4F' : type === 'freeze' ? '#1E6091' : type === 'zone' ? '#8A3FFC' : type === 'address' ? '#1E6091' : '#8A6D3B'

  const bgFor = (type: NotifItem['type']) =>
    type === 'review' ? '#FDF0E8' : type === 'subscription' ? '#E8F5EE' : type === 'freeze' ? '#E0F0FA' : type === 'zone' ? '#F3ECFD' : type === 'address' ? '#E0F0FA' : '#FFF8EE'

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  if (loading) return <div style={{ padding: 40, color: '#7A7068', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>

  const CATEGORIES: { type: NotifItem['type']; title: string }[] = [
    { type: 'subscription', title: 'New Subscriptions' },
    { type: 'freeze', title: 'Paused Subscriptions' },
    { type: 'review', title: 'Meal Reviews' },
    { type: 'payment', title: 'Payments' },
  ]

  function renderItem(item: NotifItem) {
    const unread = unreadIds.has(item.id)
    return (
      <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: unread ? '#FFFDFB' : 'white', border: unread ? '1.5px solid #F0C9A8' : '1.5px solid #EDE8E0', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: bgFor(item.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          {iconFor(item.type)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C84B0F', flexShrink: 0 }} />}
            <div style={{ fontWeight: 800, fontSize: 13, color: colorFor(item.type) }}>{item.label}</div>
          </div>
          <div style={{ fontSize: 12.5, color: '#7A7068', marginTop: 2 }}>{item.sub}</div>
          {item.link && <Link href={item.link} style={{ fontSize: 11.5, fontWeight: 800, color: '#C84B0F', textDecoration: 'none' }}>View customer →</Link>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, color: '#B0A098', marginTop: 2 }}>{relativeTime(item.created_at)}</div>
          <button onClick={() => toggleUnread(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#C84B0F', padding: 0, fontFamily: 'inherit' }}>
            {unread ? 'Mark as read' : 'Mark as unread'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>Notifications</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>Customer activity from the last 30 days, grouped by type. Newest first within each group.</p>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#B0A098', fontSize: 14 }}>
          No activity in the last 30 days.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 16, alignItems: 'start' }}>
        {CATEGORIES.map(cat => {
          const catItems = items.filter(i => i.type === cat.type)
          if (catItems.length === 0) return null
          const unreadCount = catItems.filter(i => unreadIds.has(i.id)).length
          return (
            <div key={cat.type} style={{ background: '#FAF7F4', border: '1.5px solid #EDE8E0', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: bgFor(cat.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{iconFor(cat.type)}</span>
                <h2 style={{ fontSize: 14.5, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>{cat.title}</h2>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7A7068', background: '#EFE9E2', borderRadius: 99, padding: '1px 8px' }}>{catItems.length}</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: 'white', background: '#C84B0F', borderRadius: 99, padding: '1px 7px' }}>{unreadCount} new</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catItems.map(renderItem)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
