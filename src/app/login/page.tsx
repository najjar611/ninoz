// ════════════════════════════════════════════════════════════
// LOGIN PAGE — /login
// Email + password login
// Google sign in
// Link to signup and forgot password
// After login → goes to /dashboard (or wherever they came from)
// ════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid #E8D5C4', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '20px 6%' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-logo)', fontSize: '24px', color: '#1C1C1A', textDecoration: 'none' }}>
          ninoz
        </Link>
      </header>

      {/* Form */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '36px' }}>

            <h1 style={{ fontFamily: 'var(--font-hero)', fontSize: '28px', fontWeight: 700, color: '#1C1C1A', marginBottom: '6px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '14px', color: '#7A7068', marginBottom: '28px' }}>
              Sign in to your Ninoz account
            </p>

            {/* Google sign in */}
            <button onClick={handleGoogle} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '12px', borderRadius: '10px', border: '1px solid #E8D5C4',
              background: 'white', fontSize: '14px', fontWeight: 500, color: '#1C1C1A',
              cursor: 'pointer', marginBottom: '20px', transition: 'border-color 0.15s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: '#E8D5C4' }} />
              <span style={{ fontSize: '12px', color: '#C9A98A' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#E8D5C4' }} />
            </div>

            {/* Email/password form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1C1C1A', marginBottom: '6px' }}>
                  Email address
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#E8834A'}
                  onBlur={e => e.target.style.borderColor = '#E8D5C4'}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#1C1C1A' }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: '12px', color: '#E8834A', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password" required autoComplete="current-password"
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    onFocus={e => e.target.style.borderColor = '#E8834A'}
                    onBlur={e => e.target.style.borderColor = '#E8D5C4'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#C9A98A', fontSize: '14px' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                background: loading ? '#C9A98A' : '#E8834A', color: 'white',
                fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s', marginTop: '4px',
              }}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Sign up link */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#7A7068' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#E8834A', fontWeight: 500, textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
