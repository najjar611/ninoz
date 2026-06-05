'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid #EDE8E0', fontSize: 14, outline: 'none',
    fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#1C1C1A',
    background: 'white',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F4F0', fontFamily: 'Nunito, sans-serif', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: 'white', borderRadius: 20,
        padding: '40px 36px', border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#C84B0F', marginBottom: 6 }}>Ninoz</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1A', margin: 0 }}>Admin Login</h1>
          <p style={{ fontSize: 13, color: '#7A7068', margin: '6px 0 0' }}>Sign in to manage your website</p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
            borderRadius: 10, padding: '11px 14px', marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="admin@example.com"
              style={inp}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A7068', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="••••••••"
              style={inp}
            />
          </div>
          <button
            onClick={login}
            disabled={loading}
            style={{
              marginTop: 4, padding: '14px', background: '#C84B0F', color: 'white',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              fontFamily: 'Nunito, sans-serif', transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#B0A098', marginTop: 24, lineHeight: 1.5 }}>
          Use your Supabase Auth credentials.<br />
          Create an account in Supabase → Authentication → Users.
        </p>
      </div>
    </div>
  )
}
