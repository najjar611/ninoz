'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Full-screen branded splash shown for ~2.5s when the app first opens
// (once per browser session). In the native (Capacitor) build the OS splash
// covers cold start; this covers the web/app-shell.
export default function Splash() {
  const [show, setShow] = useState(false)
  const [fading, setFading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('ninoz_splash_seen')) return
    sessionStorage.setItem('ninoz_splash_seen', '1')
    setShow(true)

    // Pull the brand logo so the splash uses the real logo, not text.
    const supabase = createClient()
    supabase.from('site_content').select('value').eq('key', 'logo_url').maybeSingle()
      .then(({ data }) => {
        if ((data as any)?.value) { setLogoUrl((data as any).value); return }
        supabase.from('logo').select('url').limit(1).maybeSingle().then(({ data: l }) => {
          if ((l as any)?.url) setLogoUrl((l as any).url)
        })
      })

    const fadeT = setTimeout(() => setFading(true), 2200)
    const hideT = setTimeout(() => setShow(false), 2700)
    return () => { clearTimeout(fadeT); clearTimeout(hideT) }
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000, background: '#14392B',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease', fontFamily: 'Nunito, sans-serif',
    }}>
      <style>{`
        @keyframes ninozSplashIn {
          0% { transform: scale(0.6) translateY(8px); opacity: 0; filter: blur(6px); }
          55% { transform: scale(1.08) translateY(0); opacity: 1; filter: blur(0); }
          75% { transform: scale(0.98); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes ninozSplashFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes ninozSplashGlow { 0%,100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 0.6; transform: scale(1.1); } }
        .ninoz-splash-logo { animation: ninozSplashIn 0.9s cubic-bezier(.16,1,.3,1) both, ninozSplashFloat 2.6s ease-in-out 0.9s infinite; }
      `}</style>
      <div style={{ position: 'relative', padding: '0 32px', maxWidth: 520, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(228,87,46,0.45), transparent 70%)', animation: 'ninozSplashGlow 2.6s ease-in-out infinite', pointerEvents: 'none' }} />
        <div className="ninoz-splash-logo" style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
          {logoUrl
            ? <img src={logoUrl} alt="Ninoz" style={{ width: '78%', maxWidth: 360, height: 'auto', objectFit: 'contain' }} />
            : <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#E4572E', letterSpacing: '-0.03em' }}>Ninoz</div>}
        </div>
      </div>
    </div>
  )
}
