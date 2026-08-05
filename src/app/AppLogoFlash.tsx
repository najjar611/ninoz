'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

// Full-screen logo "loading" flash — shown on first open, on every main page
// change, and whenever a `ninoz:flash` event fires (e.g. language switch).
export default function AppLogoFlash({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname() || ''
  const isAdmin = pathname.startsWith('/admin')
  const [show, setShow] = useState(true)
  const [n, setN] = useState(0)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (isAdmin) return
    // Allow specific transitions to opt out of the flash (e.g. after payment).
    if (typeof window !== 'undefined' && sessionStorage.getItem('ninoz_skip_flash')) {
      sessionStorage.removeItem('ninoz_skip_flash'); return
    }
    setShow(true); setN(x => x + 1)
  }, [pathname, isAdmin])

  useEffect(() => {
    const h = () => { setShow(true); setN(x => x + 1) }
    window.addEventListener('ninoz:flash', h)
    return () => window.removeEventListener('ninoz:flash', h)
  }, [])

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setShow(false), 950)
    return () => clearTimeout(t)
  }, [show, n])

  if (isAdmin) return null

  return (
    <div aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: 4000, pointerEvents: show ? 'auto' : 'none',
      background: 'radial-gradient(120% 90% at 50% 32%, #122A22, #0C1A15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: show ? 1 : 0,
      // Appear INSTANTLY (cover the new page before it shows), fade out smoothly.
      transition: show ? 'none' : 'opacity 0.55s ease',
    }}>
      <style>{`@keyframes ninozFlash{0%{transform:scale(.7);opacity:0;filter:blur(8px)}55%{opacity:1;filter:blur(0)}100%{transform:scale(1);opacity:1}}`}</style>
      <div key={n} style={{ animation: 'ninozFlash 0.85s cubic-bezier(.16,1,.3,1) both', filter: 'drop-shadow(0 0 44px rgba(245,199,126,0.35))' }}>
        {logoUrl
          ? <img src={logoUrl} alt="Ninoz" style={{ height: 150, maxWidth: '70vw', objectFit: 'contain' }} />
          : <span style={{ fontSize: '3rem', fontWeight: 800, color: '#FF7A33' }}>Ninoz</span>}
      </div>
    </div>
  )
}
