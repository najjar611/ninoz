// ════════════════════════════════════════════════════════════
// FORGOT PASSWORD PAGE — /forgot-password
// Sends password reset email
// ════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 6%' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-logo)', fontSize: '24px', color: '#1C1C1A', textDecoration: 'none' }}>ninoz</Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '36px', textAlign: sent ? 'center' : 'left' }}>
            {sent ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Check your email</h2>
                <p style={{ fontSize: '14px', color: '#7A7068' }}>
                  If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
                </p>
                <Link href="/login" style={{ display: 'inline-block', marginTop: '20px', color: '#E8834A', fontSize: '14px', fontWeight: 500 }}>
                  Back to sign in
                </Link>
              </>
            ) : (
              <>
                <h1 style={{ fontFamily: 'var(--font-hero)', fontSize: '28px', fontWeight: 700, color: '#1C1C1A', marginBottom: '6px' }}>Reset password</h1>
                <p style={{ fontSize: '14px', color: '#7A7068', marginBottom: '28px' }}>Enter your email and we&apos;ll send a reset link.</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E8D5C4', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                    background: '#E8834A', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </form>
              </>
            )}
          </div>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#7A7068' }}>
            Remember it?{' '}
            <Link href="/login" style={{ color: '#E8834A', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
