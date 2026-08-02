'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAccountLang } from '@/lib/AccountLangContext'

type Faq = { id: string; question: string; answer: string; question_ar?: string | null; answer_ar?: string | null }

export default function AccountSupport() {
  const supabase = createClient()
  const { isAR } = useAccountLang()
  const [email, setEmail] = useState('hello@ninoz.app')
  const [whats, setWhats] = useState('966591976737')
  const [insta, setInsta] = useState('ninoz.app')
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('site_content').select('key, value').in('key', ['footer_contact_email', 'contact_whatsapp', 'contact_instagram'])
      .then(({ data }) => {
        const map: Record<string, string> = {}
        ;((data as any[]) || []).forEach(r => { map[r.key] = r.value })
        if (map.footer_contact_email) setEmail(map.footer_contact_email)
        if (map.contact_whatsapp) setWhats(map.contact_whatsapp.replace(/\D/g, ''))
        if (map.contact_instagram) setInsta(map.contact_instagram.replace(/^@|^https?:\/\/(www\.)?instagram\.com\//i, ''))
      })
    supabase.from('faqs').select('*').order('id').then(({ data }) => setFaqs((data as any) || []))
  }, [])

  const card: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: 14.5, color: 'white' }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', marginBottom: 4 }}>{isAR ? 'الدعم والمساعدة' : 'Support'}</h1>
      <p style={{ fontSize: 13, color: '#7A7068', marginBottom: 20 }}>{isAR ? 'نحن هنا لمساعدتك في أي وقت.' : "We're here to help, any time."}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {whats && (
          <a href={`https://wa.me/${whats}`} target="_blank" rel="noreferrer" style={{ ...card, background: '#25D366' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.943c0 2.096.549 4.14 1.595 5.945L0 24l6.304-1.654a11.881 11.881 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.821 11.821 0 00-3.449-8.416z"/></svg>
            {isAR ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
          </a>
        )}
        <a href={`mailto:${email}`} style={{ ...card, background: '#C84B0F' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="1.5"/><path d="m3.4 7 8.6 6 8.6-6"/></svg>
          {isAR ? 'راسلنا بالبريد' : 'Email us'}
        </a>
        <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" style={{ ...card, background: '#1C1C1A' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>
          @{insta}
        </a>
      </div>

      {faqs.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: '#1C1C1A', marginBottom: 10 }}>{isAR ? 'الأسئلة الشائعة' : 'Common questions'}</h2>
          {faqs.map(f => (
            <div key={f.id} style={{ borderBottom: '1px solid #F2EDE8' }}>
              <button onClick={() => setOpen(open === f.id ? null : f.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 10, padding: '13px 2px', background: 'none', border: 'none', fontSize: 13.5, fontWeight: 700, color: '#1C1C1A', textAlign: isAR ? 'right' : 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span>{(isAR && f.question_ar) || f.question}</span>
                <span style={{ color: '#C84B0F', flexShrink: 0 }}>{open === f.id ? '−' : '+'}</span>
              </button>
              {open === f.id && <div style={{ paddingBottom: 13, fontSize: 12.5, color: '#7A7068', lineHeight: 1.6 }}>{(isAR && f.answer_ar) || f.answer}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
