'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Catch-all runtime error boundary: if any screen throws while rendering, the
// visitor sees this friendly page (with a Try again + Home) instead of a crash.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error to the console (and any future logging service).
    console.error(error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '40px 24px', background: '#F7F4F0', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#C84B0F', letterSpacing: '-0.02em' }}>Ninoz</div>
      <div style={{ fontSize: 48 }}>😕</div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>Something went wrong</h1>
      <p style={{ fontSize: 14, color: '#7A7068', maxWidth: 360, margin: 0 }}>
        An unexpected error occurred. Please try again.
        <br />حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => reset()} style={{ padding: '13px 26px', background: '#C84B0F', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          Try again · إعادة المحاولة
        </button>
        <Link href="/" style={{ padding: '13px 26px', background: '#F2EDE8', color: '#5A5048', borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
          Home · الرئيسية
        </Link>
      </div>
    </div>
  )
}
