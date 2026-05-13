// ════════════════════════════════════════════════════════════
// SIGNUP PAGE — /signup
// Creates a new account
// Sends email confirmation
// ════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password strength checks
  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
  }
  const passwordOk = Object.values(checks).every(Boolean)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordOk) { setError('Please meet all password requirements.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, phone: form.phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid #E8D5C4', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '48px 36px', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
        <h2 style={{ fontFamily: 'var(--font-hero)', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Check your email!</h2>
        <p style={{ fontSize: '14px', color: '#7A7068', lineHeight: 1.7 }}>
          We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" style={{ display: 'inline-block', marginTop: '24px', color: '#E8834A', fontSize: '14px', fontWeight: 500 }}>
          Back to sign in
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 6%' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-logo)', fontSize: '24px', color: '#1C1C1A', textDecoration: 'none' }}>ninoz</Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '36px' }}>
            <h1 style={{ fontFamily: 'var(--font-hero)', fontSize: '28px', fontWeight: 700, color: '#1C1C1A', marginBottom: '6px' }}>Create your account</h1>
            <p style={{ fontSize: '14px', color: '#7A7068', marginBottom: '28px' }}>Join Ninoz and give your baby the best start</p>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1C1C1A', marginBottom: '6px' }}>Full name</label>
                <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Sara Al-Mansouri" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1C1C1A', marginBottom: '6px' }}>Email address</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1C1C1A', marginBottom: '6px' }}>
                  Phone (WhatsApp) <span style={{ color: '#C9A98A', fontWeight: 400 }}>optional</span>
                </label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+966 5x xxx xxxx" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1C1C1A', marginBottom: '6px' }}>Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Create a strong password" required style={inputStyle} />
                {/* Password requirements */}
                {form.password.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { key: 'length', label: 'At least 8 characters' },
                      { key: 'upper',  label: 'One uppercase letter' },
                      { key: 'number', label: 'One number' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: checks[key as keyof typeof checks] ? '#4A7C59' : '#C9A98A' }}>
                        <span>{checks[key as keyof typeof checks] ? '✓' : '○'}</span> {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

              <p style={{ fontSize: '12px', color: '#C9A98A', lineHeight: 1.6 }}>
                By creating an account you agree to our{' '}
                <Link href="/terms" style={{ color: '#E8834A' }}>Terms</Link> and{' '}
                <Link href="/privacy" style={{ color: '#E8834A' }}>Privacy Policy</Link>.
              </p>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                background: loading ? '#C9A98A' : '#E8834A', color: 'white',
                fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#7A7068' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#E8834A', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
