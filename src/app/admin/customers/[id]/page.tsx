'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const money = (n: any) => (n == null ? '—' : `${n} SAR`)
const date = (d: any) => (d ? new Date(d).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
function endDate(start: any, days: any) {
  if (!start || !days) return null
  const d = new Date(start); d.setDate(d.getDate() + Number(days)); return d
}

const badge = (bg: string, color: string, text: string) => (
  <span style={{ background: bg, color, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>{text}</span>
)

export default function CustomerProfile() {
  const supabase = createClient()
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<any>(null)
  const [subs, setSubs] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [freezes, setFreezes] = useState<any[]>([])
  const [changeReqs, setChangeReqs] = useState<any[]>([])
  const [zoneReqs, setZoneReqs] = useState<any[]>([])
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('subscribers').select('*, subscriber_allergens(allergens(name))').eq('id', id).maybeSingle()
    setSub(s)
    const { data: sList } = await supabase.from('subscriptions').select('id, status, start_date, total_price, created_at, stages(name), payment_cycles(label, days)').eq('subscriber_id', id).order('created_at', { ascending: false })
    setSubs((sList as any) || [])
    const subIds = ((sList as any[]) || []).map(x => x.id)
    if (subIds.length) {
      const [{ data: pays }, { data: frz }] = await Promise.all([
        supabase.from('payments').select('id, amount, status, created_at, subscription_id').in('subscription_id', subIds).order('created_at', { ascending: false }),
        supabase.from('freeze_requests').select('id, freeze_start, freeze_end, created_at, subscription_id').in('subscription_id', subIds).order('created_at', { ascending: false }),
      ])
      setPayments((pays as any) || []); setFreezes((frz as any) || [])
    } else { setPayments([]); setFreezes([]) }
    const { data: revs } = await supabase.from('meal_reviews').select('id, rating, comment, created_at').eq('subscriber_id', id).order('created_at', { ascending: false })
    setReviews((revs as any) || [])
    const { data: acr } = await supabase.from('address_change_requests').select('id, subscriber_id, delivery_address, address_details, status, created_at').eq('subscriber_id', id).order('created_at', { ascending: false })
    setChangeReqs((acr as any) || [])
    if ((s as any)?.mobile_number) {
      const { data: dzr } = await supabase.from('delivery_zone_requests').select('id, area_text, created_at').eq('phone', (s as any).mobile_number).order('created_at', { ascending: false })
      setZoneReqs((dzr as any) || [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 2500) }
  async function approveChange(r: any) {
    await supabase.from('subscribers').update({ delivery_address: r.delivery_address, address_details: r.address_details }).eq('id', r.subscriber_id)
    await supabase.from('address_change_requests').update({ status: 'approved' }).eq('id', r.id)
    flash('Address change approved.'); load()
  }
  async function rejectChange(r: any) {
    await supabase.from('address_change_requests').update({ status: 'rejected' }).eq('id', r.id)
    flash('Request rejected.'); load()
  }
  async function allowRetry() {
    await supabase.from('subscribers').update({ out_of_area: false }).eq('id', id)
    // Clear the out-of-area log so it leaves every queue (profile + Delivery Area).
    if (sub?.mobile_number) await supabase.from('delivery_zone_requests').delete().eq('phone', sub.mobile_number)
    flash('Customer can retry the wizard now.'); load()
  }
  async function confirmPayment(subId: string) {
    if (!confirm('Confirm payment and activate this subscription?')) return
    await supabase.from('payments').update({ status: 'paid' }).eq('subscription_id', subId).eq('status', 'pending')
    const { error } = await supabase.from('subscriptions').update({ status: 'active' }).eq('id', subId)
    if (error) { flash('Failed: ' + error.message); return }
    flash('Payment confirmed — subscription is now active.'); load()
  }
  async function grantPause() {
    const live = subs.find(s => s.status === 'active' || s.status === 'frozen')
    if (!live) { flash('No active subscription to grant a pause on.'); return }
    const { data: cur } = await supabase.from('subscriptions').select('extra_pauses').eq('id', live.id).maybeSingle()
    const { error } = await supabase.from('subscriptions').update({ extra_pauses: (((cur as any)?.extra_pauses) || 0) + 1 }).eq('id', live.id)
    if (error) { flash('Could not grant pause: ' + error.message); return }
    flash('Granted one more pause for this customer.'); load()
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#B0A098', fontFamily: 'Nunito, sans-serif' }}>Loading…</div>
  if (!sub) return <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif', color: '#7A7068' }}>Customer not found. <Link href="/admin/customers" style={{ color: '#C84B0F' }}>Back to Customers</Link></div>

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #EDEBE8', padding: '18px 20px', marginBottom: 16 }
  const h2: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#B0A098', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }
  const kv = (k: string, v: any) => (<div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 2, fontSize: 13.5, marginBottom: 6 }}><div style={{ color: '#B0A098', fontWeight: 700 }}>{k}</div><div style={{ color: '#4A3C34' }}>{v ?? '—'}</div></div>)
  const btn: React.CSSProperties = { padding: '8px 14px', border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
  const allergies = (sub.subscriber_allergens?.map((a: any) => a.allergens?.name).filter(Boolean)) || []
  const pendingChanges = changeReqs.filter(r => r.status === 'pending')

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 860 }}>
      <Link href="/admin/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7A7068', textDecoration: 'none', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" /></svg>Customers
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FDF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#C84B0F' }}>{(sub.parent_name || '?').charAt(0).toUpperCase()}</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>{sub.parent_name || '—'}</h1>
          <div style={{ fontSize: 13, color: '#7A7068', fontFamily: 'monospace' }}>{sub.mobile_number || '—'}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {(sub.out_of_area || zoneReqs.length > 0) && badge('#F3ECFD', '#8A3FFC', 'Out of area')}
          {(sub.out_of_area || zoneReqs.length > 0) && <button style={{ ...btn, background: '#F2EDE8', color: '#5A5048' }} onClick={allowRetry}>Allow retry</button>}
          {subs.some(s => s.status === 'active' || s.status === 'frozen') && <button style={{ ...btn, background: '#FDF0E8', color: '#C84B0F' }} onClick={grantPause}>Grant extra pause</button>}
        </div>
      </div>

      {msg && <div style={{ background: '#E8F5EE', color: '#2D6A4F', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{msg}</div>}

      {pendingChanges.length > 0 && (
        <div style={{ ...card, background: '#FFF8EE', border: '1.5px solid #F0D9B0' }}>
          <div style={h2}>Pending location change{pendingChanges.length > 1 ? 's' : ''}</div>
          {pendingChanges.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13.5, color: '#4A3C34' }}>{r.delivery_address || r.address_details?.national || '—'}<div style={{ fontSize: 11.5, color: '#A08070' }}>{r.address_details?.region} · {r.address_details?.district} · {date(r.created_at)}</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn, background: '#2D6A4F', color: '#fff' }} onClick={() => approveChange(r)}>Approve</button>
                <button style={{ ...btn, background: '#F2EDE8', color: '#7A7068' }} onClick={() => rejectChange(r)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={card}>
        <div style={h2}>Profile</div>
        {kv('Baby', sub.kid_name)}
        {kv('Birth date', sub.kid_birth_date ? date(sub.kid_birth_date) : '—')}
        {kv('Email', sub.email)}
        {kv('Registered', date(sub.created_at))}
        {kv('Allergies', allergies.length ? allergies.join(', ') : 'None')}
      </div>

      <div style={card}>
        <div style={h2}>Delivery address</div>
        <div style={{ fontSize: 13.5, color: '#4A3C34' }}>{sub.delivery_address || sub.address_details?.national || '—'}</div>
        {sub.address_details?.region && <div style={{ fontSize: 12.5, color: '#A08070', marginTop: 4 }}>{sub.address_details.region} · {sub.address_details.district}</div>}
        {sub.address_details?.lat && <a href={`https://www.google.com/maps?q=${sub.address_details.lat},${sub.address_details.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: '#C84B0F', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: 6 }}>Open in Maps →</a>}
      </div>

      <div style={card}>
        <div style={h2}>Subscriptions ({subs.length})</div>
        {subs.length === 0 ? <div style={{ color: '#B0A098', fontSize: 13 }}>No subscriptions.</div> : subs.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #F5F1EC', padding: '8px 0' }}>
            <div style={{ fontSize: 13.5, color: '#1C1C1A', fontWeight: 700 }}>{s.stages?.name || '—'} · {s.payment_cycles?.label || '—'}<div style={{ fontSize: 12, color: '#A08070', fontWeight: 400 }}>Starts {date(s.start_date)}{endDate(s.start_date, s.payment_cycles?.days) ? ` · Expires ${date(endDate(s.start_date, s.payment_cycles?.days))}` : ''} · {money(s.total_price)}</div></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {s.status === 'pending_payment' && <button style={{ ...btn, background: '#2D6A4F', color: '#fff' }} onClick={() => confirmPayment(s.id)}>Confirm payment</button>}
              {badge(s.status === 'active' ? '#E8F5EE' : s.status === 'frozen' ? '#E0F0FA' : '#FFF8EE', s.status === 'active' ? '#2D6A4F' : s.status === 'frozen' ? '#1E6091' : '#8A6D3B', s.status)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: '1 1 260px' }}>
          <div style={h2}>Payments ({payments.length})</div>
          {payments.length === 0 ? <div style={{ color: '#B0A098', fontSize: 13 }}>None.</div> : payments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #F9F7F5' }}><span style={{ color: '#4A3C34' }}>{money(p.amount)}</span><span style={{ color: '#A08070' }}>{p.status} · {date(p.created_at)}</span></div>
          ))}
        </div>
        <div style={{ ...card, flex: '1 1 260px' }}>
          <div style={h2}>Reviews ({reviews.length})</div>
          {reviews.length === 0 ? <div style={{ color: '#B0A098', fontSize: 13 }}>None.</div> : reviews.map(r => (
            <div key={r.id} style={{ fontSize: 13, padding: '5px 0', borderBottom: '1px solid #F9F7F5' }}><span style={{ color: '#C84B0F', fontWeight: 800 }}>{'★'.repeat(r.rating || 0)}</span> <span style={{ color: '#4A3C34' }}>{r.comment || '—'}</span><div style={{ fontSize: 11, color: '#B0A098' }}>{date(r.created_at)}</div></div>
          ))}
        </div>
      </div>

      {(freezes.length > 0 || zoneReqs.length > 0) && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {freezes.length > 0 && (
            <div style={{ ...card, flex: '1 1 260px' }}>
              <div style={h2}>Pauses ({freezes.length})</div>
              {freezes.map(f => <div key={f.id} style={{ fontSize: 13, padding: '5px 0', color: '#4A3C34' }}>{date(f.freeze_start)} → {date(f.freeze_end)}</div>)}
            </div>
          )}
          {zoneReqs.length > 0 && (
            <div style={{ ...card, flex: '1 1 260px' }}>
              <div style={h2}>Out-of-area requests ({zoneReqs.length})</div>
              {zoneReqs.map(z => <div key={z.id} style={{ fontSize: 13, padding: '5px 0', color: '#4A3C34' }}>{z.area_text || '—'}<div style={{ fontSize: 11, color: '#B0A098' }}>{date(z.created_at)}</div></div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
